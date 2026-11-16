"""Schémas de données de Réclam'Graph (pydantic v2).

Deux frontières importantes :

* `Complaint` et `Extraction` restent **chez l'opérateur** : elles contiennent
  le texte brut et l'identité du plaignant.
* `SharedRecord` est le **seul** objet qui sort de l'opérateur vers le hub :
  opérateur, horodatage, typologie, alias haché (HMAC), montant arrondi.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class Typology(str, Enum):
    """Typologies de réclamation retenues (BCEAO : motifs principaux)."""

    ERREUR_DESTINATAIRE_SINCERE = "ERREUR_DESTINATAIRE_SINCERE"
    ARNAQUE_ERREUR_DEPOT = "ARNAQUE_ERREUR_DEPOT"
    OTP_PHISHING = "OTP_PHISHING"
    TRANSACTION_ECHOUEE_DEBITEE = "TRANSACTION_ECHOUEE_DEBITEE"
    RETARD_TIMEOUT = "RETARD_TIMEOUT"
    FRAIS_CONTESTES = "FRAIS_CONTESTES"
    AGENT_DISTRIBUTEUR = "AGENT_DISTRIBUTEUR"
    CHANGEMENT_NUMERO = "CHANGEMENT_NUMERO"
    AUTRE = "AUTRE"


#: Typologies qui décrivent un transfert parti vers un tiers et qui peuvent
#: donc alimenter le graphe inter-opérateurs.
TRANSFER_TYPOLOGIES = {
    Typology.ERREUR_DESTINATAIRE_SINCERE,
    Typology.ARNAQUE_ERREUR_DEPOT,
}


class Channel(str, Enum):
    SMS = "SMS"
    APP = "APP"
    CALL_CENTER = "CALL_CENTER"
    VOICE_NOTE = "VOICE_NOTE"
    AGENCE = "AGENCE"


class Decision(str, Enum):
    """Deux sorties, une entrée."""

    GELER = "GELER"  # mule probable : alerte inter-opérateurs
    REMBOURSER = "REMBOURSER"  # erreur sincère : dossier de litige PI-SPI
    A_INSTRUIRE = "A_INSTRUIRE"  # ni l'un ni l'autre : file normale


class ExtractionEngine(str, Enum):
    """Qui a produit l'extraction. Jamais implicite : une mesure LLM ne doit
    jamais pouvoir être confondue avec une mesure regex ou heuristique."""

    LLM = "llm"
    REGEX_BASELINE = "regex-baseline"
    HEURISTIC_FALLBACK = "heuristic-fallback"
    GROUND_TRUTH = "ground-truth"


# ---------------------------------------------------------------------------
# Côté opérateur
# ---------------------------------------------------------------------------
class Complaint(BaseModel):
    """Réclamation brute telle qu'elle arrive chez l'opérateur."""

    complaint_id: str
    operator: str
    channel: Channel
    received_at: datetime
    complainant_msisdn: str
    complainant_name: str
    text: str

    # --- vérité terrain du générateur synthétique (jamais vue par le pipeline) ---
    gt_typology: Typology | None = None
    gt_amount_fcfa: int | None = None
    gt_beneficiary_alias: str | None = None
    gt_beneficiary_msisdn: str | None = None
    gt_destination_operator: str | None = None
    gt_event_at: datetime | None = None
    gt_campaign_id: str | None = None
    gt_incident_id: str | None = None
    gt_is_mule_victim: bool = False
    gt_scam_indicators: list[str] = Field(default_factory=list)

    def public(self) -> dict[str, Any]:
        """La réclamation sans sa vérité terrain (ce que voit le pipeline)."""
        return self.model_dump(
            mode="json",
            include={
                "complaint_id",
                "operator",
                "channel",
                "received_at",
                "complainant_msisdn",
                "complainant_name",
                "text",
            },
        )


class Extraction(BaseModel):
    """Sortie JSON guidée de l'extracteur (bloc 2)."""

    complaint_id: str
    typology: Typology = Typology.AUTRE
    amount_fcfa: int | None = None
    event_at: datetime | None = None
    beneficiary_alias: str | None = None
    beneficiary_msisdn: str | None = None
    destination_operator: str | None = None
    scam_indicators: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    engine: ExtractionEngine = ExtractionEngine.HEURISTIC_FALLBACK
    engine_detail: str = ""
    latency_ms: float | None = None

    @field_validator("amount_fcfa", mode="before")
    @classmethod
    def _coerce_amount(cls, v: Any) -> Any:
        """Le LLM renvoie parfois « 25000 FCFA » ou « 25.000 » : on normalise."""
        if v is None or isinstance(v, int):
            return v
        if isinstance(v, float):
            return int(round(v))
        s = str(v)
        digits = "".join(ch for ch in s if ch.isdigit())
        return int(digits) if digits else None

    @field_validator("scam_indicators", mode="before")
    @classmethod
    def _coerce_indicators(cls, v: Any) -> Any:
        if v is None:
            return []
        if isinstance(v, str):
            return [v] if v else []
        return list(v)


