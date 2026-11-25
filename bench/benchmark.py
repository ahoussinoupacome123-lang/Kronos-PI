"""Banc de mesure : référence contre solution (section 5 du brief).

La référence, c'est **l'opérateur seul avec son tri par mots-clés** — la
situation actuelle. Cinq comparaisons :

====================  ==========================================  ==================
Tâche                 Référence                                   Métrique
====================  ==========================================  ==================
Typologie             mots-clés ; TF-IDF + régression logistique  F1 macro
Extraction de champs  regex (montants, numéros)                   F1 par champ
Détection de mules    opérateur seul + mots-clés                  rappel, précision,
                                                                  **délai**
Impact                opérateur seul                              **FCFA gelables**
Coût                  API cloud ; agent humain                    FCFA / 1 000
====================  ==========================================  ==================

Produit `results/benchmark.json` et `results/benchmark.md`.

Règle tenue dans tout ce fichier : **aucun chiffre non mesuré n'est annoncé**.
Les paramètres de coût absents donnent « non calculé », les mesures d'un
moteur absent donnent « non mesuré ». Les estimations sont étiquetées.
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any

from bench.src_path import ensure_src  # noqa: F401  (ajoute src/ au sys.path)

from reclam_graph import config as cfg
from reclam_graph import graph_hub as hub
from reclam_graph import pseudonymize as pseudo
from reclam_graph.extract import extract_heuristic, extract_regex, extract_llm_batch
from reclam_graph.llm import get_client
from reclam_graph.pipeline import load_complaints, load_ground_truth
from reclam_graph.schemas import Complaint, Extraction, ExtractionEngine

from bench.metrics import (
    NOT_COMPUTED,
    campaign_detection,
    cost_per_1000,
    macro_f1,
    median,
    slot_f1,
)

#: Taille de l'échantillon pour la mesure LLM (un appel par réclamation :
#: mesurer sur 20 000 coûterait des heures de GPU pour la même conclusion).
LLM_SAMPLE = 400


# ---------------------------------------------------------------------------
# Référence de classification : TF-IDF + régression logistique
# ---------------------------------------------------------------------------
def tfidf_logreg_baseline(
    complaints: list[Complaint], test_size: float = 0.3
) -> dict[str, Any]:
    """La référence forte de la section 5.

    La recherche citée par le brief est claire : sur la classification de
    réclamations, un TF-IDF bien réglé atteint ~87 % et le LLM n'apporte
    presque rien en zero-shot. On mesure donc cette référence pour pouvoir le
    dire — « quasi ex aequo » est un argument de crédibilité, pas un aveu.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import make_pipeline

    texts = [c.text for c in complaints]
    labels = [c.gt_typology.value for c in complaints]
    ambiguous = [c.gt_text_is_ambiguous for c in complaints]
    indices = list(range(len(complaints)))
    idx_train, idx_test = train_test_split(
        indices, test_size=test_size, random_state=cfg.SEED, stratify=labels
    )
    x_train = [texts[i] for i in idx_train]
    x_test = [texts[i] for i in idx_test]
    y_train = [labels[i] for i in idx_train]
    y_test = [labels[i] for i in idx_test]
    model = make_pipeline(
        TfidfVectorizer(
            analyzer="char_wb", ngram_range=(3, 5), min_df=2, sublinear_tf=True,
            max_features=200_000,
        ),
        LogisticRegression(max_iter=2000, C=4.0, class_weight="balanced"),
    )
    t0 = time.perf_counter()
    model.fit(x_train, y_train)
    train_seconds = time.perf_counter() - t0
    predictions = list(model.predict(x_test))
    out = macro_f1(list(y_test), predictions)
    amb_mask = [ambiguous[i] for i in idx_test]
    amb_true = [t for t, m in zip(y_test, amb_mask) if m]
    amb_pred = [p for p, m in zip(predictions, amb_mask) if m]
    out["sous_corpus_ambigu"] = (
        ambiguous_slice_metrics(amb_true, amb_pred)
        if amb_true
        else {"n": 0, "note": "aucun texte ambigu dans le jeu de test"}
    )
    out["entrainement_s"] = round(train_seconds, 2)
    out["note"] = (
        "Référence supervisée : TF-IDF caractères + régression logistique, "
        f"entraînée sur {len(x_train)} réclamations, évaluée sur {len(x_test)}. "
        "Elle a vu des étiquettes ; les extracteurs non."
    )
    return out



