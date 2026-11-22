"""Fixtures partagées. Les tests travaillent sur le jeu synthétique du dépôt."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
for _p in (str(ROOT), str(ROOT / "src")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from reclam_graph import config as cfg  # noqa: E402
from reclam_graph.schemas import Complaint  # noqa: E402

needs_data = pytest.mark.skipif(
    not cfg.COMPLAINTS_FILE.exists(),
    reason="jeu de données absent — lancer `make data`",
)
needs_results = pytest.mark.skipif(
    not cfg.DEMO_BUNDLE.exists(),
    reason="résultats absents — lancer `make pipeline`",
)


@pytest.fixture(scope="session")
def complaints() -> list[Complaint]:
    return [
        Complaint.model_validate_json(line)
        for line in cfg.COMPLAINTS_FILE.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


@pytest.fixture(scope="session")
def ground_truth() -> dict:
    return json.loads(cfg.GROUND_TRUTH_FILE.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def directory() -> dict[str, str]:
    from reclam_graph.pseudonymize import load_alias_directory

    return load_alias_directory()


@pytest.fixture(scope="session")
def bundle() -> dict:
    return json.loads(cfg.DEMO_BUNDLE.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def oracle_records(complaints, directory):
    """Enregistrements partagés construits depuis la vérité terrain.

    Permet de tester le HUB indépendamment de la qualité de l'extracteur :
    si un test de détection échoue avec ces enregistrements, c'est le hub ou
    la règle qui est en cause, pas la lecture du texte.
    """
    from reclam_graph.pseudonymize import to_shared_record
    from reclam_graph.schemas import Extraction

    out = []
    for c in complaints:
        e = Extraction(
            complaint_id=c.complaint_id,
            typology=c.gt_typology,
            amount_fcfa=c.gt_amount_fcfa,
            beneficiary_alias=c.gt_beneficiary_alias,
            beneficiary_msisdn=c.gt_beneficiary_msisdn,
            destination_operator=c.gt_destination_operator,
        )
        rec = to_shared_record(c, e, directory)
        if rec is not None:
            out.append(rec)
    return out
