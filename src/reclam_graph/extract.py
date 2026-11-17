"""Extraction structurée des réclamations (bloc 2).

Trois moteurs, **jamais confondus** dans les résultats :

``regex-baseline``
    La référence du benchmark : tri par mots-clés et expressions régulières,
    c'est-à-dire l'outillage dont dispose un opérateur aujourd'hui. Il attrape
    bien ce qui est écrit proprement et rate les montants mal formés
    (« 25mil », « vingt cinq mille »).

``llm``
    Qwen2.5 servi par vLLM en *guided decoding* sur le schéma JSON. C'est le
    moteur visé par le projet, et le seul dont la F1 peut être présentée comme
    une mesure LLM.

``heuristic-fallback``
    Un extracteur local plus riche que la regex, qui permet au pipeline de
    tourner **sans GPU ni serveur** (mode démo). Sa F1 est **optimiste par
    construction** : il a été écrit par la même équipe que le générateur et
    connaît donc ses formulations. Il est étiqueté comme tel partout et ne
    doit jamais être présenté comme une mesure du LLM.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any, Sequence

from . import config as cfg
from .datagen import templates as tpl
from .llm import LLMClient, LLMMetrics, get_client
from .schemas import (
    EXTRACTION_GUIDED_JSON,
    Complaint,
    Extraction,
    ExtractionEngine,
    Typology,
)

# ---------------------------------------------------------------------------
# Expressions régulières partagées
# ---------------------------------------------------------------------------
RE_ALIAS = re.compile(r"\b([a-z0-9][a-z0-9._-]{1,40}@[a-z0-9]{2,20})\b", re.I)
RE_MSISDN = re.compile(r"(?:\+|00)?(229)\s?(\d{2})\s?(\d{2})\s?(\d{2})\s?(\d{2})")
RE_REF = re.compile(r"\bTX\d{6,}\b", re.I)
RE_TIME = re.compile(r"\b(\d{1,2})\s?[h:]\s?(\d{2})\b")

#: Montants « propres » : 25000, 25 000, 25.000, éventuellement suivis d'une
#: unité. C'est ce qu'une regex d'opérateur sait faire.
RE_AMOUNT_PLAIN = re.compile(
    r"\b(\d{1,3}(?:[ .]\d{3})+|\d{3,9})\b\s*(?:f\b|fcfa\b|frs?\b|f\s?cfa\b)?", re.I
)
#: Montants « sales » : 25k, 25 mil, 25mil, 25 milles. Hors de portée de la
#: regex de référence — c'est précisément là que le LLM gagne.
RE_AMOUNT_SHORT = re.compile(r"\b(\d{1,4})\s?(k|mil|mille|milles)\b", re.I)


def _parse_grouped(raw: str) -> int | None:
    digits = raw.replace(" ", "").replace(".", "")
    return int(digits) if digits.isdigit() else None


def _find_msisdn(text: str) -> str | None:
    m = RE_MSISDN.search(text)
    if not m:
        return None
    return "+" + "".join(m.groups())


def _find_time(text: str, received_at: datetime) -> datetime | None:
    """Reconstruit l'heure de l'opération à partir de « 14h02 » / « 14:02 »."""
    m = RE_TIME.search(text)
    if not m:
        return None
    hour, minute = int(m.group(1)), int(m.group(2))
    if hour > 23 or minute > 59:
        return None
    candidate = received_at.replace(hour=hour, minute=minute, second=0, microsecond=0)
    # Une opération ne peut pas être postérieure à la plainte : si l'heure
    # trouvée est après, c'est la veille.
    if candidate > received_at:
        candidate -= timedelta(days=1)
    return candidate


def _find_operator(text: str) -> str | None:
    low = text.lower()
    for op in cfg.OPERATORS:
        if op.lower() in low:
            return op
    for alias in RE_ALIAS.findall(text):
        domain = alias.split("@")[-1].upper()
        if domain in cfg.OPERATORS:
            return domain
    return None


# ---------------------------------------------------------------------------
# Moteur 1 : la référence (mots-clés + regex)
# ---------------------------------------------------------------------------
#: Tri par mots-clés d'un opérateur. Volontairement *raisonnable* : donner une
#: référence artificiellement faible rendrait l'écart invendable.
BASELINE_KEYWORDS: tuple[tuple[Typology, tuple[str, ...]], ...] = (
    (Typology.OTP_PHISHING, ("code", "otp", "pirat", "faux agent", "service client")),
    (Typology.ARNAQUE_ERREUR_DEPOT, ("arnaque", "escroc", "renvoy", "faux message")),
    (Typology.RETARD_TIMEOUT, ("en cours", "attente", "timeout", "bloque depuis", "panne", "echoue tout")),
    (Typology.TRANSACTION_ECHOUEE_DEBITEE, ("echec", "echouee", "debite", "double debit", "preleve", "refuse")),
    (Typology.FRAIS_CONTESTES, ("frais", "commission", "plafond gratuit", "cher")),
    (Typology.AGENT_DISTRIBUTEUR, ("agent", "kiosque", "distributeur", "depose")),
    (Typology.CHANGEMENT_NUMERO, ("change de numero", "changement de numero", "reattribue")),
    (Typology.ERREUR_DESTINATAIRE_SINCERE, ("erreur", "trompe", "mauvais destinataire", "mauvais numero")),
)


def extract_regex(complaint: Complaint) -> Extraction:
    """Référence : ce qu'un opérateur obtient aujourd'hui sans LLM."""
    text = complaint.text
    low = text.lower()

    typology = Typology.AUTRE
    for candidate, keywords in BASELINE_KEYWORDS:
        if any(k in low for k in keywords):
            typology = candidate
            break

    amount: int | None = None
    for m in RE_AMOUNT_PLAIN.finditer(text):
        if RE_REF.search(m.group(0)) or "@" in m.group(0):
            continue
        value = _parse_grouped(m.group(1))
        if value and 100 <= value <= 5_000_000:
            amount = value
            break

    alias_match = RE_ALIAS.search(text)
    indicators = [
        name
        for name, phrases in tpl.SCAM_INDICATOR_PHRASES.items()
        if any(p in low for p in phrases)
    ]
    return Extraction(
        complaint_id=complaint.complaint_id,
        typology=typology,
        amount_fcfa=amount,
        event_at=_find_time(text, complaint.received_at),
        beneficiary_alias=alias_match.group(1).lower() if alias_match else None,
        beneficiary_msisdn=_find_msisdn(text),
        destination_operator=_find_operator(text),
        scam_indicators=indicators,
        confidence=0.5,
        engine=ExtractionEngine.REGEX_BASELINE,
        engine_detail="mots-cles + regex (reference operateur)",
    )


# ---------------------------------------------------------------------------
# Moteur 2 : le repli heuristique local (sans GPU)
# ---------------------------------------------------------------------------
WORD_NUMBERS = {v: k for k, v in tpl.UNITS.items()}

#: Marqueurs qui distinguent l'arnaque de l'erreur sincère. C'est tout l'enjeu
#: métier : les deux récits emploient les mêmes mots (« erreur », « numéro »),
#: mais dans l'arnaque c'est le plaignant qui a été *amené à renvoyer*.
SCAM_MARKERS = (
    "renvoyez", "renvoie moi", "jai renvoye", "a renvoye", "renvoyer",
    "faux msg", "faux message", "faux sms", "arnaque", "escroc",
    "ma demande de renvoyer", "il repond plus", "injoignable",
    "bloque mon numero", "silence total", "jai ete trompe", "ma fait renvoyer",
    "mont fait renvoyer", "cest sa paye", "jai remis", "jai eu pitie",
    "le vrai depot", "nexistait pas", "faux depot",
)
SINCERE_MARKERS = (
    "je me suis trompe", "erreur de ma part", "mauvais destinataire",
    "mauvais numero", "chiffre de trop", "par inattention",
    "au lieu de", "erreur de destinataire", "annuler la transaction",
    "fait par erreur",
)


def _parse_word_amount(text: str) -> int | None:
    """« vingt cinq mille » -> 25000. Hors de portée d'une regex de montant."""
    low = re.sub(r"[^a-zàâäéèêëïîôöùûüç ]", " ", text.lower())
    if "mille" not in low:
        return None
    before = low.split("mille")[0].split()
    tail = [w for w in before[-4:] if w in WORD_NUMBERS]
    if not tail:
        return None
    total = 0
    for word in tail:
        total += WORD_NUMBERS[word]
    if 0 < total <= 999:
        return total * 1000
    return None


