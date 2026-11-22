"""Les échéances réglementaires : J+3 jours ouvrés, J+30 calendaires."""

from __future__ import annotations

from datetime import datetime

from reclam_graph import config as cfg
from reclam_graph.timer import (
    add_business_days,
    build_timer,
    business_days_between,
    is_business_day,
    urgency,
)


def _at(iso: str) -> datetime:
    return datetime.fromisoformat(iso)


def test_j3_jours_ouvres_depuis_un_vendredi_tombe_mercredi():
    """Vendredi + 3 ouvrés : on saute samedi et dimanche."""
    due = add_business_days(_at("2026-11-20T14:09:00+01:00"), 3)
    assert due.date().isoformat() == "2026-11-25"
    assert due.weekday() == 2  # mercredi


def test_j3_jours_ouvres_depuis_un_lundi_tombe_jeudi():
    due = add_business_days(_at("2026-11-16T09:00:00+01:00"), 3)
    assert due.date().isoformat() == "2026-11-19"


def test_les_jours_feries_sont_sautes():
    """Le 25 décembre est férié : jeudi 24 + 3 ouvrés dépasse le week-end."""
    due = add_business_days(_at("2026-12-24T09:00:00+01:00"), 3)
    assert due.date().isoformat() == "2026-12-30"
    assert not is_business_day(_at("2026-12-25T09:00:00+01:00").date())


def test_le_week_end_n_est_pas_ouvre():
    assert not is_business_day(_at("2026-11-21T09:00:00+01:00").date())  # samedi
    assert not is_business_day(_at("2026-11-22T09:00:00+01:00").date())  # dimanche
    assert is_business_day(_at("2026-11-23T09:00:00+01:00").date())  # lundi


def test_comptage_de_jours_ouvres():
    assert business_days_between(
        _at("2026-11-20T14:00:00+01:00"), _at("2026-11-25T14:00:00+01:00")
    ) == 3


def test_le_minuteur_pose_les_trois_echeances():
    opened = _at("2026-11-17T14:09:00+01:00")
    timer = build_timer(opened)
    assert timer.refund_business_days == cfg.REFUND_BUSINESS_DAYS == 3
    assert timer.client_answer_calendar_days == cfg.CLIENT_ANSWER_CALENDAR_DAYS == 30
    # J+30 est calendaire, pas ouvré
    assert (timer.client_answer_due_at - opened).days == 30
    # l'échéance de remboursement est la plus proche des trois
    assert timer.refund_due_at < timer.client_answer_due_at
    assert timer.pi_reclam_due_at == opened.replace() + __import__("datetime").timedelta(
        hours=cfg.PI_RECLAM_DEADLINE_HOURS
    )


def test_l_echeance_pi_reclam_est_declaree_non_publique():
    """Les délais PI-Reclam ne sont pas publics : le dire est non négociable."""
    timer = build_timer(_at("2026-11-17T14:09:00+01:00"))
    assert timer.pi_reclam_deadline_is_public is False
    assert "ne sont pas publics" in timer.notes


def test_statut_et_urgence():
    opened = _at("2026-11-17T14:09:00+01:00")
    timer = build_timer(opened)
    statut = timer.status(opened)
    assert statut["remboursement_expire"] is False
    assert statut["heures_avant_remboursement"] > 0
    niveau, _ = urgency(timer, opened)
    assert niveau == "ok"
    # bien après l'échéance
    expire = timer.status(_at("2026-12-31T00:00:00+01:00"))
    assert expire["remboursement_expire"] is True
    assert urgency(timer, _at("2026-12-31T00:00:00+01:00"))[0] == "expire"