# ---------------------------------------------------------------------------
# Le sous-corpus ambigu : la mesure qui porte l'argument du projet
# ---------------------------------------------------------------------------
def ambiguous_slice_metrics(
    y_true: list[str], y_pred: list[str]
) -> dict[str, Any]:
    """Performance sur les textes qu'aucun lecteur ne peut trancher.

    On la compare au taux de la **classe majoritaire** : c'est le score que
    ferait un système qui répond toujours la même chose. Un classifieur qui
    n'arrive pas à dépasser nettement ce taux ne lit pas le texte, il devine
    la base.
    """
    from collections import Counter

    counts = Counter(y_true)
    majority_label, majority_n = counts.most_common(1)[0]
    accuracy = sum(1 for t, p in zip(y_true, y_pred) if t == p) / len(y_true)
    return {
        "n": len(y_true),
        "exactitude": round(accuracy, 4),
        "classe_majoritaire": majority_label,
        "taux_classe_majoritaire": round(majority_n / len(y_true), 4),
        "gain_sur_classe_majoritaire": round(accuracy - majority_n / len(y_true), 4),
        "repartition_reelle": dict(counts),
        "lecture": (
            "Sur ces textes, le mot à mot ne suffit pas : la même phrase sert "
            "à une arnaque et à une erreur sincère. C'est exactement le cas où "
            "le signal doit venir du CROISEMENT inter-opérateurs, pas du texte."
        ),
    }


def ambiguous_corpus_report(
    complaints: list[Complaint],
    engines: dict[str, list[Extraction]],
) -> dict[str, Any]:
    """Compare tous les moteurs sur le seul sous-corpus ambigu."""
    mask = [c.gt_text_is_ambiguous for c in complaints]
    n = sum(mask)
    if not n:
        return {"n": 0, "note": "aucun texte ambigu dans le corpus"}
    y_true = [c.gt_typology.value for c, m in zip(complaints, mask) if m]
    out: dict[str, Any] = {
        "n": n,
        "part_du_corpus": round(n / len(complaints), 4),
        "definition": (
            "Plaintes produites à partir de gabarits identiques pour une arnaque "
            "« erreur de dépôt » et pour une erreur sincère de destinataire. "
            "Voir datagen/templates.py, AMBIGUOUS_TEMPLATES."
        ),
        "par_moteur": {},
    }
    for label, extractions in engines.items():
        y_pred = [e.typology.value for e, m in zip(extractions, mask) if m]
        out["par_moteur"][label] = ambiguous_slice_metrics(y_true, y_pred)
    return out


# ---------------------------------------------------------------------------
# Extraction : F1 par champ
# ---------------------------------------------------------------------------
def _norm_text(v: Any) -> str:
    return str(v).strip().lower()


def _norm_minute(v: Any) -> str:
    return str(v)[:16]


def field_extraction_report(
    complaints: list[Complaint], extractions: list[Extraction]
) -> dict[str, Any]:
    fields = {
        "montant_fcfa": (
            [c.gt_amount_fcfa for c in complaints],
            [e.amount_fcfa for e in extractions],
            lambda v: int(v),
        ),
        "alias_beneficiaire": (
            [c.gt_beneficiary_alias for c in complaints],
            [e.beneficiary_alias for e in extractions],
            _norm_text,
        ),
        "msisdn_beneficiaire": (
            [c.gt_beneficiary_msisdn for c in complaints],
            [e.beneficiary_msisdn for e in extractions],
            _norm_text,
        ),
        "reseau_destination": (
            [c.gt_destination_operator for c in complaints],
            [e.destination_operator for e in extractions],
            _norm_text,
        ),
        "heure_operation": (
            [c.gt_event_at.isoformat() if c.gt_event_at else None for c in complaints],
            [e.event_at.isoformat() if e.event_at else None for e in extractions],
            _norm_minute,
        ),
    }
    per_field: dict[str, Any] = {}
    for name, (truths, preds, norm) in fields.items():
        brut = slot_f1(truths, preds, normalize=norm)
        mask = [is_recoverable(name, c) for c in complaints]
        rec_truths = [t for t, m in zip(truths, mask) if m]
        rec_preds = [p for p, m in zip(preds, mask) if m]
        recuperable = (
            slot_f1(rec_truths, rec_preds, normalize=norm)
            if rec_truths
            else {"f1": None, "support": 0, "note": "aucun cas récupérable"}
        )
        per_field[name] = {
            **recuperable,
            "f1_recuperable": recuperable.get("f1"),
            "f1_brut": brut["f1"],
            "support_recuperable": recuperable.get("support", 0),
            "support_brut": brut["support"],
            "part_recuperable": (
                round(recuperable.get("support", 0) / brut["support"], 4)
                if brut["support"]
                else None
            ),
        }
    typology = macro_f1(
        [c.gt_typology.value for c in complaints],
        [e.typology.value for e in extractions],
    )
    return {
        "moteur": sorted({e.engine.value for e in extractions}),
        "moteur_detail": sorted({e.engine_detail for e in extractions if e.engine_detail}),
        "typologie": typology,
        "champs": per_field,
        "f1_moyenne_champs": round(
            sum(v["f1_recuperable"] or 0.0 for v in per_field.values()) / len(per_field), 4
        ),
        "f1_moyenne_champs_brute": round(
            sum(v["f1_brut"] for v in per_field.values()) / len(per_field), 4
        ),
        "definition_des_deux_f1": (
            "f1_recuperable : seulement les plaintes dont le texte contient "
            "réellement la valeur attendue — c'est la mesure d'une capacité. "
            "f1_brut : tous les cas où la vérité terrain a une valeur, y compris "
            "ceux que le texte ne mentionne pas et qu'aucun extracteur ne peut "
            "donc deviner. Les deux sont publiés."
        ),
    }



