"""Le hub : les cinq campagnes sont détectées, les erreurs sincères ne le sont pas."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from reclam_graph import config as cfg
from reclam_graph import graph_hub as hub
from reclam_graph.pseudonymize import hmac_hash
from reclam_graph.schemas import SharedRecord, Typology

from .conftest import needs_data


def _rec(rid, operator, minutes, alias, complainant, amount=25_000,
         typology=Typology.ARNAQUE_ERREUR_DEPOT):
    base = datetime.fromisoformat("2026-11-17T14:00:00+01:00")
    return SharedRecord(
        record_id=rid,
        operator=operator,
        ts=base + timedelta(minutes=minutes),
        typology=typology,
        alias_hmac=hmac_hash(alias, "k"),
        complainant_hmac=hmac_hash(complainant, "k"),
        amount_rounded_fcfa=amount,
        local_complaint_ref=rid,
    )


# --------------------------------------------------------------------------
# La règle elle-même
# --------------------------------------------------------------------------
def test_trois_plaignants_deux_operateurs_en_moins_d_une_heure_declenche():
    records = [
        _rec("r1", "ALPHAMONEY", 0, "mule@x", "v1"),
        _rec("r2", "BETACASH", 10, "mule@x", "v2"),
        _rec("r3", "GAMMAPAY", 20, "mule@x", "v3"),
    ]
    alerts = hub.detect_mule_alerts(records)
    assert len(alerts) == 1
    assert alerts[0].n_complainants == 3
    assert alerts[0].n_operators == 3
    # l'alerte part à l'horodatage de la plainte qui fait basculer la règle
    assert alerts[0].detection_delay_minutes == 20.0


def test_deux_plaignants_ne_declenchent_pas():
    records = [
        _rec("r1", "ALPHAMONEY", 0, "mule@x", "v1"),
        _rec("r2", "BETACASH", 10, "mule@x", "v2"),
    ]
    assert hub.detect_mule_alerts(records) == []


def test_un_seul_operateur_ne_declenche_pas_le_consortium():
    """Trois plaignants, mais un seul réseau : le seuil de 2 opérateurs manque."""
    records = [
        _rec("r1", "ALPHAMONEY", 0, "mule@x", "v1"),
        _rec("r2", "ALPHAMONEY", 10, "mule@x", "v2"),
        _rec("r3", "ALPHAMONEY", 20, "mule@x", "v3"),
    ]
    assert hub.detect_mule_alerts(records) == []


def test_le_meme_plaignant_trois_fois_ne_declenche_pas():
    """Il faut des plaignants INDÉPENDANTS, pas trois plaintes du même client."""
    records = [
        _rec("r1", "ALPHAMONEY", 0, "mule@x", "v1"),
        _rec("r2", "BETACASH", 10, "mule@x", "v1"),
        _rec("r3", "GAMMAPAY", 20, "mule@x", "v1"),
    ]
    assert hub.detect_mule_alerts(records) == []


def test_hors_fenetre_de_60_minutes_ne_declenche_pas():
    records = [
        _rec("r1", "ALPHAMONEY", 0, "mule@x", "v1"),
        _rec("r2", "BETACASH", 45, "mule@x", "v2"),
        _rec("r3", "GAMMAPAY", 95, "mule@x", "v3"),
    ]
    assert hub.detect_mule_alerts(records) == []


def test_des_beneficiaires_differents_ne_se_melangent_pas():
    records = [
        _rec("r1", "ALPHAMONEY", 0, "mule-a@x", "v1"),
        _rec("r2", "BETACASH", 5, "mule-b@x", "v2"),
        _rec("r3", "GAMMAPAY", 10, "mule-c@x", "v3"),
    ]
    assert hub.detect_mule_alerts(records) == []


def test_les_seuils_de_la_regle_sont_ceux_annonces():
    assert cfg.MULE_MIN_COMPLAINANTS == 3
    assert cfg.MULE_MIN_OPERATORS == 2
    assert cfg.MULE_WINDOW_MINUTES == 60
    assert cfg.DECISION_IS_HUMAN is True


def test_l_alerte_est_une_recommandation_jamais_un_gel():
    records = [
        _rec("r1", "ALPHAMONEY", 0, "mule@x", "v1"),
        _rec("r2", "BETACASH", 10, "mule@x", "v2"),
        _rec("r3", "GAMMAPAY", 20, "mule@x", "v3"),
    ]
    alert = hub.detect_mule_alerts(records)[0]
    assert "ne gèle rien" in alert.recommendation
    assert alert.human_validator is None


# --------------------------------------------------------------------------
# Le score
# --------------------------------------------------------------------------
def test_le_score_separe_une_campagne_d_une_grappe_legitime():
    """Un facturier très sollicité déclenche la règle sans être une fraude."""
    arnaque = [
        _rec("a1", "ALPHAMONEY", 0, "mule@x", "v1"),
        _rec("a2", "BETACASH", 8, "mule@x", "v2"),
        _rec("a3", "GAMMAPAY", 15, "mule@x", "v3"),
        _rec("a4", "ALPHAMONEY", 22, "mule@x", "v4"),
    ]
    leurre = [
        _rec("d1", "ALPHAMONEY", 0, "facturier@x", "w1",
             typology=Typology.ERREUR_DESTINATAIRE_SINCERE),
        _rec("d2", "BETACASH", 15, "facturier@x", "w2",
             typology=Typology.ERREUR_DESTINATAIRE_SINCERE),
        _rec("d3", "GAMMAPAY", 30, "facturier@x", "w3",
             typology=Typology.ERREUR_DESTINATAIRE_SINCERE),
    ]
    score_arnaque, _ = hub.score_cluster(arnaque)
    score_leurre, _ = hub.score_cluster(leurre)
    assert score_arnaque > score_leurre
    assert score_arnaque >= hub.SCORE_PRIORITY_THRESHOLD
    assert score_leurre < hub.SCORE_PRIORITY_THRESHOLD


# --------------------------------------------------------------------------
# Sur le vrai jeu de données
# --------------------------------------------------------------------------
@needs_data
def test_les_cinq_campagnes_sont_detectees(oracle_records, ground_truth):
    alerts = hub.attach_impact(hub.detect_mule_alerts(oracle_records), ground_truth)
    detectees = {a.gt_campaign_id for a in alerts if a.gt_campaign_id}
    attendues = {c["campaign_id"] for c in ground_truth["campaigns"]}
    assert attendues == detectees, f"manquantes : {attendues - detectees}"
    assert len(attendues) == cfg.N_MULE_CAMPAIGNS == 5


@needs_data
def test_chaque_campagne_detectee_est_prioritaire(oracle_records, ground_truth):
    """Les vraies campagnes doivent passer le seuil de score, pas seulement la règle."""
    alerts = hub.attach_impact(hub.detect_mule_alerts(oracle_records), ground_truth)
    for a in alerts:
        if a.gt_campaign_id:
            assert a.is_priority, f"{a.gt_campaign_id} sous le seuil de score ({a.score})"


@needs_data
def test_les_arnaques_isolees_ne_levent_aucune_alerte(oracle_records, ground_truth):
    """Une victime seule ne doit PAS déclencher d'alerte : la règle exige 3/2/60."""
    isolated = set(ground_truth["isolated_scams"]["complaint_ids"])
    alerts = hub.detect_mule_alerts(oracle_records)
    for a in alerts:
        refs = set(a.evidence_complaint_refs)
        # aucune alerte ne doit être composée uniquement d'arnaques isolées
        assert not refs.issubset(isolated), f"{a.alert_id} repose sur des arnaques isolées"