#: Schéma JSON passé à vLLM en *guided decoding* (bloc 2).
EXTRACTION_GUIDED_JSON: dict[str, Any] = {
    "type": "object",
    "properties": {
        "typology": {"type": "string", "enum": [t.value for t in Typology]},
        "amount_fcfa": {"type": ["integer", "null"]},
        "event_time": {
            "type": ["string", "null"],
            "description": "heure de l'opération au format HH:MM si présente",
        },
        "beneficiary_alias": {"type": ["string", "null"]},
        "beneficiary_msisdn": {"type": ["string", "null"]},
        "destination_operator": {"type": ["string", "null"]},
        "scam_indicators": {"type": "array", "items": {"type": "string"}},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
    },
    "required": [
        "typology",
        "amount_fcfa",
        "event_time",
        "beneficiary_alias",
        "beneficiary_msisdn",
        "destination_operator",
        "scam_indicators",
        "confidence",
    ],
    "additionalProperties": False,
}


# ---------------------------------------------------------------------------
# Ce qui sort de l'opérateur
# ---------------------------------------------------------------------------
class SharedRecord(BaseModel):
    """Le seul objet transmis au hub. Rien de brut, rien de nominatif.

    Voir le tableau « Ce qui quitte l'opérateur » du brief (section 4).
    """

    record_id: str
    operator: str
    ts: datetime
    typology: Typology
    alias_hmac: str
    complainant_hmac: str
    amount_rounded_fcfa: int
    local_complaint_ref: str  # opaque côté hub, résolvable côté opérateur seul

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Côté hub
# ---------------------------------------------------------------------------
class MuleAlert(BaseModel):
    """Alerte « mule probable ». Recommandation, jamais un gel."""

    alert_id: str
    alias_hmac: str
    alert_at: datetime
    first_complaint_at: datetime
    detection_delay_minutes: float
    n_complainants: int
    n_operators: int
    operators: list[str]
    total_fcfa: int
    freezable_fcfa: int
    score: float
    rule: str
    evidence_record_ids: list[str] = Field(default_factory=list)
    evidence_complaint_refs: list[str] = Field(default_factory=list)
    recommendation: str = (
        "Recommandation : suspendre temporairement les retraits sur le compte "
        "bénéficiaire et notifier les opérateurs concernés. "
        "Décision humaine requise chez l'opérateur — Réclam'Graph ne gèle rien."
    )
    detected_by: str = "consortium"
    human_validator: str | None = None
    gt_campaign_id: str | None = None

    # --- état au moment exact du déclenchement de la règle ---
    n_complainants_at_alert: int = 0
    n_operators_at_alert: int = 0
    total_fcfa_at_alert: int = 0
    last_update_at: datetime | None = None

    # --- score et priorisation ---
    score_features: dict[str, float] = Field(default_factory=dict)
    is_priority: bool = False

    # --- impact ---
    #: Montant exact, connu de l'opérateur qui HÉBERGE le compte mule (il voit
    #: le solde réel). Le hub, lui, ne manipule que des montants arrondis :
    #: `total_fcfa` est la vue hub, `total_fcfa_exact` la vue opérateur hôte.
    total_fcfa_exact: int | None = None
    freezable_at_last_update_fcfa: int = 0
    impact_note: str = ""

    @property
    def total_for_display(self) -> int:
        """Montant à afficher : l'exact si l'opérateur hôte l'a fourni."""
        return self.total_fcfa_exact if self.total_fcfa_exact is not None else self.total_fcfa

    @property
    def headline(self) -> str:
        """Texte d'alerte de la démo.

        Chiffres de l'opérateur hôte (montants exacts et solde réel) : une
        fois alerté, c'est lui qui connaît le compte. La vue hub, volontairement
        arrondie, reste disponible dans `total_fcfa`.
        """
        total = f"{self.total_for_display:,}".replace(",", "\u202f")
        frozen = f"{self.freezable_at_last_update_fcfa or self.freezable_fcfa:,}".replace(
            ",", "\u202f"
        )
        return (
            f"mule probable, {self.n_complainants} plaignants, "
            f"{self.n_operators} opérateurs, {total} FCFA dont "
            f"{frozen} encore sur le compte"
        )


