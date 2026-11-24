"""Radar d'incidents (module recyclé de Réclam'Radar).

Deux signaux complémentaires :

1. **Détection de pic** : on compte les plaintes par heure et par couple
   (opérateur, typologie), et on compare chaque heure à une base glissante
   des heures précédentes (médiane + écart absolu médian, robustes aux pics).
   Une panne PI-SPI ou les timeouts d'un réseau sortent là.
2. **Regroupement sémantique** : à l'intérieur de la fenêtre suspecte, on
   groupe les textes par embedding pour nommer l'incident et montrer des
   exemples représentatifs.

Un incident repéré ici, c'est l'avalanche de tickets évitée : le brief parle
d'« incident repéré avant l'avalanche de tickets ».
"""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Sequence

import numpy as np

from . import config as cfg
from .embed import embed_texts
from .schemas import Complaint, Extraction, IncidentAlert, Typology

#: Nombre minimal d'observations de la MÊME heure de la journée, les jours
#: précédents, nécessaires pour juger l'heure courante.
MIN_BASELINE_OBSERVATIONS = 3
#: Seuil de score robuste au-delà duquel on parle de pic.
SPIKE_THRESHOLD = 6.0
#: Il faut un volume minimal : 3 plaintes au-dessus d'une base nulle ne sont
#: pas un incident, juste du bruit.
MIN_SPIKE_COUNT = 25
#: Et il faut que le pic soit *matériel*, pas seulement statistiquement
#: inhabituel : sur une série très régulière, 31 plaintes contre 23 habituelles
#: donnent un score élevé sans qu'il se passe quoi que ce soit. On exige donc
#: au moins le double du volume normal.
MIN_SPIKE_RATIO = 2.0


@dataclass
class HourBucket:
    hour: datetime
    operator: str
    typology: Typology
    count: int
    complaint_ids: list[str]


def _hour_buckets(
    complaints: Sequence[Complaint], extractions: Sequence[Extraction]
) -> dict[tuple[str, Typology], list[HourBucket]]:
    by_key: dict[tuple[str, Typology, datetime], list[str]] = defaultdict(list)
    for c, e in zip(complaints, extractions):
        hour = c.received_at.replace(minute=0, second=0, microsecond=0)
        by_key[(c.operator, e.typology, hour)].append(c.complaint_id)

    series: dict[tuple[str, Typology], list[HourBucket]] = defaultdict(list)
    for (operator, typology, hour), ids in by_key.items():
        series[(operator, typology)].append(
            HourBucket(hour, operator, typology, len(ids), ids)
        )
    for key in series:
        series[key].sort(key=lambda b: b.hour)
    return series


def _robust_baseline(counts: Sequence[int]) -> tuple[float, float]:
    """Médiane et MAD mis à l'échelle. Robustes : un pic ne pollue pas sa base."""
    if not counts:
        return 0.0, 1.0
    arr = np.asarray(counts, dtype=float)
    median = float(np.median(arr))
    mad = float(np.median(np.abs(arr - median)))
    # 1.4826 : facteur qui rend le MAD comparable à un écart-type sur une loi normale
    scale = max(1.0, mad * 1.4826)
    return median, scale


def detect_incidents(
    complaints: Sequence[Complaint],
    extractions: Sequence[Extraction],
    embed_engine: str = "auto",
    max_texts_per_cluster_sample: int = 600,
) -> tuple[list[IncidentAlert], dict[str, Any]]:
    """Repère les pics par (opérateur, typologie), puis nomme chaque incident."""
    series = _hour_buckets(complaints, extractions)
    text_by_id = {c.complaint_id: c.text for c in complaints}

    raw_spikes: list[dict[str, Any]] = []
    for (operator, typology), buckets in series.items():
        # Base SAISONNIÈRE : on compare une heure à la même heure des jours
        # précédents. Comparer 10 h du matin à la moyenne des heures qui
        # précèdent reviendrait à la comparer à la nuit, et le pic d'activité
        # normal du matin serait signalé comme un incident. C'est le premier
        # faux positif qu'a produit ce radar.
        by_hour_of_day: dict[int, list[int]] = defaultdict(list)
        for bucket in buckets:
            if bucket.count < MIN_SPIKE_COUNT:
                by_hour_of_day[bucket.hour.hour].append(bucket.count)
                continue
            history = list(by_hour_of_day[bucket.hour.hour])
            by_hour_of_day[bucket.hour.hour].append(bucket.count)
            if len(history) < MIN_BASELINE_OBSERVATIONS:
                continue
            median, scale = _robust_baseline(history)
            score = (bucket.count - median) / scale
            ratio = bucket.count / max(1.0, median)
            if score >= SPIKE_THRESHOLD and ratio >= MIN_SPIKE_RATIO:
                raw_spikes.append(
                    {
                        "operator": operator,
                        "typology": typology,
                        "hour": bucket.hour,
                        "count": bucket.count,
                        "baseline_mean": round(median, 2),
                        "zscore": round(score, 2),
                        "ratio": round(ratio, 2),
                        "complaint_ids": bucket.complaint_ids,
                    }
                )

    # Fusion : une panne d'interopérabilité touche plusieurs opérateurs sur
    # plusieurs heures consécutives. On la présente comme UN incident, sinon
    # le radar crache neuf alertes pour un seul événement.
    raw_spikes.sort(key=lambda s: (s["typology"].value, s["hour"]))
    groups: list[list[dict[str, Any]]] = []
    for spike in raw_spikes:
        placed = False
        for group in groups:
            same_typology = group[0]["typology"] == spike["typology"]
            close_in_time = any(
                abs((spike["hour"] - g["hour"]).total_seconds()) <= 3600 * 2 for g in group
            )
            if same_typology and close_in_time:
                group.append(spike)
                placed = True
                break
        if not placed:
            groups.append([spike])

    alerts: list[IncidentAlert] = []
    embed_info: dict[str, Any] = {"engine": None}
    for idx, group in enumerate(groups, start=1):
        ids: list[str] = []
        for spike in group:
            ids.extend(spike["complaint_ids"])
        hours = sorted(g["hour"] for g in group)
        operators = sorted({g["operator"] for g in group})
        typology = group[0]["typology"]
        detected_at = min(hours) + timedelta(hours=1)  # fin de l'heure qui a basculé

        sample_ids = ids[:max_texts_per_cluster_sample]
        samples = [text_by_id[i] for i in sample_ids if i in text_by_id]
        cluster_id = None
        cluster_size = None
        if len(samples) >= 10:
            result = embed_texts(samples, engine=embed_engine)
            embed_info = result.as_dict()
            cluster_id, cluster_size, samples = _dominant_cluster(result.vectors, samples)

        alerts.append(
            IncidentAlert(
                incident_id=f"RADAR-{idx:02d}",
                detected_at=detected_at,
                window_start=min(hours),
                window_end=max(hours) + timedelta(hours=1),
                operator=None if len(operators) > 1 else operators[0],
                typology=typology,
                count=len(ids),
                baseline_mean=round(
                    sum(g["baseline_mean"] for g in group) / len(group), 2
                ),
                zscore=round(max(g["zscore"] for g in group), 2),
                cluster_id=cluster_id,
                cluster_size=cluster_size,
                sample_texts=samples[:3],
                label=_label_incident(typology, operators),
            )
        )
    alerts.sort(key=lambda a: a.detected_at)
    return alerts, embed_info


