"""Pseudonymisation côté opérateur (bloc 4).

C'est la frontière de confiance du projet. Ce module transforme une
réclamation **brute** (texte, identité du plaignant) en un `SharedRecord`
qui ne contient plus rien de nominatif :

====================================  ===========================
Champ                                 Partagé ?
====================================  ===========================
Texte de la réclamation               Non
Identité et numéro du plaignant       Non (haché, pour compter
                                      des plaignants distincts)
Alias du bénéficiaire                 Haché (HMAC-SHA256)
Opérateur, horodatage, typologie      Oui
Montant                               Arrondi
====================================  ===========================

**Limite à énoncer avant qu'on nous la pose** : un HMAC sur des numéros de
téléphone reste attaquable par dictionnaire si la clé fuite (l'espace des
numéros béninois est petit : ~10^6 par préfixe). Le HMAC protège contre un
hub curieux, pas contre un hub malveillant qui aurait la clé. En production :
*private set intersection* (PSI), ou un hub opéré par un tiers de confiance
(BCEAO, PI-Reclam, Alliance Fintech UEMOA).
"""

from __future__ import annotations

import hashlib
import hmac
import json
from pathlib import Path

from . import config as cfg
from .schemas import Complaint, Extraction, SharedRecord, Typology


def hmac_hash(value: str, key: str | None = None, length: int = cfg.HMAC_PREFIX_LEN) -> str:
    """HMAC-SHA256 tronqué, déterministe pour une clé donnée.

    Déterministe par clé et *différent* d'une clé à l'autre : c'est ce qui
    permet à deux opérateurs de joindre leurs plaintes sans se parler, et à
    un changement de clé de consortium d'invalider tous les anciens hachés.
    """
    k = (key if key is not None else cfg.CONSORTIUM_KEY).encode("utf-8")
    digest = hmac.new(k, value.strip().lower().encode("utf-8"), hashlib.sha256).hexdigest()
    return digest[:length]


def round_amount(amount: int | None, step: int = cfg.AMOUNT_ROUNDING_FCFA) -> int:
    """Arrondit le montant avant partage (au pas le plus proche, minimum un pas)."""
    if not amount or amount <= 0:
        return 0
    return max(step, int(round(amount / step) * step))


def load_alias_directory(path: Path = cfg.ALIAS_DIRECTORY_FILE) -> dict[str, str]:
    """Annuaire d'alias PI-SPI (numéro -> alias), côté opérateur."""
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8")).get("msisdn_to_alias", {})


def normalize_msisdn(raw: str) -> str:
    """« 00229 96 12 34 56 », « 22996123456 » -> « +22996123456 »."""
    digits = "".join(ch for ch in raw if ch.isdigit())
    if digits.startswith("00"):
        digits = digits[2:]
    if len(digits) == 8:  # numéro national béninois sans indicatif
        digits = "229" + digits
    return "+" + digits if digits else raw


def resolve_beneficiary(
    alias: str | None,
    msisdn: str | None,
    directory: dict[str, str] | None = None,
) -> str | None:
    """Identifiant canonique du bénéficiaire, avant hachage.

    L'alias est prioritaire. Si la plainte ne cite qu'un numéro, l'opérateur
    le résout via l'annuaire d'alias PI-SPI — sans cette étape, deux plaintes
    visant la même mule (l'une citant l'alias, l'autre le numéro) ne se
    joindraient jamais au hub.
    """
    if alias:
        return alias.strip().lower()
    if msisdn:
        norm = normalize_msisdn(msisdn)
        if directory:
            found = directory.get(norm) or directory.get(msisdn)
            if found:
                return found.strip().lower()
        return norm
    return None


def to_shared_record(
    complaint: Complaint,
    extraction: Extraction,
    directory: dict[str, str] | None = None,
    key: str | None = None,
) -> SharedRecord | None:
    """Ce qui sort de l'opérateur. `None` si rien n'est partageable.

    Une réclamation sans bénéficiaire identifiable ne quitte pas l'opérateur :
    elle n'apporterait rien au hub et augmenterait la surface de données.
    """
    canonical = resolve_beneficiary(
        extraction.beneficiary_alias, extraction.beneficiary_msisdn, directory
    )
    if not canonical:
        return None
    return SharedRecord(
        record_id=f"SR-{hmac_hash(complaint.complaint_id, key, 12)}",
        operator=complaint.operator,
        ts=complaint.received_at,
        typology=extraction.typology or Typology.AUTRE,
        alias_hmac=hmac_hash(canonical, key),
        complainant_hmac=hmac_hash(normalize_msisdn(complaint.complainant_msisdn), key),
        amount_rounded_fcfa=round_amount(extraction.amount_fcfa),
        local_complaint_ref=complaint.complaint_id,
    )


def privacy_report() -> dict[str, object]:
    """Résumé de la posture vie privée, repris dans le README et l'UI."""
    return {
        "algorithme": "HMAC-SHA256 tronqué à %d caractères hexadécimaux" % cfg.HMAC_PREFIX_LEN,
        "cle": "clé de consortium, hors du dépôt",
        "cle_par_defaut_de_dev": cfg.CONSORTIUM_KEY_IS_DEV,
        "ne_sort_jamais": [
            "texte de la réclamation",
            "nom du plaignant",
            "numéro du plaignant en clair",
            "montant exact",
        ],
        "sort": [
            "opérateur",
            "horodatage",
            "typologie",
            "alias bénéficiaire haché (HMAC)",
            "plaignant haché (HMAC, pour compter des plaignants distincts)",
            "montant arrondi au pas de %d FCFA" % cfg.AMOUNT_ROUNDING_FCFA,
        ],
        "limite_connue": (
            "Un HMAC sur des numéros de téléphone reste attaquable par "
            "dictionnaire si la clé fuite : l'espace des numéros est petit. "
            "Le HMAC protège contre un hub curieux, pas contre un hub "
            "malveillant détenant la clé."
        ),
        "production": (
            "Private set intersection (PSI), ou hub opéré par un tiers de "
            "confiance (BCEAO, PI-Reclam, Alliance Fintech UEMOA)."
        ),
        "contexte": (
            "24 % des fournisseurs de mobile money se disent gênés par les "
            "règles de transfert transfrontalier de données (GSMA 2026) : le "
            "partage minimal et l'inférence locale sont des arguments, pas "
            "des contraintes."
        ),
    }