class IncidentAlert(BaseModel):
    """Alerte du radar d'incidents (module recyclé de Réclam'Radar)."""

    incident_id: str
    detected_at: datetime
    window_start: datetime
    window_end: datetime
    operator: str | None
    typology: Typology
    count: int
    baseline_mean: float
    zscore: float
    cluster_id: int | None = None
    cluster_size: int | None = None
    sample_texts: list[str] = Field(default_factory=list)
    label: str = ""
    gt_incident_id: str | None = None


class RegulatoryTimer(BaseModel):
    """Minuteur réglementaire (art. 35, Circulaire CB, PI-Reclam)."""

    opened_at: datetime
    refund_due_at: datetime  # J+3 jours ouvrés — art. 35
    client_answer_due_at: datetime  # J+30 calendaires — Circulaire 002-2020/CB/C
    pi_reclam_due_at: datetime  # paramétrable, non public
    refund_business_days: int
    client_answer_calendar_days: int
    pi_reclam_hours: int
    pi_reclam_deadline_is_public: bool = False
    notes: str = ""

    def status(self, now: datetime) -> dict[str, Any]:
        def left(due: datetime) -> float:
            return round((due - now).total_seconds() / 3600.0, 2)

        return {
            "now": now.isoformat(),
            "heures_avant_remboursement": left(self.refund_due_at),
            "heures_avant_reponse_client": left(self.client_answer_due_at),
            "heures_avant_pi_reclam": left(self.pi_reclam_due_at),
            "remboursement_expire": now > self.refund_due_at,
            "reponse_client_expiree": now > self.client_answer_due_at,
            "pi_reclam_expire": now > self.pi_reclam_due_at,
        }


class DisputeFile(BaseModel):
    """Dossier de litige PI-SPI : demande d'annulation pré-remplie.

    Format *inspiré* d'ISO 20022 (camt.056 « FIToFIPaymentCancellationRequest »).
    Ce n'est pas un message ISO 20022 valide et certifié : c'est une structure
    lisible qui en reprend l'ossature, à faire valider par le participant.
    """

    dossier_id: str
    created_at: datetime
    complaint_id: str
    operator: str
    decision: Decision
    typology: Typology
    amount_fcfa: int | None
    beneficiary_alias: str | None
    destination_operator: str | None
    iso20022_inspired: dict[str, Any]
    timer: RegulatoryTimer
    evidence: dict[str, Any]
    irrevocability_notice: str = (
        "PI-SPI : un paiement confirmé ne peut pas être annulé unilatéralement. "
        "Cette demande d'annulation requiert l'accord du bénéficiaire ; le "
        "remboursement est à l'initiative du bénéficiaire."
    )
    human_validator: str | None = None


class AuditEntry(BaseModel):
    """Entrée de piste d'audit. Chaînée par hash pour être inviolable en lecture."""

    entry_id: str
    ts: datetime
    actor: str
    action: str
    subject_type: str
    subject_id: str
    rule: str | None = None
    thresholds: dict[str, Any] = Field(default_factory=dict)
    evidence: dict[str, Any] = Field(default_factory=dict)
    human_validator: str | None = None
    decision: Decision | None = None
    prev_hash: str = ""
    entry_hash: str = ""