def _dominant_cluster(
    vectors: np.ndarray, texts: list[str], k: int = 4
) -> tuple[int | None, int | None, list[str]]:
    """Groupe les textes et renvoie le plus gros groupe, qui nomme l'incident."""
    from sklearn.cluster import KMeans

    n = vectors.shape[0]
    if n < k * 2:
        return None, None, texts
    labels = KMeans(n_clusters=k, n_init=4, random_state=cfg.SEED).fit_predict(vectors)
    biggest, size = Counter(labels.tolist()).most_common(1)[0]
    members = [t for t, lab in zip(texts, labels.tolist()) if lab == biggest]
    return int(biggest), int(size), members


def _label_incident(typology: Typology, operators: list[str]) -> str:
    scope = "les 3 réseaux" if len(operators) >= 3 else ", ".join(operators)
    if typology == Typology.RETARD_TIMEOUT:
        if len(operators) >= 2:
            return (
                f"Panne d'interopérabilité probable (PI-SPI) — vague de timeouts "
                f"sur {scope}"
            )
        return f"Timeouts concentrés sur {scope}"
    if typology == Typology.TRANSACTION_ECHOUEE_DEBITEE:
        return f"Vague d'échecs avec débit sur {scope}"
    if typology == Typology.OTP_PHISHING:
        return f"Campagne d'hameçonnage de codes OTP sur {scope}"
    return f"Pic de {typology.value} sur {scope}"


def evaluate_against_ground_truth(
    alerts: Sequence[IncidentAlert], ground_truth: dict[str, Any]
) -> dict[str, Any]:
    """Compare les alertes du radar aux incidents réellement injectés."""
    truth = ground_truth.get("incidents", [])
    matched: list[dict[str, Any]] = []
    for inc in truth:
        start = datetime.fromisoformat(inc["window_start"])
        end = datetime.fromisoformat(inc["window_end"])
        hit = next(
            (
                a
                for a in alerts
                if a.typology.value == inc["typology"]
                and a.window_start <= end
                and a.window_end >= start
            ),
            None,
        )
        matched.append(
            {
                "incident_id": inc["incident_id"],
                "label": inc["label"],
                "detecte": hit is not None,
                "alerte": hit.incident_id if hit else None,
                "detecte_a": hit.detected_at.isoformat() if hit else None,
                "debut_reel": inc["window_start"],
                "delai_minutes": (
                    round((hit.detected_at - start).total_seconds() / 60.0, 1)
                    if hit
                    else None
                ),
                "zscore": hit.zscore if hit else None,
            }
        )
    detected = sum(1 for m in matched if m["detecte"])
    matched_ids = {m["alerte"] for m in matched if m["alerte"]}
    false_positives = [
        {
            "incident_id": a.incident_id,
            "detecte_a": a.detected_at.isoformat(),
            "typologie": a.typology.value,
            "operateur": a.operator,
            "n_plaintes": a.count,
            "volume_habituel": a.baseline_mean,
            "zscore": a.zscore,
            "label": a.label,
        }
        for a in alerts
        if a.incident_id not in matched_ids
    ]
    return {
        "incidents_injectes": len(truth),
        "incidents_detectes": detected,
        "rappel": round(detected / len(truth), 4) if truth else None,
        "alertes_radar_totales": len(alerts),
        "faux_positifs": len(false_positives),
        "precision": (
            round(len(matched_ids) / len(alerts), 4) if alerts else None
        ),
        "detail_faux_positifs": false_positives,
        "note_precision": (
            "Les faux positifs du radar sont des fluctuations au plancher de "
            "détection (quelques dizaines de plaintes au-dessus de l'ordinaire). "
            "Les seuils (%d plaintes minimum, x%.1f le volume habituel) n'ont PAS "
            "été ajustés pour les faire disparaître : les relever jusqu'à obtenir "
            "une précision parfaite sur ce jeu reviendrait à régler le détecteur "
            "sur les données d'évaluation."
            % (MIN_SPIKE_COUNT, MIN_SPIKE_RATIO)
        ),
        "detail": matched,
    }