def extract_heuristic(complaint: Complaint) -> Extraction:
    """Repli local non-LLM : fait tourner le pipeline sans GPU.

    ATTENTION : écrit en connaissant les formulations du générateur. Sa F1 est
    optimiste et ne remplace **pas** une mesure du LLM.
    """
    base = extract_regex(complaint)
    text = complaint.text
    low = text.lower()

    # --- montant : on récupère ce que la regex laisse passer ---------------
    amount = base.amount_fcfa
    short = RE_AMOUNT_SHORT.search(text)
    if short:
        unit = short.group(2).lower()
        value = int(short.group(1))
        amount = value * 1000 if unit in ("k", "mil", "mille", "milles") else value
    elif amount is None:
        amount = _parse_word_amount(text)

    # --- typologie : arnaque vs erreur sincère ----------------------------
    scam_hits = sum(1 for m in SCAM_MARKERS if m in low)
    sincere_hits = sum(1 for m in SINCERE_MARKERS if m in low)
    typology = base.typology
    if scam_hits or sincere_hits:
        if scam_hits > sincere_hits:
            typology = Typology.ARNAQUE_ERREUR_DEPOT
        elif sincere_hits > scam_hits:
            typology = Typology.ERREUR_DESTINATAIRE_SINCERE
    if any(k in low for k in ("otp", "mon code", "code recu", "code de verification", "faux agent")):
        typology = Typology.OTP_PHISHING

    confidence = 0.6 + 0.1 * min(3, abs(scam_hits - sincere_hits))
    return Extraction(
        complaint_id=complaint.complaint_id,
        typology=typology,
        amount_fcfa=amount,
        event_at=base.event_at,
        beneficiary_alias=base.beneficiary_alias,
        beneficiary_msisdn=base.beneficiary_msisdn,
        destination_operator=base.destination_operator,
        scam_indicators=base.scam_indicators,
        confidence=round(min(0.95, confidence), 2),
        engine=ExtractionEngine.HEURISTIC_FALLBACK,
        engine_detail=(
            "extracteur heuristique local, non-LLM — F1 optimiste par "
            "construction (ecrit en connaissant les gabarits du generateur)"
        ),
    )


