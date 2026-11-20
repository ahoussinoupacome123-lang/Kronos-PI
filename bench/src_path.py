"""Ajoute `src/` au chemin d'import quand le banc est lancé depuis la racine."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def ensure_src() -> None:
    for path in (str(ROOT), str(SRC)):
        if path not in sys.path:
            sys.path.insert(0, path)


ensure_src()
