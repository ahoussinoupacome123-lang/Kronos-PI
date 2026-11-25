"""Mesure du moteur d'embeddings (bloc 3) : bge-m3 contre le repli TF-IDF.

Pourquoi ce banc existe : le brief impose bge-m3, et le pipeline livré utilise
par défaut un repli TF-IDF sur CPU. Il faut donc **mesurer** le coût réel de
bge-m3 plutôt que d'affirmer qu'il est trop lent.

    python -m bench.embed_bench --n 300

Produit `results/embed_bench.json`. Sur GPU, relancer avec un `--n` plus grand :
le même fichier portera l'étiquette « GPU run » et des chiffres tout autres.
"""

from __future__ import annotations

import argparse
import json
import time
from typing import Any

from bench.src_path import ensure_src  # noqa: F401

from reclam_graph import config as cfg
from reclam_graph.embed import ST_MAX_TEXTS_CPU, embed_texts
from reclam_graph.pipeline import load_complaints

OUT = cfg.RESULTS_DIR / "embed_bench.json"


def run(n: int = 300, with_bge: bool = True) -> dict[str, Any]:
    complaints = load_complaints()
    texts = [c.text for c in complaints[:n]]
    print(f"Corpus : {len(texts)} réclamations.")
    etiquette = cfg.execution_label([], "bge-m3" if with_bge else "tfidf-svd")
    print(f"Matériel : {etiquette}\n")

    report: dict[str, Any] = {
        "genere_le": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "etiquette_execution": etiquette,
        "materiel_present": cfg.HARDWARE.run_label,
        "n_textes": len(texts),
        "moteurs": {},
    }

    result = embed_texts(texts, engine="tfidf")
    report["moteurs"]["tfidf-svd"] = result.as_dict()
    print(f"tfidf-svd : {result.seconds:.2f}s ({result.texts_per_second} textes/s)")

    if with_bge:
        try:
            result = embed_texts(texts, engine="bge-m3")
            report["moteurs"]["bge-m3"] = result.as_dict()
            print(f"bge-m3    : {result.seconds:.2f}s ({result.texts_per_second} textes/s)")
        except Exception as exc:
            report["moteurs"]["bge-m3"] = {
                "mesure": False,
                "note": f"non mesuré : {type(exc).__name__} — {exc}",
            }
            print(f"bge-m3    : non mesuré ({type(exc).__name__})")

    bge = report["moteurs"].get("bge-m3", {})
    if bge.get("texts_per_second"):
        rate = bge["texts_per_second"]
        full = cfg.N_COMPLAINTS / rate
        report["extrapolation_corpus_complet"] = {
            "n_reclamations": cfg.N_COMPLAINTS,
            "secondes": round(full, 1),
            "heures": round(full / 3600, 2),
            "etiquette": (
                "EXTRAPOLATION depuis le débit mesuré ci-dessus, pas une mesure "
                "sur le corpus complet."
            ),
        }
        report["conclusion"] = (
            f"bge-m3 tourne et produit des vecteurs de dimension {bge.get('dim')}, "
            f"mais à {rate} textes/s sur ce matériel, les "
            f"{cfg.N_COMPLAINTS} réclamations demanderaient environ "
            f"{full / 3600:.1f} h. C'est la raison chiffrée pour laquelle le "
            f"pipeline livré utilise le repli TF-IDF au-delà de "
            f"{ST_MAX_TEXTS_CPU} textes sur CPU, et bge-m3 dès qu'un GPU est "
            f"présent. Le choix est mesuré, pas supposé."
        )
        print(f"\n{report['conclusion']}")

    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n✓ {OUT}")
    return report


def main() -> None:
    ap = argparse.ArgumentParser(description="Banc des moteurs d'embeddings.")
    ap.add_argument("--n", type=int, default=300)
    ap.add_argument("--no-bge", action="store_true", help="ne mesure que le repli TF-IDF")
    args = ap.parse_args()
    run(n=args.n, with_bge=not args.no_bge)


if __name__ == "__main__":
    main()
