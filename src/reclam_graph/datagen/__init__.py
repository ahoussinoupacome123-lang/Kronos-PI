"""Générateur synthétique de réclamations (bloc 1 de l'architecture).

Toutes les données de ce projet sont **synthétiques**. Le générateur et la
vérité terrain sont publiés dans ce dépôt : c'est la réponse à la question du
jury « vos données sont synthétiques ».
"""

from __future__ import annotations

from typing import Any

__all__ = ["generate_dataset"]


def generate_dataset(*args: Any, **kwargs: Any) -> Any:
    """Import paresseux : évite le RuntimeWarning de `python -m`."""
    from .generator import generate_dataset as _impl

    return _impl(*args, **kwargs)