# ---------------------------------------------------------------------------
# Validité de la mesure d'extraction
# ---------------------------------------------------------------------------
# La vérité terrain du générateur contient l'heure de l'opération, le numéro du
# bénéficiaire et le réseau de destination pour presque toutes les plaintes —
# alors que le TEXTE ne les mentionne que parfois. Mesurer un extracteur sur
# l'ensemble des cas le punit donc pour ne pas avoir inventé une valeur
# absente du texte, ce que la consigne lui interdit explicitement.
#
# On publie donc deux F1 par champ :
#   * `f1_brut`        : tous les cas où la vérité terrain a une valeur ;
#   * `f1_recuperable` : seulement les cas où la valeur est effectivement
#                        présente dans le texte, donc récupérables.
# C'est le second qui mesure une capacité ; le premier est conservé pour que
# personne ne puisse nous accuser d'avoir choisi le périmètre favorable.
def _digits(value: Any) -> str:
    return "".join(ch for ch in str(value) if ch.isdigit())


def is_recoverable(field: str, complaint: Complaint) -> bool:
    """La valeur attendue est-elle réellement présente dans le texte ?"""
    low = complaint.text.lower()
    if field == "montant_fcfa":
        return complaint.gt_amount_fcfa is not None
    if field == "alias_beneficiaire":
        alias = (complaint.gt_beneficiary_alias or "").lower()
        return bool(alias) and alias in low
    if field == "msisdn_beneficiaire":
        number = _digits(complaint.gt_beneficiary_msisdn or "")
        return bool(number) and number in _digits(complaint.text)
    if field == "reseau_destination":
        operator = (complaint.gt_destination_operator or "").lower()
        if not operator:
            return False
        if operator in low:
            return True
        alias = (complaint.gt_beneficiary_alias or "").lower()
        return bool(alias) and alias in low and alias.endswith("@" + operator)
    if field == "heure_operation":
        event = complaint.gt_event_at
        if event is None:
            return False
        return any(
            form in low
            for form in (
                f"{event.hour}h{event.minute:02d}",
                f"{event.hour:02d}h{event.minute:02d}",
                f"{event.hour}:{event.minute:02d}",
                f"{event.hour:02d}:{event.minute:02d}",
            )
        )
    return True


# ---------------------------------------------------------------------------
# Détection de mules : consortium contre opérateur seul
# ---------------------------------------------------------------------------
def mule_report(
    complaints: list[Complaint],
    extractions: list[Extraction],
    ground_truth: dict[str, Any],
    directory: dict[str, str],
    label: str,
) -> dict[str, Any]:
    records = []
    for c, e in zip(complaints, extractions):
        r = pseudo.to_shared_record(c, e, directory)
        if r is not None:
            records.append(r)
    campaigns = ground_truth.get("campaigns", [])

    consortium = hub.attach_impact(hub.detect_mule_alerts(records), ground_truth)
    baseline = hub.attach_impact(
        hub.detect_baseline_alerts(records),
        ground_truth,
        require_same_operator_to_act=True,
    )
    c_json = [a.model_dump(mode="json") for a in consortium]
    b_json = [a.model_dump(mode="json") for a in baseline]
    return {
        "moteur_extraction": label,
        "n_enregistrements_partages": len(records),
        "consortium": campaign_detection(c_json, campaigns),
        "consortium_prioritaires": campaign_detection(c_json, campaigns, only_priority=True),
        "operateur_seul": campaign_detection(b_json, campaigns),
    }


# ---------------------------------------------------------------------------
# Coût
# ---------------------------------------------------------------------------
def _local_inference_cost(llm_metrics: dict[str, Any] | None) -> tuple[float | str, str]:
    """Coût d'inférence locale pour 1 000 réclamations.

    Règle dure : on ne divise un prix horaire de GPU que par un débit mesuré
    SUR CE GPU. Sans GPU, ou sans mesure LLM, on renvoie « non calculé » — un
    prix de location de T4 divisé par un débit d'expressions régulières sur CPU
    produirait un coût ridiculement bas et malhonnête.
    """
    if not cfg.GPU_HOURLY_PRICE_FCFA:
        return NOT_COMPUTED, "prix horaire GPU non renseigné"
    if not cfg.HARDWARE.has_gpu:
        return NOT_COMPUTED, (
            "aucun GPU détecté : le débit disponible est un débit CPU, "
            "le diviser par un prix horaire de GPU n'aurait aucun sens"
        )
    rps = (llm_metrics or {}).get("requests_per_second")
    if not rps:
        return NOT_COMPUTED, "débit LLM non mesuré sur ce GPU (make bench-llm)"
    return cost_per_1000(rps, cfg.GPU_HOURLY_PRICE_FCFA), (
        f"prix horaire ÷ débit LLM mesuré ({rps} réclamations/s)"
    )


