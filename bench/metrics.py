"""Métriques du banc de mesure.

Toutes les fonctions de ce module renvoient des nombres **calculés sur les
données du dépôt**. Aucune valeur n'y est écrite en dur.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any, Sequence


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------
def macro_f1(y_true: Sequence[str], y_pred: Sequence[str]) -> dict[str, Any]:
    """F1 macro et détail par classe, sans dépendance externe."""
    labels = sorted(set(y_true) | set(y_pred))
    per_class: dict[str, dict[str, float]] = {}
    f1s: list[float] = []
    for label in labels:
        tp = sum(1 for t, p in zip(y_true, y_pred) if t == label and p == label)
        fp = sum(1 for t, p in zip(y_true, y_pred) if t != label and p == label)
        fn = sum(1 for t, p in zip(y_true, y_pred) if t == label and p != label)
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        support = sum(1 for t in y_true if t == label)
        per_class[label] = {
            "precision": round(precision, 4),
            "rappel": round(recall, 4),
            "f1": round(f1, 4),
            "support": support,
        }
        if support:  # une classe absente de la vérité terrain ne pèse pas
            f1s.append(f1)
    accuracy = sum(1 for t, p in zip(y_true, y_pred) if t == p) / len(y_true)
    return {
        "f1_macro": round(sum(f1s) / len(f1s), 4) if f1s else 0.0,
        "exactitude": round(accuracy, 4),
        "n": len(y_true),
        "par_classe": per_class,
    }


# ---------------------------------------------------------------------------
# Extraction de champs (F1 de remplissage de créneau)
# ---------------------------------------------------------------------------
def slot_f1(
    truths: Sequence[Any], preds: Sequence[Any], normalize=lambda v: v
) -> dict[str, Any]:
    """F1 par champ.

    * TP : la vérité terrain a une valeur et la prédiction est exactement celle-là
    * FP : la prédiction a une valeur fausse (ou inventée alors qu'il n'y en a pas)
    * FN : la vérité terrain a une valeur et la prédiction la manque

    C'est la convention habituelle du *slot filling* : inventer une valeur est
    aussi pénalisé que de la manquer.
    """
    tp = fp = fn = 0
    for truth, pred in zip(truths, preds):
        t = normalize(truth) if truth is not None else None
        p = normalize(pred) if pred is not None else None
        if t is not None and p is not None and t == p:
            tp += 1
        else:
            if p is not None:
                fp += 1
            if t is not None:
                fn += 1
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "f1": round(f1, 4),
        "precision": round(precision, 4),
        "rappel": round(recall, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "support": sum(1 for t in truths if t is not None),
    }


# ---------------------------------------------------------------------------
# Détection de campagnes
# ---------------------------------------------------------------------------
def median(values: Sequence[float]) -> float | None:
    if not values:
        return None
    s = sorted(values)
    mid = len(s) // 2
    return round(s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2, 2)


def campaign_detection(
    alerts: Sequence[dict[str, Any]],
    campaigns: Sequence[dict[str, Any]],
    only_priority: bool = False,
) -> dict[str, Any]:
    """Rappel, précision et délai de détection par campagne.

    Une campagne est détectée si au moins une alerte lui est rattachée. Le
    délai retenu est celui de l'alerte **la plus précoce** pour cette
    campagne. Une alerte sans campagne rattachée est un faux positif.
    """
    rows = [a for a in alerts if (a.get("is_priority") or not only_priority)]
    best: dict[str, dict[str, Any]] = {}
    false_positives: list[dict[str, Any]] = []
    for a in rows:
        cid = a.get("gt_campaign_id")
        if not cid:
            false_positives.append(
                {
                    "alert_id": a["alert_id"],
                    "alerte_a": a["alert_at"],
                    "n_plaignants": a["n_complainants"],
                    "n_operateurs": a["n_operators"],
                    "score": a["score"],
                }
            )
            continue
        current = best.get(cid)
        if current is None or a["alert_at"] < current["alert_at"]:
            best[cid] = a

    detail: list[dict[str, Any]] = []
    delays: list[float] = []
    freezable_total = 0
    for c in campaigns:
        cid = c["campaign_id"]
        a = best.get(cid)
        if a:
            delays.append(float(a["detection_delay_minutes"]))
            freezable_total += int(a.get("freezable_fcfa") or 0)
        detail.append(
            {
                "campagne": cid,
                "libelle": c.get("label"),
                "mule_chez": c.get("mule_operator"),
                "total_fcfa": c.get("total_fcfa"),
                "detectee": a is not None,
                "alerte_a": a["alert_at"] if a else None,
                "premiere_plainte_a": a["first_complaint_at"] if a else None,
                "delai_detection_minutes": a["detection_delay_minutes"] if a else None,
                "n_plaignants": a["n_complainants"] if a else None,
                "n_operateurs": a["n_operators"] if a else None,
                "fcfa_encore_gelables": a.get("freezable_fcfa") if a else 0,
                "note_impact": a.get("impact_note") if a else "non détectée",
                "detectee_par": a.get("detected_by") if a else None,
            }
        )
    detected = sum(1 for d in detail if d["detectee"])
    n_true_alerts = len(best)
    return {
        "campagnes_injectees": len(campaigns),
        "campagnes_detectees": detected,
        "rappel": round(detected / len(campaigns), 4) if campaigns else None,
        "alertes_totales": len(rows),
        "alertes_vraies": n_true_alerts,
        "faux_positifs": len(false_positives),
        "precision": (
            round(n_true_alerts / len(rows), 4) if rows else None
        ),
        "delai_detection_median_minutes": median(delays),
        "delai_detection_min_minutes": min(delays) if delays else None,
        "delai_detection_max_minutes": max(delays) if delays else None,
        "fcfa_encore_gelables_total": freezable_total,
        "detail_faux_positifs": false_positives,
        "detail": detail,
    }


# ---------------------------------------------------------------------------
# Coût
# ---------------------------------------------------------------------------
NOT_COMPUTED = "non calculé"


def cost_per_1000(
    throughput_per_second: float | None,
    hourly_price_fcfa: float | None,
) -> float | str:
    """Coût direct de 1 000 réclamations = prix horaire ÷ débit mesuré.

    Si le prix horaire n'est pas renseigné, on renvoie « non calculé » — on
    n'invente pas un tarif pour faire joli dans un tableau.
    """
    if not throughput_per_second or not hourly_price_fcfa:
        return NOT_COMPUTED
    seconds_for_1000 = 1000.0 / throughput_per_second
    return round(hourly_price_fcfa / 3600.0 * seconds_for_1000, 2)
