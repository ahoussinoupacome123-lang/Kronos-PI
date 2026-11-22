"""Dossiers de litige et piste d'audit."""

from __future__ import annotations

from datetime import datetime

import pytest

from reclam_graph.audit import AuditLog, compute_hash, verify_chain
from reclam_graph.dossier import REASON_CODES, build_dispute_file, decide, render_markdown
from reclam_graph.schemas import (
    Channel,
    Complaint,
    Decision,
    Extraction,
    MuleAlert,
    Typology,
)


def _complaint(text="jai envoye 25000 a koffi.santos@betacash par erreur") -> Complaint:
    return Complaint(
        complaint_id="RC-TEST-1",
        operator="ALPHAMONEY",
        channel=Channel.SMS,
        received_at=datetime.fromisoformat("2026-11-17T14:09:00+01:00"),
        complainant_msisdn="+22996000001",
        complainant_name="Aïcha Kougbo",
        text=text,
    )


def _extraction(typology=Typology.ERREUR_DESTINATAIRE_SINCERE) -> Extraction:
    return Extraction(
        complaint_id="RC-TEST-1",
        typology=typology,
        amount_fcfa=25_000,
        beneficiary_alias="koffi.santos@betacash",
        destination_operator="BETACASH",
    )


def _alert(priority=True) -> MuleAlert:
    return MuleAlert(
        alert_id="ALERT-TEST",
        alias_hmac="ab" * 8,
        alert_at=datetime.fromisoformat("2026-11-17T14:21:00+01:00"),
        first_complaint_at=datetime.fromisoformat("2026-11-17T14:09:00+01:00"),
        detection_delay_minutes=12.0,
        n_complainants=7,
        n_operators=3,
        operators=["ALPHAMONEY", "BETACASH", "GAMMAPAY"],
        total_fcfa=160_000,
        freezable_fcfa=162_000,
        score=0.95,
        rule="3 plaignants, 2 opérateurs, 60 min",
        is_priority=priority,
        evidence_complaint_refs=["RC-TEST-1"],
    )


# --------------------------------------------------------------------------
# Décision : une entrée, deux sorties
# --------------------------------------------------------------------------
def test_une_erreur_sincere_produit_un_remboursement_et_aucune_alerte():
    """Exigence du brief : les erreurs sincères donnent un dossier, pas une alerte."""
    decision, motif = decide(_extraction(), alert=None)
    assert decision is Decision.REMBOURSER
    assert "annulation" in motif.lower()


def test_une_alerte_prioritaire_produit_une_recommandation_de_gel():
    decision, motif = decide(_extraction(Typology.ARNAQUE_ERREUR_DEPOT), _alert())
    assert decision is Decision.GELER
    assert "mule probable" in motif
    assert "décision humaine" in motif.lower()


def test_une_alerte_non_prioritaire_ne_force_pas_le_gel():
    decision, _ = decide(_extraction(), _alert(priority=False))
    assert decision is Decision.REMBOURSER


def test_sans_beneficiaire_identifiable_le_dossier_part_en_instruction():
    extraction = Extraction(complaint_id="RC-TEST-1", typology=Typology.FRAIS_CONTESTES)
    decision, _ = decide(extraction, None)
    assert decision is Decision.A_INSTRUIRE


# --------------------------------------------------------------------------
# Le dossier
# --------------------------------------------------------------------------
def test_le_dossier_de_remboursement_porte_les_trois_echeances():
    d = build_dispute_file(_complaint(), _extraction())
    assert d.decision is Decision.REMBOURSER
    assert d.timer.refund_business_days == 3
    assert d.timer.client_answer_calendar_days == 30
    assert d.timer.refund_due_at > d.timer.opened_at
    assert d.timer.pi_reclam_deadline_is_public is False


def test_le_dossier_contient_les_preuves_et_le_champ_validateur():
    d = build_dispute_file(_complaint(), _extraction(), _alert())
    assert d.evidence["texte_brut"]
    assert d.evidence["extraction"]["montant_fcfa"] == 25_000
    assert d.evidence["alerte_mule"]["preuves"] == ["RC-TEST-1"]
    # le champ existe et est vide : en attente d'une décision humaine
    assert "human_validator" in d.model_dump()
    assert d.human_validator is None


def test_le_motif_iso_est_frad_pour_une_fraude_et_cust_pour_une_erreur():
    fraude = build_dispute_file(_complaint(), _extraction(Typology.ARNAQUE_ERREUR_DEPOT), _alert())
    erreur = build_dispute_file(_complaint(), _extraction())
    def code(d):
        return d.iso20022_inspired["Document"]["FIToFIPmtCxlReq"]["Undrlyg"][0][
            "TxInf"
        ]["CxlRsnInf"]["Rsn"]["Cd"]
    assert code(fraude) == "FRAD"
    assert code(erreur) == "CUST"
    assert REASON_CODES[Decision.GELER][0] == "FRAD"


