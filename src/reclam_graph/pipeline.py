"""Pipeline de bout en bout (orchestration des six blocs).

    lire -> pseudonymiser -> croiser -> agir

Produit tous les fichiers de `results/`, dont `demo_bundle.json` qui permet à
l'interface de rejouer la démonstration **sans LLM ni GPU**. Le brief l'exige :
« pré-calculer les résultats ; ne pas dépendre d'une session Colab gratuite en
direct ».
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Sequence

from . import config as cfg
from . import graph_hub as hub
from . import pseudonymize as pseudo
from .audit import AuditLog, report as audit_report
from .dossier import build_dispute_file, decide, render_markdown, summarize
from .extract import extract
from .radar import detect_incidents, evaluate_against_ground_truth
from .schemas import Complaint, Decision, Extraction, MuleAlert, SharedRecord

#: On ne sérialise pas 6 700 dossiers complets : tous ceux rattachés à une
#: alerte, plus un échantillon, suffisent à la démo et au contrôle.
DOSSIER_SAMPLE = 200


def load_complaints(path: Path = cfg.COMPLAINTS_FILE) -> list[Complaint]:
    if not path.exists():
        raise FileNotFoundError(
            f"{path} est absent — lancez d'abord `make data` (génération synthétique)."
        )
    return [
        Complaint.model_validate_json(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def load_ground_truth(path: Path = cfg.GROUND_TRUTH_FILE) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def _graph_payload(
    alert: MuleAlert, records_by_ref: dict[str, SharedRecord]
) -> dict[str, Any]:
    """Noeuds et arêtes pour le graphe animé de l'UI.

    Tout est pseudonymisé : ce sont les données telles que le hub les voit.
    L'ordre chronologique permet d'animer l'allumage du noeud mule.
    """
    rows = [records_by_ref[r] for r in alert.evidence_complaint_refs if r in records_by_ref]
    rows.sort(key=lambda r: r.ts)
    nodes = [
        {
            "id": alert.alias_hmac,
            "kind": "beneficiaire",
            "label": f"bénéficiaire {alert.alias_hmac[:8]}…",
        }
    ]
    seen_ops: set[str] = set()
    edges: list[dict[str, Any]] = []
    for i, r in enumerate(rows):
        nodes.append(
            {
                "id": r.complainant_hmac,
                "kind": "plaignant",
                "label": f"plaignant {r.complainant_hmac[:6]}…",
                "operator": r.operator,
                "order": i,
                "ts": r.ts.isoformat(),
            }
        )
        if r.operator not in seen_ops:
            seen_ops.add(r.operator)
            nodes.append({"id": r.operator, "kind": "operateur", "label": r.operator})
        edges.append(
            {
                "source": r.complainant_hmac,
                "target": alert.alias_hmac,
                "ts": r.ts.isoformat(),
                "operator": r.operator,
                "amount_rounded_fcfa": r.amount_rounded_fcfa,
                "typology": r.typology.value,
                "order": i,
                # Vrai dès que la règle a basculé : c'est à cet instant que le
                # noeud mule doit s'allumer dans l'animation.
                "after_alert": r.ts > alert.alert_at,
            }
        )
    return {"nodes": nodes, "edges": edges, "fires_at": alert.alert_at.isoformat()}


def run(
    engine: str = "auto",
    embed_engine: str = "auto",
    limit: int | None = None,
    write: bool = True,
    verbose: bool = True,
) -> dict[str, Any]:
    """Exécute le pipeline complet et renvoie le paquet de démonstration."""
    t_start = time.perf_counter()
    log = lambda m: (print(m) if verbose else None)  # noqa: E731

    # ---- 1. Lire ---------------------------------------------------------
    complaints = load_complaints()
    if limit:
        complaints = complaints[:limit]
    ground_truth = load_ground_truth()
    directory = pseudo.load_alias_directory()
    log(f"① lire          : {len(complaints)} réclamations, "
        f"annuaire de {len(directory)} alias")

    # ---- 2. Extraire -----------------------------------------------------
    t0 = time.perf_counter()
    extractions, llm_metrics = extract(complaints, engine=engine)
    extract_seconds = time.perf_counter() - t0
    engines_used = sorted({e.engine.value for e in extractions})
    log(f"② extraire      : {extract_seconds:.2f}s "
        f"({len(complaints) / max(extract_seconds, 1e-9):.0f} réclamations/s) "
        f"— moteur(s) : {', '.join(engines_used)}")

    # ---- 3. Pseudonymiser ------------------------------------------------
    t0 = time.perf_counter()
    records: list[SharedRecord] = []
    for c, e in zip(complaints, extractions):
        rec = pseudo.to_shared_record(c, e, directory)
        if rec is not None:
            records.append(rec)
    pseudo_seconds = time.perf_counter() - t0
    log(f"③ pseudonymiser : {len(records)} enregistrements partagés "
        f"sur {len(complaints)} ({len(records) / len(complaints):.1%}) — "
        f"le reste ne quitte pas l'opérateur")

    # ---- 4. Croiser ------------------------------------------------------
    t0 = time.perf_counter()
    consortium = hub.attach_impact(hub.detect_mule_alerts(records), ground_truth)
    baseline = hub.attach_impact(
        hub.detect_baseline_alerts(records),
        ground_truth,
        require_same_operator_to_act=True,
    )
    hub_seconds = time.perf_counter() - t0
    log(f"④ croiser       : {len(consortium)} alertes consortium "
        f"({sum(1 for a in consortium if a.is_priority)} prioritaires), "
        f"{len(baseline)} alertes opérateur-seul — en {hub_seconds:.2f}s")

    # ---- 5. Radar d'incidents -------------------------------------------
    t0 = time.perf_counter()
    incidents, embed_info = detect_incidents(
        complaints, extractions, embed_engine=embed_engine
    )
    radar_seconds = time.perf_counter() - t0
    incident_eval = evaluate_against_ground_truth(incidents, ground_truth)
    log(f"⑤ radar         : {len(incidents)} incident(s), "
        f"rappel {incident_eval.get('rappel')} — embeddings : "
        f"{embed_info.get('engine')} en {radar_seconds:.2f}s")

    # ---- 6. Agir : dossiers, minuteurs, audit ---------------------------
    by_id = {c.complaint_id: c for c in complaints}
    ext_by_id = {e.complaint_id: e for e in extractions}
    records_by_ref = {r.local_complaint_ref: r for r in records}
    alert_by_ref: dict[str, MuleAlert] = {}
    for a in consortium:
        for ref in a.evidence_complaint_refs:
            current = alert_by_ref.get(ref)
            if current is None or a.score > current.score:
                alert_by_ref[ref] = a

    decisions: dict[str, int] = {}
    for cid, e in ext_by_id.items():
        d, _ = decide(e, alert_by_ref.get(cid))
        decisions[d.value] = decisions.get(d.value, 0) + 1

    dossier_refs = list(alert_by_ref.keys())
    others = [c.complaint_id for c in complaints if c.complaint_id not in alert_by_ref]
    dossier_refs += others[:DOSSIER_SAMPLE]
    dossiers = [
        build_dispute_file(by_id[r], ext_by_id[r], alert_by_ref.get(r))
        for r in dossier_refs
        if r in by_id
    ]
    log(f"⑥ agir          : {len(dossiers)} dossiers construits "
        f"(tous ceux liés à une alerte + {DOSSIER_SAMPLE} échantillons) — "
        f"décisions sur le corpus complet : {decisions}")

    audit = AuditLog(path=cfg.AUDIT_FILE)
    audit._entries = []  # on repart d'un journal propre à chaque exécution
    audit.append(
        actor="pipeline",
        action="EXECUTION_PIPELINE",
        subject_type="corpus",
        subject_id=str(cfg.COMPLAINTS_FILE.name),
        evidence={
            "n_reclamations": len(complaints),
            "moteurs_extraction": engines_used,
            "moteur_embeddings": embed_info.get("engine"),
            "materiel": cfg.execution_label(engines_used, embed_info.get("engine")),
            "donnees": "synthétiques",
        },
    )
    for a in consortium:
        audit.append(
            actor="hub.reclam-graph",
            action="ALERTE_MULE_RECOMMANDEE",
            subject_type="alias_hmac",
            subject_id=a.alias_hmac,
            rule=a.rule,
            thresholds={
                "plaignants_min": cfg.MULE_MIN_COMPLAINANTS,
                "operateurs_min": cfg.MULE_MIN_OPERATORS,
                "fenetre_minutes": cfg.MULE_WINDOW_MINUTES,
            },
            evidence={
                "resume": a.headline,
                "preuves_reclamations": a.evidence_complaint_refs,
                "operateurs_a_prevenir": a.operators,
                "alerte_a": a.alert_at.isoformat(),
                "delai_detection_minutes": a.detection_delay_minutes,
                "score": a.score,
                "prioritaire": a.is_priority,
                "fcfa_encore_gelables": a.freezable_fcfa,
                "note_impact": a.impact_note,
            },
            decision=Decision.GELER if a.is_priority else None,
            human_validator=None,  # à renseigner par l'opérateur
            ts=a.alert_at,
        )
    for d in dossiers[:DOSSIER_SAMPLE]:
        audit.append(
            actor="pipeline",
            action="DOSSIER_CONSTRUIT",
            subject_type="dossier",
            subject_id=d.dossier_id,
            evidence={
                "reclamation": d.complaint_id,
                "montant_fcfa": d.amount_fcfa,
                "echeance_remboursement": d.timer.refund_due_at.isoformat(),
                "echeance_reponse_client": d.timer.client_answer_due_at.isoformat(),
            },
            decision=d.decision,
            human_validator=None,
            ts=d.created_at,
        )
    integrity_ok, integrity_problems = audit.verify_chain()
    log(f"   audit        : {len(audit)} entrées, chaîne intègre : {integrity_ok}")

    # ---- Paquet de démonstration ----------------------------------------
    demo_case = _build_demo_case(ground_truth, by_id, ext_by_id, alert_by_ref)
    models = hub.cashout_models_from_ground_truth(ground_truth)
    total_seconds = time.perf_counter() - t_start

    bundle: dict[str, Any] = {
        "meta": {
            "genere_le": datetime.now().astimezone().isoformat(),
            "etiquette_execution": cfg.execution_label(
                engines_used, embed_info.get("engine")
            ),
            "materiel_present": cfg.HARDWARE.run_label,
            "donnees": "SYNTHÉTIQUES — opérateurs fictifs",
            "config": cfg.summary(),
            "moteurs_extraction": engines_used,
            "moteur_extraction_detail": sorted(
                {e.engine_detail for e in extractions if e.engine_detail}
            ),
            "moteur_embeddings": embed_info,
            "llm": llm_metrics.as_dict() if llm_metrics else None,
            "temps": {
                "extraction_s": round(extract_seconds, 3),
                "pseudonymisation_s": round(pseudo_seconds, 3),
                "hub_s": round(hub_seconds, 3),
                "radar_s": round(radar_seconds, 3),
                "total_s": round(total_seconds, 3),
                "reclamations_par_seconde_extraction": round(
                    len(complaints) / max(extract_seconds, 1e-9), 2
                ),
            },
            "confidentialite": pseudo.privacy_report(),
        },
        "volumes": {
            "n_reclamations": len(complaints),
            "n_enregistrements_partages": len(records),
            "part_partagee": round(len(records) / len(complaints), 4),
            "decisions_corpus_complet": decisions,
        },
        "alertes_consortium": [a.model_dump(mode="json") for a in consortium],
        "alertes_operateur_seul": [a.model_dump(mode="json") for a in baseline],
        "incidents": [i.model_dump(mode="json") for i in incidents],
        "evaluation_incidents": incident_eval,
        "graphes": {
            a.alert_id: _graph_payload(a, records_by_ref)
            for a in consortium
            if a.is_priority
        },
        "courbes_gelables": {
            cid: m.balance_curve() for cid, m in models.items()
        },
        "cas_demo": demo_case,
        "dossiers": [d.model_dump(mode="json") for d in dossiers[:DOSSIER_SAMPLE]],
        "resume_dossiers": summarize(dossiers),
        "audit": audit_report(audit.entries),
        "verite_terrain": {
            "campagnes": ground_truth.get("campaigns", []),
            "incidents": ground_truth.get("incidents", []),
            "leurres": ground_truth.get("decoys", []),
        },
    }

    if write:
        cfg.ALERTS_FILE.write_text(
            json.dumps(bundle["alertes_consortium"], indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        cfg.BASELINE_ALERTS_FILE.write_text(
            json.dumps(bundle["alertes_operateur_seul"], indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        cfg.INCIDENTS_FILE.write_text(
            json.dumps(
                {"alertes": bundle["incidents"], "evaluation": incident_eval},
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        cfg.DOSSIERS_FILE.write_text(
            json.dumps(bundle["dossiers"], indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        audit.flush()
        cfg.DEMO_BUNDLE.write_text(
            json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        with cfg.EXTRACTIONS_FILE.open("w", encoding="utf-8") as fh:
            for e in extractions:
                fh.write(e.model_dump_json() + "\n")
        with cfg.SHARED_RECORDS_FILE.open("w", encoding="utf-8") as fh:
            for r in records:
                fh.write(r.model_dump_json() + "\n")
        log(f"\n✓ paquet de démonstration → {cfg.DEMO_BUNDLE}")
        log(f"✓ alertes → {cfg.ALERTS_FILE}")
        log(f"✓ audit   → {cfg.AUDIT_FILE}")
    return bundle


def _build_demo_case(
    ground_truth: dict[str, Any],
    by_id: dict[str, Complaint],
    ext_by_id: dict[str, Extraction],
    alert_by_ref: dict[str, MuleAlert],
) -> dict[str, Any]:
    """Le cas d'ouverture de la démo : la première victime de CMP-01."""
    campaign = next(
        (c for c in ground_truth.get("campaigns", []) if c.get("narrative_demo_case")),
        None,
    )
    if not campaign:
        return {}
    first_ref = campaign["victims"][0]["complaint_id"]
    complaint = by_id.get(first_ref)
    if complaint is None:
        return {}
    extraction = ext_by_id[first_ref]
    alert = alert_by_ref.get(first_ref)
    dossier = build_dispute_file(complaint, extraction, alert)
    return {
        "campagne": campaign["campaign_id"],
        "reclamation": complaint.public(),
        "extraction": extraction.model_dump(mode="json"),
        "verite_terrain": {
            "typologie": complaint.gt_typology.value if complaint.gt_typology else None,
            "montant_fcfa": complaint.gt_amount_fcfa,
            "alias_beneficiaire": complaint.gt_beneficiary_alias,
        },
        "alerte": alert.model_dump(mode="json") if alert else None,
        "resume_alerte": alert.headline if alert else None,
        "dossier": dossier.model_dump(mode="json"),
        "dossier_markdown": render_markdown(dossier, now=complaint.received_at),
        "chronologie": [
            {
                "reclamation": v["complaint_id"],
                "operateur": v["operator"],
                "montant_fcfa": v["amount_fcfa"],
                "credit_a": v["credit_at"],
                "plainte_a": v["complaint_at"],
            }
            for v in campaign["victims"]
        ],
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Pipeline Réclam'Graph de bout en bout.")
    ap.add_argument(
        "--engine",
        default="auto",
        choices=["auto", "llm", "regex", "heuristic"],
        help="moteur d'extraction (auto : LLM si joignable, repli heuristique sinon)",
    )
    ap.add_argument(
        "--embed-engine", default="auto", choices=["auto", "bge-m3", "tfidf"]
    )
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--no-write", action="store_true")
    args = ap.parse_args()
    run(
        engine=args.engine,
        embed_engine=args.embed_engine,
        limit=args.limit,
        write=not args.no_write,
    )


if __name__ == "__main__":
    main()
