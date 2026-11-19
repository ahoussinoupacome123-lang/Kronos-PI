"""Minuteur réglementaire (bloc 6).

Trois échéances, de trois textes différents :

* **J+3 jours ouvrés** — Instruction BCEAO n°008-05-2015, art. 35 :
  remboursement dans un délai de trois jours ouvrables au plus.
* **J+30 jours calendaires** — Circulaire n°002-2020/CB/C : réponse au client
  dans un délai d'un mois, traitement gratuit. (La Commission bancaire peut
  être saisie et dispose alors de 60 jours pour instruire.)
* **Échéance PI-Reclam** — paramétrable. Les délais et pénalités PI-Reclam
  sont fixés dans les conventions de participation et **ne sont pas publics** :
  la valeur utilisée ici est un paramètre de configuration, jamais présentée
  comme une mesure ni comme une obligation connue.

Les jours ouvrés excluent samedi, dimanche et la liste de jours fériés de
`config.PUBLIC_HOLIDAYS`, qui est éditable.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Iterable

from . import config as cfg
from .schemas import RegulatoryTimer


def _holidays(extra: Iterable[str] | None = None) -> set[date]:
    raw = list(cfg.PUBLIC_HOLIDAYS) + list(extra or [])
    out: set[date] = set()
    for item in raw:
        try:
            out.add(date.fromisoformat(item))
        except ValueError:
            continue
    return out


def is_business_day(day: date, holidays: set[date] | None = None) -> bool:
    """Lundi-vendredi, hors jours fériés."""
    holidays = holidays if holidays is not None else _holidays()
    return day.weekday() < 5 and day not in holidays


def add_business_days(
    start: datetime, days: int, holidays: set[date] | None = None
) -> datetime:
    """Ajoute `days` jours **ouvrés** à un horodatage.

    Convention retenue : on avance jour par jour et on ne décompte que les
    jours ouvrés. Le jour de réception ne compte pas (J+0 = le jour même),
    de sorte que J+3 pour une plainte du vendredi tombe le mercredi suivant.
    """
    holidays = holidays if holidays is not None else _holidays()
    current = start
    remaining = days
    while remaining > 0:
        current = current + timedelta(days=1)
        if is_business_day(current.date(), holidays):
            remaining -= 1
    return current


def business_days_between(
    start: datetime, end: datetime, holidays: set[date] | None = None
) -> int:
    """Nombre de jours ouvrés écoulés entre deux horodatages."""
    holidays = holidays if holidays is not None else _holidays()
    if end <= start:
        return 0
    count = 0
    cursor = start.date() + timedelta(days=1)
    last = end.date()
    while cursor <= last:
        if is_business_day(cursor, holidays):
            count += 1
        cursor += timedelta(days=1)
    return count


def build_timer(
    opened_at: datetime,
    refund_business_days: int = cfg.REFUND_BUSINESS_DAYS,
    client_answer_days: int = cfg.CLIENT_ANSWER_CALENDAR_DAYS,
    pi_reclam_hours: int = cfg.PI_RECLAM_DEADLINE_HOURS,
    extra_holidays: Iterable[str] | None = None,
) -> RegulatoryTimer:
    """Construit les trois échéances d'un dossier."""
    holidays = _holidays(extra_holidays)
    return RegulatoryTimer(
        opened_at=opened_at,
        refund_due_at=add_business_days(opened_at, refund_business_days, holidays),
        client_answer_due_at=opened_at + timedelta(days=client_answer_days),
        pi_reclam_due_at=opened_at + timedelta(hours=pi_reclam_hours),
        refund_business_days=refund_business_days,
        client_answer_calendar_days=client_answer_days,
        pi_reclam_hours=pi_reclam_hours,
        pi_reclam_deadline_is_public=cfg.PI_RECLAM_DEADLINE_IS_PUBLIC,
        notes=(
            "J+3 jours ouvrés : Instruction n°008-05-2015, art. 35. "
            "J+30 calendaires : Circulaire n°002-2020/CB/C (la Commission "
            "bancaire dispose de 60 jours pour instruire si elle est saisie). "
            "Échéance PI-Reclam : paramètre de configuration — les délais et "
            "pénalités PI-Reclam ne sont pas publics."
        ),
    )


def urgency(timer: RegulatoryTimer, now: datetime) -> tuple[str, str]:
    """Niveau d'urgence et message, pour le bandeau de l'UI."""
    status = timer.status(now)
    if status["remboursement_expire"]:
        return "expire", "Délai de remboursement (art. 35) DÉPASSÉ"
    hours = status["heures_avant_remboursement"]
    if hours <= 8:
        return "critique", f"Remboursement à rendre dans {hours:.0f} h"
    if hours <= 24:
        return "alerte", f"Remboursement à rendre dans {hours:.0f} h"
    return "ok", f"Remboursement à rendre dans {hours / 24:.1f} jours"