def test_le_format_iso_est_annonce_comme_inspire_et_non_certifie():
    """Ne jamais laisser croire que c'est un message ISO 20022 valide."""
    d = build_dispute_file(_complaint(), _extraction())
    avertissement = d.iso20022_inspired["_avertissement"]
    assert "INSPIRÉE" in avertissement
    assert "Non certifiée" in avertissement


def test_l_irrevocabilite_pi_spi_est_rappelee():
    d = build_dispute_file(_complaint(), _extraction())
    assert "ne peut pas être annulé unilatéralement" in d.irrevocability_notice
    assert "accord du bénéficiaire" in d.irrevocability_notice


def test_le_rendu_markdown_rappelle_que_rien_n_est_gele_automatiquement():
    md = render_markdown(build_dispute_file(_complaint(), _extraction()))
    assert "ne gèle jamais de lui-même" in md
    assert "Validation humaine" in md


# --------------------------------------------------------------------------
# L'audit
# --------------------------------------------------------------------------
def test_le_journal_est_chaine_et_verifiable(tmp_path):
    log = AuditLog(path=tmp_path / "audit.jsonl")
    log.append("pipeline", "EXTRACTION", "reclamation", "RC-1", evidence={"n": 1})
    log.append("hub", "ALERTE_MULE_RECOMMANDEE", "alias", "ab" * 8,
               rule="3/2/60", thresholds={"plaignants_min": 3})
    log.append("agent.litiges", "VALIDATION", "dossier", "DOS-1",
               decision=Decision.REMBOURSER, human_validator="A. Dossou")
    ok, problemes = log.verify_chain()
    assert ok and problemes == []
    assert len(log) == 3


def test_une_entree_modifiee_casse_la_chaine(tmp_path):
    log = AuditLog(path=tmp_path / "audit.jsonl")
    log.append("pipeline", "EXTRACTION", "reclamation", "RC-1")
    cible = log.append("hub", "ALERTE_MULE_RECOMMANDEE", "alias", "x")
    log.append("pipeline", "DOSSIER_CONSTRUIT", "dossier", "DOS-1")
    assert log.verify_chain()[0] is True
    cible.evidence = {"falsifie": True}
    ok, problemes = verify_chain(log.entries)
    assert ok is False
    assert any("contenu modifié" in p for p in problemes)


def test_une_entree_supprimee_casse_la_chaine(tmp_path):
    log = AuditLog(path=tmp_path / "audit.jsonl")
    for i in range(4):
        log.append("pipeline", "ACTION", "sujet", f"S-{i}")
    entrees = log.entries
    del entrees[1]
    ok, problemes = verify_chain(entrees)
    assert ok is False
    assert problemes


def test_l_audit_se_relit_depuis_le_disque(tmp_path):
    path = tmp_path / "audit.jsonl"
    log = AuditLog(path=path)
    log.append("hub", "ALERTE_MULE_RECOMMANDEE", "alias", "ab" * 8,
               rule="3/2/60", evidence={"preuves": ["RC-1", "RC-2"]},
               human_validator="A. Dossou", decision=Decision.GELER)
    log.flush()
    relu = AuditLog.load(path)
    assert len(relu) == 1
    assert relu[0].human_validator == "A. Dossou"
    assert relu[0].evidence["preuves"] == ["RC-1", "RC-2"]
    assert relu[0].decision is Decision.GELER
    assert verify_chain(relu)[0] is True


def test_l_entree_d_alerte_porte_la_regle_les_seuils_et_les_preuves(tmp_path):
    """Exigence du brief : chaque décision tracée avec ses preuves et son validateur."""
    log = AuditLog(path=tmp_path / "audit.jsonl")
    e = log.append(
        "hub.reclam-graph", "ALERTE_MULE_RECOMMANDEE", "alias_hmac", "ab" * 8,
        rule="3 plaignants, 2 opérateurs, 60 min",
        thresholds={"plaignants_min": 3, "operateurs_min": 2, "fenetre_minutes": 60},
        evidence={"preuves_reclamations": ["RC-1", "RC-2", "RC-3"]},
        decision=Decision.GELER,
    )
    assert e.rule and e.thresholds["plaignants_min"] == 3
    assert len(e.evidence["preuves_reclamations"]) == 3
    assert e.entry_hash == compute_hash(e)
    assert e.human_validator is None  # en attente de la décision humaine