# ---------------------------------------------------------------------------
# Moteur 3 : le LLM (vLLM, guided decoding)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """Tu es un analyste de réclamations de mobile money en Afrique de l'Ouest (UEMOA).
Tu reçois UNE réclamation client brute, souvent écrite en français approximatif, avec des
abréviations SMS, des fautes de frappe et parfois des mots nouchi ou fon.

Tu réponds UNIQUEMENT par un objet JSON conforme au schéma, sans commentaire.

Règles de lecture :
- `typology` : choisis la typologie la plus précise.
  * ARNAQUE_ERREUR_DEPOT : on a fait croire au client qu'un dépôt lui était arrivé par
    erreur et on lui a demandé de RENVOYER l'argent. Le client est victime d'une fraude.
  * ERREUR_DESTINATAIRE_SINCERE : c'est le client LUI-MÊME qui s'est trompé de numéro.
  * OTP_PHISHING : on a obtenu son code de vérification.
  * TRANSACTION_ECHOUEE_DEBITEE : échec affiché mais compte débité.
  * RETARD_TIMEOUT : opération bloquée, en attente, panne d'interopérabilité.
  * FRAIS_CONTESTES, AGENT_DISTRIBUTEUR, CHANGEMENT_NUMERO, AUTRE sinon.
  La distinction ARNAQUE_ERREUR_DEPOT / ERREUR_DESTINATAIRE_SINCERE est la plus
  importante : cherche QUI s'est trompé, et si on a demandé au client de renvoyer.
- `amount_fcfa` : montant en FCFA, en entier, sans séparateur. Sache lire
  « 25000 », « 25 000 », « 25.000F », « 25mil », « 25k », « vingt cinq mille » -> 25000.
