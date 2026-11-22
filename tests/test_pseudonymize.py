"""Le HMAC est déterministe par clé — et seulement par clé."""

from __future__ import annotations

from reclam_graph import config as cfg
from reclam_graph.pseudonymize import (
    hmac_hash,
    normalize_msisdn,
    resolve_beneficiary,
    round_amount,
)


def test_hmac_est_deterministe_pour_une_cle():
    a = hmac_hash("koffi.santos@betacash", "cle-consortium-1")
    b = hmac_hash("koffi.santos@betacash", "cle-consortium-1")
    assert a == b


def test_hmac_change_avec_la_cle():
    """Changer de clé de consortium doit invalider tous les anciens hachés."""
    a = hmac_hash("koffi.santos@betacash", "cle-1")
    b = hmac_hash("koffi.santos@betacash", "cle-2")
    assert a != b


def test_hmac_insensible_a_la_casse_et_aux_espaces():
    assert hmac_hash(" Koffi.Santos@BetaCash ", "k") == hmac_hash("koffi.santos@betacash", "k")


def test_hmac_distingue_deux_beneficiaires():
    assert hmac_hash("a@x", "k") != hmac_hash("b@x", "k")


def test_hmac_longueur_attendue():
    assert len(hmac_hash("a@x", "k")) == cfg.HMAC_PREFIX_LEN


def test_hmac_ne_laisse_pas_fuir_la_valeur_en_clair():
    clear = "koffi.santos@betacash"
    digest = hmac_hash(clear, "k")
    assert clear not in digest
    assert "betacash" not in digest


def test_montant_est_arrondi_avant_partage():
    step = cfg.AMOUNT_ROUNDING_FCFA
    assert round_amount(23_750) % step == 0
    assert round_amount(1) == step  # jamais zéro pour un montant réel
    assert round_amount(None) == 0
    assert round_amount(0) == 0


def test_normalisation_des_numeros():
    attendu = "+22996123456"
    for brut in ("+22996123456", "0022996123456", "96123456", "229 96 12 34 56"):
        assert normalize_msisdn(brut) == attendu


def test_resolution_numero_vers_alias_via_annuaire():
    """Sans cette résolution, deux plaintes visant la même mule ne se joignent pas."""
    annuaire = {"+22997933935": "koffi.santos@betacash"}
    assert resolve_beneficiary(None, "+22997933935", annuaire) == "koffi.santos@betacash"
    assert resolve_beneficiary("autre@x", "+22997933935", annuaire) == "autre@x"
    assert resolve_beneficiary(None, None, annuaire) is None


def test_deux_operateurs_obtiennent_le_meme_hash_avec_la_cle_du_consortium():
    """Le cœur du dispositif : joindre sans se parler."""
    chez_alphamoney = hmac_hash("koffi.santos@betacash", "cle-du-consortium")
    chez_gammapay = hmac_hash("KOFFI.SANTOS@BETACASH", "cle-du-consortium")
    assert chez_alphamoney == chez_gammapay
