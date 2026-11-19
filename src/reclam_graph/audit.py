"""Piste d'audit (bloc 6).

Chaque décision — alerte, recommandation de gel, dossier de litige — est
tracée en JSON avec ses preuves et le champ du validateur humain. C'est la
réponse à « montrez-moi que c'est démontrable au régulateur » : art. 30 de
l'Instruction n°008-05-2015 demande un système de réclamations qui engage
l'émetteur sur un délai **et sur la traçabilité**.

Les entrées sont **chaînées par hachage** : chaque entrée porte le hachage de
la précédente. Une entrée modifiée ou supprimée après coup casse la chaîne et
`verify_chain()` le dit. Ce n'est pas de l'inviolabilité cryptographique
(quiconque peut recalculer toute la chaîne) : c'est une détection d'altération
accidentelle ou opportuniste, ce qui est déjà ce qu'on demande à un journal
d'audit applicatif.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable, Sequence

from . import config as cfg
from .schemas import AuditEntry, Decision

GENESIS = "0" * 64


def _canonical(entry: AuditEntry) -> str:
    """Représentation stable d'une entrée, hors son propre hachage."""
    payload = entry.model_dump(mode="json", exclude={"entry_hash"})
    return json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def compute_hash(entry: AuditEntry) -> str:
    return hashlib.sha256(_canonical(entry).encode("utf-8")).hexdigest()


class AuditLog:
    """Journal d'audit append-only, chaîné par hachage."""

    def __init__(self, path: Path = cfg.AUDIT_FILE) -> None:
        self.path = path
        self._entries: list[AuditEntry] = []
        if path.exists():
            self._entries = self.load(path)

    # -- écriture ----------------------------------------------------------
    def append(
        self,
        actor: str,
        action: str,
        subject_type: str,
        subject_id: str,
        *,
        rule: str | None = None,
        thresholds: dict[str, Any] | None = None,
        evidence: dict[str, Any] | None = None,
        decision: Decision | None = None,
        human_validator: str | None = None,
        ts: datetime | None = None,
    ) -> AuditEntry:
        prev = self._entries[-1].entry_hash if self._entries else GENESIS
        entry = AuditEntry(
            entry_id=f"AUD-{len(self._entries) + 1:06d}",
            ts=ts or datetime.now().astimezone(),
            actor=actor,
            action=action,
            subject_type=subject_type,
            subject_id=subject_id,
            rule=rule,
            thresholds=thresholds or {},
            evidence=evidence or {},
            human_validator=human_validator,
            decision=decision,
            prev_hash=prev,
        )
        entry.entry_hash = compute_hash(entry)
        self._entries.append(entry)
        return entry

    def flush(self) -> Path:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("w", encoding="utf-8") as fh:
            for entry in self._entries:
                fh.write(entry.model_dump_json() + "\n")
        return self.path

    # -- lecture -----------------------------------------------------------
    @property
    def entries(self) -> list[AuditEntry]:
        return list(self._entries)

    def __len__(self) -> int:
        return len(self._entries)

    @staticmethod
    def load(path: Path = cfg.AUDIT_FILE) -> list[AuditEntry]:
        if not path.exists():
            return []
        out: list[AuditEntry] = []
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                out.append(AuditEntry.model_validate_json(line))
        return out

    # -- vérification ------------------------------------------------------
    def verify_chain(self) -> tuple[bool, list[str]]:
        return verify_chain(self._entries)


def verify_chain(entries: Sequence[AuditEntry]) -> tuple[bool, list[str]]:
    """Vérifie le chaînage. Renvoie (intègre, liste des anomalies)."""
    problems: list[str] = []
    expected_prev = GENESIS
    for entry in entries:
        if entry.prev_hash != expected_prev:
            problems.append(
                f"{entry.entry_id} : prev_hash={entry.prev_hash[:12]}… "
                f"attendu {expected_prev[:12]}…"
            )
        recomputed = compute_hash(entry)
        if recomputed != entry.entry_hash:
            problems.append(
                f"{entry.entry_id} : contenu modifié "
                f"(hachage recalculé {recomputed[:12]}… ≠ {entry.entry_hash[:12]}…)"
            )
        expected_prev = entry.entry_hash
    return (not problems), problems


def report(entries: Iterable[AuditEntry]) -> dict[str, Any]:
    """Résumé affiché dans l'onglet Audit de l'UI."""
    rows = list(entries)
    by_action: dict[str, int] = {}
    for e in rows:
        by_action[e.action] = by_action.get(e.action, 0) + 1
    ok, problems = verify_chain(rows)
    validated = sum(1 for e in rows if e.human_validator)
    return {
        "n_entrees": len(rows),
        "par_action": dict(sorted(by_action.items())),
        "chaine_integre": ok,
        "anomalies": problems,
        "entrees_avec_validateur_humain": validated,
        "entrees_en_attente_de_validation": len(rows) - validated,
        "base_reglementaire": (
            "Instruction BCEAO n°008-05-2015, art. 30 : système de réclamations "
            "engageant l'émetteur sur un délai et sur la traçabilité."
        ),
        "portee_du_chainage": (
            "Détection d'altération d'un journal applicatif, pas inviolabilité "
            "cryptographique : la chaîne entière est recalculable."
        ),
    }