- `event_time` : heure de l'opération au format HH:MM si le texte la donne, sinon null.
- `beneficiary_alias` : l'alias du bénéficiaire (de la forme nom.nom@operateur) si présent.
- `beneficiary_msisdn` : le numéro du bénéficiaire au format +229XXXXXXXX si présent.
- `destination_operator` : ALPHAMONEY, BETACASH ou GAMMAPAY si identifiable, sinon null.
- `scam_indicators` : parmi recit_erreur_depot, demande_de_renvoi, pression_urgence,
  injoignable_apres, usurpation_service_client, demande_de_code. Liste vide si aucun.
- `confidence` : entre 0 et 1.

N'invente aucune valeur absente du texte : mets null."""


def _user_prompt(complaint: Complaint) -> str:
    return (
        f"Réclamation reçue le {complaint.received_at:%Y-%m-%d à %H:%M} "
        f"chez l'opérateur {complaint.operator}, canal {complaint.channel.value}.\n\n"
        f"Texte brut :\n\"\"\"{complaint.text}\"\"\""
    )


def _from_llm_payload(
    complaint: Complaint, payload: dict[str, Any], model: str
) -> Extraction:
    event_at = None
    raw_time = payload.get("event_time")
    if raw_time:
        event_at = _find_time(str(raw_time), complaint.received_at)
    typology = Typology.AUTRE
    try:
        typology = Typology(str(payload.get("typology", "AUTRE")).upper())
    except ValueError:
        pass
    dest = payload.get("destination_operator")
    if dest and str(dest).upper() not in cfg.OPERATORS:
        dest = None
    return Extraction(
        complaint_id=complaint.complaint_id,
        typology=typology,
        amount_fcfa=payload.get("amount_fcfa"),
        event_at=event_at,
        beneficiary_alias=(payload.get("beneficiary_alias") or None),
        beneficiary_msisdn=(payload.get("beneficiary_msisdn") or None),
        destination_operator=str(dest).upper() if dest else None,
        scam_indicators=payload.get("scam_indicators") or [],
        confidence=float(payload.get("confidence") or 0.0),
        engine=ExtractionEngine.LLM,
        engine_detail=f"vLLM guided decoding, modele {model}",
    )


def extract_llm_batch(
    complaints: Sequence[Complaint],
    client: LLMClient | None = None,
    concurrency: int | None = None,
    fallback: bool = True,
) -> tuple[list[Extraction], LLMMetrics]:
    """Extraction LLM d'un lot. Mesure le débit réel.

    Si le serveur ne répond pas, lève `RuntimeError` — sauf `fallback=True`,
    où l'on retombe sur l'heuristique **en étiquetant chaque sortie** comme
    telle. On ne maquille jamais un repli en mesure LLM.
    """
    client = client or get_client()
    if not client.available():
        if not fallback:
            raise RuntimeError(f"Aucun serveur LLM : {client.status}")
        metrics = LLMMetrics(model="(aucun)", base_url=client.base_url)
        return [extract_heuristic(c) for c in complaints], metrics

    items = [(c.complaint_id, _user_prompt(c)) for c in complaints]
    payloads, metrics = client.map_json(
        items, EXTRACTION_GUIDED_JSON, SYSTEM_PROMPT, concurrency=concurrency
    )
    out: list[Extraction] = []
    for complaint, payload in zip(complaints, payloads):
        if payload is None:
            ext = extract_heuristic(complaint)
            ext.engine_detail += " (repli : appel LLM echoue)"
            out.append(ext)
        else:
            out.append(_from_llm_payload(complaint, payload, client.model))
    return out, metrics


# ---------------------------------------------------------------------------
# Sélection du moteur
# ---------------------------------------------------------------------------
def extract(
    complaints: Sequence[Complaint],
    engine: str = "auto",
    client: LLMClient | None = None,
    concurrency: int | None = None,
) -> tuple[list[Extraction], LLMMetrics | None]:
    """Point d'entrée unique.

    `engine` : ``llm``, ``regex``, ``heuristic`` ou ``auto`` (LLM si joignable,
    repli heuristique sinon — toujours étiqueté).
    """
    if engine == "regex":
        return [extract_regex(c) for c in complaints], None
    if engine == "heuristic":
        return [extract_heuristic(c) for c in complaints], None
    if engine == "llm":
        return extract_llm_batch(complaints, client, concurrency, fallback=False)
    if engine == "auto":
        return extract_llm_batch(complaints, client, concurrency, fallback=True)
    raise ValueError(f"moteur inconnu : {engine}")
