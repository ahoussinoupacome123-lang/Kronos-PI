"""Extraction : la regex de référence et le repli heuristique local."""

from __future__ import annotations

from datetime import datetime

import pytest

from reclam_graph.extract import extract_heuristic, extract_regex
from reclam_graph.schemas import Channel, Complaint, ExtractionEngine, Typology


def _c(text: str) -> Complaint:
    return Complaint(
        complaint_id="RC-X",
        operator="ALPHAMONEY",
        channel=Channel.SMS,
        received_at=datetime.fromisoformat("2026-11-17T15:00:00+01:00"),
        complainant_msisdn="+22996000001",
        complainant_name="Test",
        text=text,
    )


@pytest.mark.parametrize(
    "texte,attendu",
    [
        ("jai envoye 25000 par erreur", 25_000),
        ("jai envoye 25 000 FCFA par erreur", 25_000),
        ("jai envoye 25.000F par erreur", 25_000),
        ("jai envoye 25mil par erreur", 25_000),
        ("jai envoye 25k par erreur", 25_000),
        ("jai envoye 25 mil par erreur", 25_000),
        ("jai envoye vingt cinq mille par erreur", 25_000),
    ],
)
def test_l_heuristique_lit_tous_les_formats_de_montant(texte, attendu):
    assert extract_heuristic(_c(texte)).amount_fcfa == attendu


@pytest.mark.parametrize("texte", ["jai envoye 25mil", "jai envoye 25k",
                                   "jai envoye vingt cinq mille"])
def test_la_regex_de_reference_rate_les_montants_mal_ecrits(texte):
    """C'est exactement là que le LLM est censé gagner (section 11 du brief)."""
    assert extract_regex(_c(texte)).amount_fcfa != 25_000


def test_l_alias_et_le_numero_sont_extraits():
    e = extract_heuristic(_c("jai renvoye a koffi.santos@betacash au +22997933935"))
    assert e.beneficiary_alias == "koffi.santos@betacash"
    assert e.beneficiary_msisdn == "+22997933935"
    assert e.destination_operator == "BETACASH"


def test_l_heure_de_l_operation_est_reconstruite():
    e = extract_heuristic(_c("jai envoye 25000 a 14h02 par erreur"))
    assert e.event_at is not None
    assert (e.event_at.hour, e.event_at.minute) == (14, 2)


def test_une_heure_posterieure_a_la_plainte_est_rapportee_a_la_veille():
    """Une opération ne peut pas avoir lieu après la plainte."""
    e = extract_heuristic(_c("jai envoye 25000 a 23h50 par erreur"))
    assert e.event_at is not None
    assert e.event_at < _c("x").received_at


def test_l_arnaque_est_distinguee_de_l_erreur_sincere():
    arnaque = extract_heuristic(
        _c("jai recu un faux msg de depot de 25000, jai renvoye a koffi.santos@betacash "
           "et il repond plus")
    )
    sincere = extract_heuristic(
        _c("je me suis trompe de numero, jai envoye 25000 a koffi.santos@betacash "
           "au lieu de ma soeur")
    )
    assert arnaque.typology is Typology.ARNAQUE_ERREUR_DEPOT
    assert sincere.typology is Typology.ERREUR_DESTINATAIRE_SINCERE


def test_le_phishing_otp_est_reconnu():
    e = extract_heuristic(_c("un faux agent ma demande mon code otp et 50000 est parti"))
    assert e.typology is Typology.OTP_PHISHING


def test_chaque_moteur_s_identifie():
    """Une mesure regex ne doit jamais pouvoir passer pour une mesure LLM."""
    assert extract_regex(_c("x")).engine is ExtractionEngine.REGEX_BASELINE
    heur = extract_heuristic(_c("x"))
    assert heur.engine is ExtractionEngine.HEURISTIC_FALLBACK
    assert "non-LLM" in heur.engine_detail
    assert "optimiste" in heur.engine_detail


def test_la_reference_du_texte_n_est_pas_prise_pour_un_montant():
    e = extract_heuristic(_c("reference TX9870330082, probleme sur mon compte"))
    assert e.amount_fcfa != 9870330082


def test_un_texte_sans_rien_ne_fabrique_pas_de_valeurs():
    e = extract_heuristic(_c("bonjour je narrive pas a ouvrir lapplication"))
    assert e.amount_fcfa is None
    assert e.beneficiary_alias is None
    assert e.beneficiary_msisdn is None
