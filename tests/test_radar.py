"""Radar d'incidents : le pic PI-SPI est trouvé, le matin normal ne l'est pas."""

from __future__ import annotations

from datetime import datetime, timedelta

from reclam_graph.radar import (
    MIN_SPIKE_COUNT,
    MIN_SPIKE_RATIO,
    _robust_baseline,
    detect_incidents,
    evaluate_against_ground_truth,
)
from reclam_graph.schemas import Channel, Complaint, Extraction, Typology

from .conftest import needs_data


def _series(counts_per_hour: list[int], typology=Typology.RETARD_TIMEOUT):
    """Fabrique un corpus dont le volume horaire suit `counts_per_hour`."""
    base = datetime.fromisoformat("2026-11-16T00:00:00+01:00")
    complaints, extractions = [], []
    n = 0
    for hour, count in enumerate(counts_per_hour):
        for k in range(count):
            n += 1
            cid = f"RC-{n:06d}"
            complaints.append(
                Complaint(
                    complaint_id=cid,
                    operator="ALPHAMONEY",
                    channel=Channel.SMS,
                    received_at=base + timedelta(hours=hour, minutes=k % 60),
                    complainant_msisdn=f"+2299600{n:04d}",
                    complainant_name="T",
                    # textes variés : un corpus identique ferait râler SVD/KMeans
                    text=f"transfert de {5000 + (n % 7) * 2500} bloque depuis "
                         f"{hour}h, essai {k % 5}, reseau indisponible",
                )
            )
            extractions.append(Extraction(complaint_id=cid, typology=typology))
    return complaints, extractions


def test_la_base_robuste_ignore_un_pic():
    """Médiane + MAD : un pic ne doit pas gonfler sa propre base."""
    median, _ = _robust_baseline([10, 11, 9, 10, 400, 10])
    assert 9 <= median <= 11


def test_un_pic_franc_est_detecte():
    # 8 jours de la même heure à ~10, puis une heure à 300
    counts = [10] * 24 * 4
    counts += [300]
    complaints, extractions = _series(counts)
    alerts, _ = detect_incidents(complaints, extractions, embed_engine="tfidf")
    assert len(alerts) >= 1
    assert alerts[0].count >= MIN_SPIKE_COUNT


def test_un_volume_regulier_ne_declenche_rien():
    """Pas d'alerte sans anomalie : le radar ne doit pas crier en permanence."""
    complaints, extractions = _series([30] * 24 * 5)
    alerts, _ = detect_incidents(complaints, extractions, embed_engine="tfidf")
    assert alerts == []


def test_une_hausse_faible_ne_declenche_pas():
    """31 plaintes contre 28 habituelles : inhabituel peut-être, incident non."""
    counts = [28] * 24 * 4 + [31]
    complaints, extractions = _series(counts)
    alerts, _ = detect_incidents(complaints, extractions, embed_engine="tfidf")
    assert alerts == []
    assert MIN_SPIKE_RATIO >= 2.0


# --------------------------------------------------------------------------
# Sur le vrai jeu
# --------------------------------------------------------------------------
@needs_data
def test_l_incident_pi_spi_du_scenario_est_detecte(complaints, ground_truth):
    from reclam_graph.extract import extract_heuristic

    extractions = [extract_heuristic(c) for c in complaints]
    alerts, _ = detect_incidents(complaints, extractions, embed_engine="tfidf")
    evaluation = evaluate_against_ground_truth(alerts, ground_truth)
    assert evaluation["rappel"] == 1.0
    detail = evaluation["detail"][0]
    assert detail["detecte"] is True
    assert detail["zscore"] > 5


@needs_data
def test_l_incident_detecte_couvre_les_trois_reseaux(complaints, ground_truth):
    """Une panne d'interopérabilité touche tout le monde : c'est sa signature."""
    from reclam_graph.extract import extract_heuristic

    extractions = [extract_heuristic(c) for c in complaints]
    alerts, _ = detect_incidents(complaints, extractions, embed_engine="tfidf")
    pi_spi = [a for a in alerts if a.typology is Typology.RETARD_TIMEOUT]
    assert pi_spi
    assert pi_spi[0].operator is None  # None = plusieurs opérateurs
    assert "interopérabilité" in pi_spi[0].label.lower()


@needs_data
def test_le_radar_ne_noie_pas_l_operateur_d_alertes(complaints, ground_truth):
    from reclam_graph.extract import extract_heuristic

    extractions = [extract_heuristic(c) for c in complaints]
    alerts, _ = detect_incidents(complaints, extractions, embed_engine="tfidf")
    # un seul incident injecté sur 7 jours : pas plus de 3 alertes acceptables
    assert len(alerts) <= 3
