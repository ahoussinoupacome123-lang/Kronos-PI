"""Recalcule l'étiquette d'exécution des fichiers de `results/` déjà produits.

BUG-001 : des fichiers portent « GPU run — Tesla T4 » alors que les moteurs
qu'ils enregistrent eux-mêmes sont `heuristic-fallback` et `tfidf-svd`. On ne
réécrit aucune mesure : on corrige uniquement la phrase qui décrit ce qui a
calculé, à partir des moteurs que le fichier déclare.

    python scripts/fix_execution_label.py [--check]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from reclam_graph import config as cfg  # noqa: E402

GPU_EXTRACTION = cfg.GPU_EXTRACTION_ENGINES
GPU_EMBED = cfg.GPU_EMBED_ENGINES


def _carte(etiquette: str) -> str | None:
    """Nom de la carte tel que le fichier l'a enregistré, sans rien inventer."""
    m = re.search(r"GPU run — ([^—]+?)\s*\(", etiquette)
    return m.group(1).strip() if m else None


def _label(etiquette: str, extraction: list[str], embed: str | None) -> str:
    carte = _carte(etiquette)
    if carte is None:
        return etiquette
    sur_gpu = []
    if any(e in GPU_EXTRACTION for e in extraction):
        sur_gpu.append("LLM")
    if embed in GPU_EMBED:
        sur_gpu.append("bge-m3")
    if sur_gpu:
        return f"{etiquette.split(' — calculé')[0]} — calculé sur GPU : {' + '.join(sur_gpu)}"
    moteurs = " + ".join(dict.fromkeys([m for m in [*extraction, embed] if m])) or "repli local"
    return (
        f"repli CPU sur machine équipée d'une {carte} — "
        f"aucun calcul sur GPU ({moteurs})"
    )


def _moteurs(data: dict) -> tuple[list[str], str | None]:
    meta = data.get("meta", {})
    extraction = list(meta.get("moteurs_extraction") or [])
    embed = meta.get("moteur_embeddings")
    if isinstance(embed, dict):
        embed = embed.get("engine")
    if not extraction:
        moteur = (data.get("cout") or {}).get("moteur_mesure")
        if moteur:
            extraction = [moteur]
    if embed is None:
        moteurs = data.get("moteurs") or {}
        if "bge-m3" in moteurs:
            embed = "bge-m3"
        elif moteurs:
            embed = next(iter(moteurs))
    return extraction, embed


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    changed = []
    for path in sorted(cfg.RESULTS_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(data, dict):
            continue
        extraction, embed = _moteurs(data)
        touched = False
        for bloc in (data, data.get("meta"), data.get("cout")):
            if not isinstance(bloc, dict):
                continue
            ancienne = bloc.get("etiquette_execution")
            if not isinstance(ancienne, str) or "GPU run" not in ancienne:
                continue
            nouvelle = _label(ancienne, extraction, embed)
            if nouvelle != ancienne:
                bloc.setdefault("materiel_present", ancienne)
                bloc["etiquette_execution"] = nouvelle
                touched = True
        if touched:
            changed.append(path.name)
            if not args.check:
                path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )

    if args.check:
        if changed:
            print("Étiquettes trompeuses :", ", ".join(changed))
            return 1
        print("Toutes les étiquettes décrivent les moteurs employés.")
        return 0
    print("Corrigé :", ", ".join(changed) if changed else "rien à corriger")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