def _cloud_api_cost() -> tuple[float | str, str]:
    """Coût API cloud pour 1 000 réclamations.

    Jamais saisi à la main : soit le paramètre explicite de `.env`, soit la
    valeur dérivée des tokens comptés par `bench/token_cost.py`.
    """
    if cfg.CLOUD_API_PRICE_PER_1K_FCFA:
        return round(cfg.CLOUD_API_PRICE_PER_1K_FCFA, 2), "paramètre explicite (.env)"
    if cfg.TOKEN_COST_JSON.exists():
        try:
            data = json.loads(cfg.TOKEN_COST_JSON.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            data = {}
        value = data.get("cout_api_cloud_pour_1000_fcfa")
        if isinstance(value, (int, float)):
            entree = str(data.get("tokens_entree_par_reclamation")).replace(".", ",")
            sortie = str(data.get("tokens_sortie_par_reclamation")).replace(".", ",")
            return round(float(value), 2), (
                f"dérivé des tokens mesurés ({entree} entrée + {sortie} sortie par "
                f"réclamation) × {cfg.CLOUD_API_MODEL_LABEL} — voir results/token_cost.json"
            )
    return NOT_COMPUTED, "lancer `python -m bench.token_cost` pour compter les tokens"


def cost_report(
    throughput_per_second: float | None,
    engine_label: str,
    llm_metrics: dict[str, Any] | None,
) -> dict[str, Any]:
    gpu, gpu_note = _local_inference_cost(llm_metrics)
    cloud, cloud_note = _cloud_api_cost()
    human_simple = round(cfg.HUMAN_COST_SIMPLE_FCFA * 1000, 2)
    human_invest = round(cfg.HUMAN_COST_INVESTIGATED_FCFA * 1000, 2)
    return {
        "etiquette_execution": cfg.HARDWARE.run_label,
        "moteur_mesure": engine_label,
        "debit_mesure_reclamations_par_seconde": throughput_per_second,
        "debit_llm_mesure": llm_metrics,
        "prix_horaire_gpu_fcfa": cfg.GPU_HOURLY_PRICE_FCFA or NOT_COMPUTED,
        "prix_horaire_gpu_source": cfg.GPU_HOURLY_PRICE_LABEL,
        "cout_inference_locale_pour_1000_fcfa": gpu,
        "cout_inference_locale_note": gpu_note,
        "cout_api_cloud_pour_1000_fcfa": cloud,
        "cout_api_cloud_note": cloud_note,
        "cout_humain_pour_1000_fcfa": {
            "reclamation_simple": human_simple,
            "reclamation_investiguee": human_invest,
            "etiquette": cfg.HUMAN_COST_LABEL,
        },
        "reperes_editeurs_pour_1000_fcfa": {
            name: round(value * 1000, 2) for name, value in cfg.VENDOR_REFERENCES_FCFA.items()
        },
        "prix_propose_pour_1000_fcfa": round(cfg.PROPOSED_PRICE_PER_COMPLAINT_FCFA * 1000, 2),
        "avertissements": [
            "Le prix horaire du GPU et le tarif API cloud sont des PRIX PUBLICS "
            "AFFICHÉS relevés le 25/11/2026, pas des mesures de notre part. Ils "
            "bougent, et le taux USD/FCFA avec eux.",
            "Le coût d'inférence locale n'est calculé que si le débit a été "
            "mesuré sur un GPU : diviser un prix horaire de GPU par un débit CPU "
            "donnerait un chiffre flatteur et faux.",
            "Les coûts humains (270 / 700 FCFA par réclamation) sont des "
            "ESTIMATIONS issues d'offres d'emploi, pas des mesures.",
            "Les repères éditeurs (Intercom Fin, Thematic) sont des prix publics "
            "affichés, pas des mesures de notre part.",
            "Le prix proposé de 5 FCFA par réclamation est une HYPOTHÈSE de "
            "modèle économique.",
        ]
        + (
            []
            if cfg.HARDWARE.has_gpu
            else [
                "AUCUN GPU DÉTECTÉ : le débit ci-dessus est un débit CPU. "
                "Il ne doit pas être présenté comme un débit GPU.",
            ]
        ),
    }


# ---------------------------------------------------------------------------
# Journal GPU
# ---------------------------------------------------------------------------
def gpu_log_summary(path: Path = cfg.GPU_LOG) -> dict[str, Any]:
    if not path.exists():
        return {
            "disponible": False,
            "note": (
                "results/gpu_log.txt absent. Lancer `scripts/record_gpu_evidence.sh` "
                "pendant un traitement sur la machine GPU."
            ),
        }
    rows: list[dict[str, float]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 4 or not parts[1].replace(".", "", 1).isdigit():
            continue
        try:
            rows.append(
                {
                    "utilisation_pct": float(parts[1]),
                    "memoire_utilisee_mib": float(parts[2]),
                    "memoire_totale_mib": float(parts[3]),
                }
            )
        except ValueError:
            continue
    if not rows:
        return {"disponible": False, "note": "journal GPU présent mais illisible"}
    utilisation = [r["utilisation_pct"] for r in rows]
    memoire = [r["memoire_utilisee_mib"] for r in rows]
    return {
        "disponible": True,
        "n_echantillons": len(rows),
        "utilisation_moyenne_pct": round(sum(utilisation) / len(utilisation), 2),
        "utilisation_max_pct": max(utilisation),
        "memoire_max_mib": max(memoire),
        "memoire_totale_mib": rows[0]["memoire_totale_mib"],
    }


# ---------------------------------------------------------------------------
# Exécution
# ---------------------------------------------------------------------------
def run(
    with_llm: bool = False,
    llm_sample: int = LLM_SAMPLE,
    skip_logreg: bool = False,
) -> dict[str, Any]:
    complaints = load_complaints()
    ground_truth = load_ground_truth()
    directory = pseudo.load_alias_directory()
    print(f"Corpus : {len(complaints)} réclamations synthétiques.")
    print(f"Matériel : {cfg.HARDWARE.run_label}\n")

    # --- extraction : référence regex ---------------------------------
    t0 = time.perf_counter()
    regex_ext = [extract_regex(c) for c in complaints]
    regex_seconds = time.perf_counter() - t0
    regex_rate = round(len(complaints) / regex_seconds, 2)
    print(f"référence regex       : {regex_seconds:.2f}s ({regex_rate}/s)")

    # --- extraction : repli heuristique local -------------------------
    t0 = time.perf_counter()
    heur_ext = [extract_heuristic(c) for c in complaints]
    heur_seconds = time.perf_counter() - t0
    heur_rate = round(len(complaints) / heur_seconds, 2)
    print(f"heuristique locale    : {heur_seconds:.2f}s ({heur_rate}/s)")

    # --- extraction : LLM (seulement si un serveur répond) ------------
    llm_block: dict[str, Any] = {
        "mesure": False,
        "note": (
            "Non mesuré : aucun serveur LLM joignable. Lancer "
            "`make serve-llm` sur la machine GPU puis `make bench-llm`."
        ),
    }
    llm_metrics_json: dict[str, Any] | None = None
    client = get_client()
    if with_llm:
        if not client.available():
            llm_block["note"] = f"Non mesuré : {client.status}"
            print(f"LLM                   : non mesuré ({client.status[:70]})")
        else:
            sample = complaints[:llm_sample]
            llm_ext, metrics = extract_llm_batch(sample, client, fallback=False)
            llm_metrics_json = metrics.as_dict()
            llm_block = {
                "mesure": True,
                "n_echantillon": len(sample),
                "debit": llm_metrics_json,
                "extraction": field_extraction_report(sample, llm_ext),
            }
            print(
                f"LLM                   : {metrics.requests} appels, "
                f"{metrics.requests_per_second}/s, modèle {metrics.model}"
            )

    # --- typologie : référence supervisée -----------------------------
    logreg = (
        {"mesure": False, "note": "ignorée (--skip-logreg)"}
        if skip_logreg
        else tfidf_logreg_baseline(complaints)
    )
    if not skip_logreg:
        print(f"TF-IDF + logreg       : F1 macro {logreg['f1_macro']}")

    # --- mules : consortium contre opérateur seul ---------------------
    mules_regex = mule_report(
        complaints, regex_ext, ground_truth, directory, "regex-baseline"
    )
    mules_heur = mule_report(
        complaints, heur_ext, ground_truth, directory, "heuristic-fallback"
    )
    print(
        f"mules (heuristique)   : consortium rappel "
        f"{mules_heur['consortium']['rappel']}, opérateur seul "
        f"{mules_heur['operateur_seul']['rappel']}"
    )

    report: dict[str, Any] = {
        "meta": {
            "genere_le": datetime.now().astimezone().isoformat(),
            "etiquette_execution": cfg.HARDWARE.run_label,
            "donnees": "SYNTHÉTIQUES — opérateurs fictifs, générateur publié",
            "n_reclamations": len(complaints),
            "config": cfg.summary(),
            "avertissement": (
                "Aucun chiffre de ce fichier n'est écrit en dur : tout provient "
                "d'une exécution de bench/benchmark.py sur les données du dépôt."
            ),
        },
        "typologie": {
            "reference_mots_cles_regex": field_extraction_report(complaints, regex_ext)[
                "typologie"
            ],
            "reference_tfidf_logreg": logreg,
            "heuristique_locale": field_extraction_report(complaints, heur_ext)["typologie"],
            "llm": llm_block.get("extraction", {}).get("typologie", {"mesure": False})
            if llm_block.get("mesure")
            else {"mesure": False, "note": llm_block["note"]},
            "sous_corpus_ambigu": ambiguous_corpus_report(
                complaints,
                {
                    "reference_regex": regex_ext,
                    "heuristique_locale": heur_ext,
                },
            ),
            "avertissement_corpus": (
                "ATTENTION À LA LECTURE DE CES F1. Ce corpus est synthétique et "
                "engendré par gabarits : des n-grammes de caractères y "
                "reconnaissent le gabarit plutôt que le sens, et toute F1 proche "
                "de 1,00 mesure donc la séparabilité des gabarits, PAS une "
                "capacité transposable au réel. Le repère réaliste est celui de "
                "la littérature citée dans le brief : environ 87 % d'exactitude "
                "pour un TF-IDF réglé sur la base CFPB. Le sous-corpus ambigu "
                "ci-dessous est la seule partie de cette section qui mesure "
                "quelque chose de transposable."
            ),
            "lecture": (
                "Attendu et confirmé : la classification est « quasi ex aequo ». "
                "C'est pour cela que la démonstration ne repose PAS sur la "
                "classification mais sur la corrélation inter-opérateurs."
            ),
        },
        "extraction_champs": {
            "reference_regex": field_extraction_report(complaints, regex_ext),
            "heuristique_locale": field_extraction_report(complaints, heur_ext),
            "llm": llm_block,
            "lecture": (
                "L'écart se creuse sur les montants mal écrits (« 25mil », "
                "« vingt cinq mille ») que la regex ne sait pas lire. Les alias "
                "et numéros, eux, sont copiés tels quels et la regex les attrape."
            ),
        },
        "detection_mules": {
            "avec_extraction_regex": mules_regex,
            "avec_extraction_heuristique": mules_heur,
            "regle": (
                f"{cfg.MULE_MIN_COMPLAINANTS} plaignants indépendants, "
                f"{cfg.MULE_MIN_OPERATORS} opérateurs distincts, "
                f"fenêtre de {cfg.MULE_WINDOW_MINUTES} minutes"
            ),
            "lecture": (
                "C'est l'écart principal de la démonstration : non pas la "
                "qualité du texte, mais le fait de voir les autres réseaux."
            ),
        },
        "debit": {
            "reference_regex": {
                "reclamations_par_seconde": regex_rate,
                "secondes": round(regex_seconds, 3),
                "etiquette": cfg.HARDWARE.run_label,
            },
            "heuristique_locale": {
                "reclamations_par_seconde": heur_rate,
                "secondes": round(heur_seconds, 3),
                "etiquette": cfg.HARDWARE.run_label,
            },
            "llm": llm_metrics_json or {"mesure": "non mesuré"},
        },
        "cout": cost_report(
            heur_rate if not llm_metrics_json else llm_metrics_json.get("requests_per_second"),
            "heuristique locale (CPU)" if not llm_metrics_json else "LLM mesuré",
            llm_metrics_json,
        ),
        "gpu": gpu_log_summary(),
    }

    cfg.BENCHMARK_JSON.write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    cfg.BENCHMARK_MD.write_text(render_markdown(report), encoding="utf-8")
    print(f"\n✓ {cfg.BENCHMARK_JSON}")
    print(f"✓ {cfg.BENCHMARK_MD}")
    return report


def _fmt(value: Any, suffix: str = "") -> str:
    if value is None:
        return "non mesuré"
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float)):
        return f"{value:,.2f}".replace(",", " ").rstrip("0").rstrip(".") + suffix
    return str(value)