@needs_data
def test_l_operateur_seul_detecte_moins_que_le_consortium(oracle_records, ground_truth):
    cons = hub.attach_impact(hub.detect_mule_alerts(oracle_records), ground_truth)
    seul = hub.attach_impact(
        hub.detect_baseline_alerts(oracle_records),
        ground_truth,
        require_same_operator_to_act=True,
    )
    c_camp = {a.gt_campaign_id for a in cons if a.gt_campaign_id}
    s_camp = {a.gt_campaign_id for a in seul if a.gt_campaign_id}
    assert s_camp < c_camp, "la référence devrait détecter strictement moins"


@needs_data
def test_le_consortium_gele_strictement_plus_que_l_operateur_seul(
    oracle_records, ground_truth
):
    cons = hub.attach_impact(hub.detect_mule_alerts(oracle_records), ground_truth)
    seul = hub.attach_impact(
        hub.detect_baseline_alerts(oracle_records),
        ground_truth,
        require_same_operator_to_act=True,
    )

    def best(alerts):
        out: dict[str, int] = {}
        for a in alerts:
            if a.gt_campaign_id:
                out[a.gt_campaign_id] = max(
                    out.get(a.gt_campaign_id, 0), a.freezable_fcfa
                )
        return sum(out.values())

    assert best(cons) > best(seul)


@needs_data
def test_le_cas_de_demo_reproduit_les_chiffres_annonces(oracle_records, ground_truth):
    """CMP-01 est le cas montré au jury : ses chiffres sont ceux du pitch."""
    alerts = hub.attach_impact(hub.detect_mule_alerts(oracle_records), ground_truth)
    cmp01 = next(a for a in alerts if a.gt_campaign_id == "CMP-01")
    assert cmp01.n_complainants == 7
    assert cmp01.n_operators == 3
    assert cmp01.total_fcfa_exact == 162_000
    assert cmp01.freezable_at_last_update_fcfa == 118_000
    assert cmp01.detection_delay_minutes == 12.0
    assert cmp01.headline == (
        "mule probable, 7 plaignants, 3 opérateurs, 162 000 FCFA "
        "dont 118 000 encore sur le compte"
    )


# --------------------------------------------------------------------------
# Le modèle de retrait
# --------------------------------------------------------------------------
def test_geler_plus_tot_sauve_toujours_plus():
    """La courbe des FCFA gelables ne doit jamais remonter."""
    start = datetime.fromisoformat("2026-11-17T14:40:00+01:00")
    model = hub.CashoutModel(
        campaign_id="T",
        mule_operator="BETACASH",
        total_fcfa=162_000,
        cashout_start_at=start,
        rate_fcfa_per_min=2_000,
        credits=[(start - timedelta(minutes=30), 162_000)],
    )
    valeurs = [model.freezable_at(start + timedelta(minutes=m)) for m in range(0, 90, 5)]
    assert valeurs == sorted(valeurs, reverse=True)
    assert model.freezable_at(start) == 162_000
    assert model.freezable_at(start + timedelta(minutes=22)) == 118_000
    assert model.freezable_at(start + timedelta(days=1)) == 0


def test_on_ne_peut_pas_retirer_ce_qui_n_est_pas_arrive():
    start = datetime.fromisoformat("2026-11-17T14:00:00+01:00")
    model = hub.CashoutModel(
        campaign_id="T",
        mule_operator="BETACASH",
        total_fcfa=100_000,
        cashout_start_at=start,
        rate_fcfa_per_min=10_000,
        credits=[(start + timedelta(minutes=50), 100_000)],
    )
    # à t+10 min, aucun crédit n'est encore arrivé : rien n'a pu être retiré
    assert model.withdrawn_by(start + timedelta(minutes=10)) == 0
    assert model.freezable_at(start + timedelta(minutes=10)) == 100_000
