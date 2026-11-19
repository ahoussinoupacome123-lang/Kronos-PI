"""Dossier de litige PI-SPI : demande d'annulation pré-remplie (bloc 6).

Le format reprend l'**ossature** du message ISO 20022 `camt.056`
(*FIToFIPaymentCancellationRequest*), que PI-SPI utilise comme standard de
messagerie. Ce n'est volontairement **pas** présenté comme un message ISO
20022 valide et certifié : c'est une structure lisible, calquée sur la vraie,
qu'un participant doit faire valider avant tout usage en production. Le dire
est plus solide que de laisser croire le contraire devant un jury.

Contrainte métier incontournable : avec PI-SPI, **un paiement confirmé ne peut
pas être annulé unilatéralement**. Une demande d'annulation requiert l'accord
du bénéficiaire, et le remboursement est à l'initiative du bénéficiaire. Le
dossier est donc une *demande* motivée et datée, pas un ordre.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Sequence

from . import config as cfg
from .schemas import (
    Complaint,
    Decision,
    DisputeFile,
    Extraction,
    MuleAlert,
    RegulatoryTimer,
    Typology,
)
from .timer import build_timer

#: Codes de motif d'annulation (sous-ensemble des codes ISO 20022 usuels).
REASON_CODES = {
    Decision.GELER: ("FRAD", "Origine frauduleuse suspectée (compte mule probable)"),
    Decision.REMBOURSER: ("CUST", "Annulation demandée par le client (erreur de destinataire)"),
    Decision.A_INSTRUIRE: ("NARR", "À instruire — motif détaillé en clair"),
}


def decide(
    extraction: Extraction,
    alert: MuleAlert | None = None,
) -> tuple[Decision, str]:
    """Une entrée, deux sorties : geler ou rembourser.

    `geler` n'est **jamais** une action : c'est une recommandation adressée à
    l'opérateur, qui tranche. Voir le principe non négociable du brief.
    """
    if alert is not None and alert.is_priority:
        return (
            Decision.GELER,
            (
                f"Rattachée à une alerte « mule probable » ({alert.n_complainants} "
                f"plaignants, {alert.n_operators} opérateurs, règle : {alert.rule}). "
                f"Recommandation de suspension des retraits ; décision humaine "
                f"chez l'opérateur."
            ),
        )
    if extraction.typology in (
        Typology.ERREUR_DESTINATAIRE_SINCERE,
        Typology.ARNAQUE_ERREUR_DEPOT,
    ) and (extraction.beneficiary_alias or extraction.beneficiary_msisdn):
        return (
            Decision.REMBOURSER,
            (
                "Transfert vers un tiers identifié, sans signal inter-opérateurs "
                "suffisant pour une alerte mule : demande d'annulation PI-SPI "
                "pré-remplie et minutée."
            ),
        )
    return (
        Decision.A_INSTRUIRE,
        "Ni bénéficiaire identifiable ni signal de campagne : file de traitement normale.",
    )


def _iso20022_inspired(
    complaint: Complaint,
    extraction: Extraction,
    decision: Decision,
    rationale: str,
) -> dict[str, Any]:
    code, label = REASON_CODES[decision]
    amount = extraction.amount_fcfa
    return {
        "_avertissement": (
            "Structure INSPIRÉE de ISO 20022 camt.056 "
            "(FIToFIPaymentCancellationRequest). Non certifiée : à faire valider "
            "par le participant avant tout usage en production."
        ),
        "Document": {
            "FIToFIPmtCxlReq": {
                "Assgnmt": {
                    "Id": f"CXL-{complaint.complaint_id}",
                    "Assgnr": {"Agt": {"FinInstnId": {"Nm": complaint.operator}}},
                    "Assgne": {
                        "Agt": {
                            "FinInstnId": {
                                "Nm": extraction.destination_operator or "A_DETERMINER"
                            }
                        }
                    },
                    "CreDtTm": datetime.now().astimezone().isoformat(),
                },
                "Undrlyg": [
                    {
                        "TxInf": {
                            "CxlId": f"CXLID-{complaint.complaint_id}",
                            "OrgnlGrpInf": {
                                "OrgnlMsgId": f"MSG-{complaint.complaint_id}",
                                "OrgnlMsgNmId": "pacs.008",
                            },
                            "OrgnlEndToEndId": f"E2E-{complaint.complaint_id}",
                            "OrgnlIntrBkSttlmAmt": {
                                "Ccy": "XOF",
                                "Amt": amount if amount is not None else None,
                            },
                            "OrgnlIntrBkSttlmDt": (
                                extraction.event_at.date().isoformat()
                                if extraction.event_at
                                else complaint.received_at.date().isoformat()
                            ),
                            "Cdtr": {
                                "Id": {"Othr": {"Id": extraction.beneficiary_alias}},
                                "CtctDtls": {"PhneNb": extraction.beneficiary_msisdn},
                            },
                            "CxlRsnInf": {
                                "Rsn": {"Cd": code},
                                "AddtlInf": [label, rationale],
                            },
                        }
                    }
                ],
            }
        },
    }


def build_dispute_file(
    complaint: Complaint,
    extraction: Extraction,
    alert: MuleAlert | None = None,
    now: datetime | None = None,
    human_validator: str | None = None,
) -> DisputeFile:
    """Construit le dossier complet : décision, message, minuteur, preuves."""
    decision, rationale = decide(extraction, alert)
    opened_at = complaint.received_at
    timer: RegulatoryTimer = build_timer(opened_at)
    evidence: dict[str, Any] = {
        "reclamation_id": complaint.complaint_id,
        "canal": complaint.channel.value,
        "recue_le": complaint.received_at.isoformat(),
        "texte_brut": complaint.text,
        "extraction": {
            "typologie": extraction.typology.value,
            "montant_fcfa": extraction.amount_fcfa,
            "heure_operation": (
                extraction.event_at.isoformat() if extraction.event_at else None
            ),
            "alias_beneficiaire": extraction.beneficiary_alias,
            "msisdn_beneficiaire": extraction.beneficiary_msisdn,
            "reseau_destination": extraction.destination_operator,
            "indices_arnaque": extraction.scam_indicators,
            "confiance": extraction.confidence,
            "moteur": extraction.engine.value,
            "moteur_detail": extraction.engine_detail,
        },
        "motivation": rationale,
    }
    if alert is not None:
        evidence["alerte_mule"] = {
            "alert_id": alert.alert_id,
            "resume": alert.headline,
            "regle": alert.rule,
            "alerte_a": alert.alert_at.isoformat(),
            "delai_detection_minutes": alert.detection_delay_minutes,
            "score": alert.score,
            "prioritaire": alert.is_priority,
            "preuves": alert.evidence_complaint_refs,
            "fcfa_encore_gelables": alert.freezable_fcfa,
            "note_impact": alert.impact_note,
        }

    return DisputeFile(
        dossier_id=f"DOS-{complaint.complaint_id}",
        created_at=now or datetime.now().astimezone(),
        complaint_id=complaint.complaint_id,
        operator=complaint.operator,
        decision=decision,
        typology=extraction.typology,
        amount_fcfa=extraction.amount_fcfa,
        beneficiary_alias=extraction.beneficiary_alias,
        destination_operator=extraction.destination_operator,
        iso20022_inspired=_iso20022_inspired(complaint, extraction, decision, rationale),
        timer=timer,
        evidence=evidence,
        human_validator=human_validator,
    )


def render_markdown(dossier: DisputeFile, now: datetime | None = None) -> str:
    """Rend le dossier en texte, tel qu'un agent le relit avant d'envoyer."""
    now = now or dossier.created_at
    status = dossier.timer.status(now)
    amount = (
        f"{dossier.amount_fcfa:,}".replace(",", " ") + " FCFA"
        if dossier.amount_fcfa
        else "non extrait"
    )
    code, label = REASON_CODES[dossier.decision]
    lines = [
        f"# Dossier de litige {dossier.dossier_id}",
        "",
        f"- **Décision proposée** : {dossier.decision.value}",
        f"- **Opérateur émetteur** : {dossier.operator}",
        f"- **Réseau de destination** : {dossier.destination_operator or 'à déterminer'}",
        f"- **Typologie** : {dossier.typology.value}",
        f"- **Montant** : {amount}",
        f"- **Bénéficiaire** : {dossier.beneficiary_alias or 'non identifié'}",
        f"- **Motif d'annulation** : `{code}` — {label}",
        "",
        "## Échéances réglementaires",
        "",
        f"- Remboursement (art. 35, J+{dossier.timer.refund_business_days} jours ouvrés) : "
        f"**{dossier.timer.refund_due_at:%Y-%m-%d %H:%M}** "
        f"({status['heures_avant_remboursement']:.1f} h restantes)",
        f"- Réponse au client (Circulaire 002-2020/CB/C, J+"
        f"{dossier.timer.client_answer_calendar_days}) : "
        f"**{dossier.timer.client_answer_due_at:%Y-%m-%d}**",
        f"- Échéance PI-Reclam (paramètre, non public) : "
        f"**{dossier.timer.pi_reclam_due_at:%Y-%m-%d %H:%M}**",
        "",
        "## Irrévocabilité PI-SPI",
        "",
        dossier.irrevocability_notice,
        "",
        "## Validation humaine",
        "",
        f"- Validé par : **{dossier.human_validator or '(à renseigner)'}**",
        "",
        "> Réclam'Graph recommande et documente. Il ne gèle jamais de lui-même.",
    ]
    return "\n".join(lines)


def summarize(dossiers: Sequence[DisputeFile]) -> dict[str, Any]:
    counts: dict[str, int] = {}
    for d in dossiers:
        counts[d.decision.value] = counts.get(d.decision.value, 0) + 1
    return {
        "n_dossiers": len(dossiers),
        "par_decision": dict(sorted(counts.items())),
        "principe": (
            "Réclam'Graph recommande et documente ; il ne gèle jamais de "
            "lui-même. La décision reste humaine, chez l'opérateur."
        ),
        "seuils_affiches": {
            "operateurs_distincts_minimum": cfg.MULE_MIN_OPERATORS,
            "plaignants_independants_minimum": cfg.MULE_MIN_COMPLAINANTS,
            "fenetre_minutes": cfg.MULE_WINDOW_MINUTES,
        },
    }