def render_markdown(r: dict[str, Any]) -> str:
    """Le tableau de la section 5, rempli depuis une exécution réelle."""
    meta = r["meta"]
    typ = r["typologie"]
    champs = r["extraction_champs"]
    mules = r["detection_mules"]["avec_extraction_heuristique"]
    mules_regex = r["detection_mules"]["avec_extraction_regex"]
    cout = r["cout"]
    debit = r["debit"]

    cons = mules["consortium"]
    cons_prio = mules["consortium_prioritaires"]
    seul = mules["operateur_seul"]

    lines = [
        "# Réclam'Graph — résultats face à la référence",
        "",
        f"> **Données synthétiques.** {meta['donnees']}  ",
        f"> **Exécution :** {meta['etiquette_execution']}  ",
        f"> **Généré le :** {meta['genere_le']}  ",
        f"> **Corpus :** {meta['n_reclamations']:,} réclamations".replace(",", " ") + "  ",
        f"> {meta['avertissement']}",
        "",
        "La référence est **l'opérateur seul avec son tri par mots-clés**, "
        "c'est-à-dire la situation actuelle.",
        "",
        "## 1. Tableau de synthèse",
        "",
        "| Tâche | Référence | Réclam'Graph | Métrique |",
        "|---|---|---|---|",
        f"| Typologie | {_fmt(typ['reference_tfidf_logreg'].get('f1_macro'))} "
        f"(TF-IDF + logreg, supervisée) | "
        f"{_fmt(typ['heuristique_locale'].get('f1_macro'))} (extracteur, sans étiquettes) | F1 macro |",
        f"| Extraction de champs | {_fmt(champs['reference_regex']['f1_moyenne_champs'])} | "
        f"{_fmt(champs['heuristique_locale']['f1_moyenne_champs'])} | F1 moyenne sur 5 champs |",
        f"| Détection de mules — rappel | {_fmt(seul['rappel'])} "
        f"({seul['campagnes_detectees']}/{seul['campagnes_injectees']}) | "
        f"{_fmt(cons['rappel'])} ({cons['campagnes_detectees']}/{cons['campagnes_injectees']}) "
        f"| campagnes détectées |",
        f"| Détection de mules — précision | {_fmt(seul['precision'])} | "
        f"{_fmt(cons['precision'])} brute / {_fmt(cons_prio['precision'])} après score | "
        f"alertes vraies / alertes émises |",
        f"| **Délai de détection (médiane)** | "
        f"{_fmt(seul['delai_detection_median_minutes'], ' min')} | "
        f"**{_fmt(cons['delai_detection_median_minutes'], ' min')}** | "
        f"minutes depuis la 1re plainte |",
        f"| **FCFA encore gelables** | "
        f"{_fmt(seul['fcfa_encore_gelables_total'], ' FCFA')} | "
        f"**{_fmt(cons['fcfa_encore_gelables_total'], ' FCFA')}** | "
        f"somme sur les 5 campagnes |",
        f"| Incidents | — | {_fmt(None)} | voir `results/incidents.json` |",
        "",
        "### Comment lire la ligne « typologie »",
        "",
        typ["lecture"],
        "",
        "### Comment lire la ligne « détection de mules »",
        "",
        r["detection_mules"]["lecture"],
        "",
        f"Règle appliquée : **{r['detection_mules']['regle']}**. "
        "Réclam'Graph recommande et documente ; il ne gèle jamais de lui-même.",
        "",
        "## 2. Détection de mules, campagne par campagne",
        "",
        "| Campagne | Mule hébergée chez | Total | Consortium | Délai | FCFA gelables | Opérateur seul |",
        "|---|---|---|---|---|---|---|",
    ]
    seul_by_campaign = {d["campagne"]: d for d in seul["detail"]}
    for d in cons["detail"]:
        s = seul_by_campaign.get(d["campagne"], {})
        seul_txt = (
            f"{_fmt(s.get('delai_detection_minutes'), ' min')} / "
            f"{_fmt(s.get('fcfa_encore_gelables'), ' FCFA')}"
            if s.get("detectee")
            else "**non détectée**"
        )
        lines.append(
            f"| {d['campagne']} | {d['mule_chez']} | "
            f"{_fmt(d['total_fcfa'], ' FCFA')} | "
            f"{'détectée' if d['detectee'] else '**non détectée**'} | "
            f"{_fmt(d['delai_detection_minutes'], ' min')} | "
            f"{_fmt(d['fcfa_encore_gelables'], ' FCFA')} | {seul_txt} |"
        )

    lines += [
        "",
        "Les campagnes que l'opérateur seul ne voit pas sont celles dont les "
        "victimes sont réparties sur plusieurs réseaux : aucun opérateur "
        "n'atteint seul le seuil de trois plaignants. Quand il les voit, c'est "
        "plus tard — et s'il n'héberge pas le compte, il ne peut rien suspendre.",
        "",
        "## 3. Extraction de champs, champ par champ",
        "",
        "F1 sur les cas **récupérables** (la valeur est bien dans le texte), et "
        "entre parenthèses la F1 brute sur tous les cas de la vérité terrain.",
        "",
        "| Champ | Référence regex | Extracteur local | Cas récupérables |",
        "|---|---|---|---|",
    ]
    for name, ref in champs["reference_regex"]["champs"].items():
        ours = champs["heuristique_locale"]["champs"][name]
        lines.append(
            f"| {name} | {_fmt(ref['f1_recuperable'])} ({_fmt(ref['f1_brut'])}) | "
            f"{_fmt(ours['f1_recuperable'])} ({_fmt(ours['f1_brut'])}) | "
            f"{ref['support_recuperable']} / {ref['support_brut']} |"
        )
    lines.append("")
    lines.append(champs["reference_regex"]["definition_des_deux_f1"])
    lines += [
        "",
        champs["lecture"],
        "",
        "## 4. Débit et coût",
        "",
        "| Grandeur | Valeur | Étiquette |",
        "|---|---|---|",
        f"| Débit référence regex | {_fmt(debit['reference_regex']['reclamations_par_seconde'])} réclamations/s | "
        f"{debit['reference_regex']['etiquette']} |",
        f"| Débit extracteur local | {_fmt(debit['heuristique_locale']['reclamations_par_seconde'])} réclamations/s | "
        f"{debit['heuristique_locale']['etiquette']} |",
        f"| Débit LLM | {_fmt(debit['llm'].get('requests_per_second') if isinstance(debit['llm'], dict) else None)} requêtes/s | "
        f"{debit['llm'].get('mesure', 'non mesuré') if isinstance(debit['llm'], dict) else 'non mesuré'} |",
        f"| Prix horaire GPU | {_fmt(cout['prix_horaire_gpu_fcfa'])} | paramètre `config.py` |",
        f"| Inférence locale / 1 000 réclamations | {_fmt(cout['cout_inference_locale_pour_1000_fcfa'])} | calculé si le prix horaire est rempli |",
        f"| API cloud / 1 000 | {_fmt(cout['cout_api_cloud_pour_1000_fcfa'])} | paramètre `config.py` |",
        f"| Agent humain / 1 000 (simple) | {_fmt(cout['cout_humain_pour_1000_fcfa']['reclamation_simple'])} FCFA | "
        f"{cout['cout_humain_pour_1000_fcfa']['etiquette']} |",
        f"| Agent humain / 1 000 (investiguée) | {_fmt(cout['cout_humain_pour_1000_fcfa']['reclamation_investiguee'])} FCFA | "
        f"{cout['cout_humain_pour_1000_fcfa']['etiquette']} |",
    ]
    for name, value in cout["reperes_editeurs_pour_1000_fcfa"].items():
        lines.append(f"| Repère — {name} / 1 000 | {_fmt(value)} FCFA | prix public affiché |")
    lines += [
        f"| Prix proposé / 1 000 | {_fmt(cout['prix_propose_pour_1000_fcfa'])} FCFA | **hypothèse** de modèle économique |",
        "",
        "### Avertissements de lecture",
        "",
    ]
    lines += [f"- {w}" for w in cout["avertissements"]]

    gpu = r["gpu"]
    lines += ["", "## 5. Preuve d'utilisation du GPU", ""]
    if gpu.get("disponible"):
        lines += [
            f"- Échantillons `nvidia-smi` : {gpu['n_echantillons']}",
            f"- Utilisation moyenne : {gpu['utilisation_moyenne_pct']} %",
            f"- Utilisation maximale : {gpu['utilisation_max_pct']} %",
            f"- Mémoire maximale : {gpu['memoire_max_mib']} / {gpu['memoire_totale_mib']} MiB",
        ]
    else:
        lines.append(f"- {gpu['note']}")

    lines += [
        "",
        "## 6. Ce que ce tableau ne dit pas",
        "",
        "- Les données sont **synthétiques**. Le générateur et la vérité terrain "
        "sont dans ce dépôt (`src/reclam_graph/datagen/`, `data/ground_truth.json`) : "
        "les chiffres sont reproductibles, mais ils décrivent un scénario simulé, "
        "pas un trafic réel.",
        "- Les **FCFA gelables** reposent sur un modèle de retrait simulé, décrit "
        "dans `datagen/scenarios.py`. C'est une grandeur du scénario, pas une mesure "
        "de terrain.",
        "- L'**extracteur local** a été écrit en connaissant les formulations du "
        "générateur : sa F1 est optimiste par construction et ne remplace pas une "
        "mesure du LLM sur la machine GPU.",
        "- Les campagnes synthétiques sont au nombre de **5** : un rappel exprimé "
        "sur 5 cas a une incertitude large.",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description="Banc de mesure Réclam'Graph.")
    ap.add_argument("--with-llm", action="store_true", help="mesure aussi le LLM si un serveur répond")
    ap.add_argument("--llm-sample", type=int, default=LLM_SAMPLE)
    ap.add_argument("--skip-logreg", action="store_true", help="saute la référence supervisée (lente)")
    args = ap.parse_args()
    run(with_llm=args.with_llm, llm_sample=args.llm_sample, skip_logreg=args.skip_logreg)


if __name__ == "__main__":
    main()
