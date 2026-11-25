"""Compte les tokens réellement consommés par réclamation, puis en dérive le
coût d'une API cloud pour 1 000 réclamations.

Pourquoi ce script existe : sans lui, le « coût API cloud » serait un chiffre
saisi à la main. Ici il est dérivé de deux grandeurs comptées sur le corpus —
les tokens d'entrée (prompt système + texte de la réclamation) et les tokens de
sortie (le JSON d'extraction réellement produit) — multipliées par un tarif
public affiché.

Limite assumée et étiquetée dans la sortie : le décompte utilise le tokeniseur
de bge-m3 (XLM-RoBERTa, déjà en cache local), pas celui du fournisseur d'API.
Les tokeniseurs multilingues donnent des ordres de grandeur comparables mais
pas identiques. Le chiffre est donc un ORDRE DE GRANDEUR MESURÉ, pas une
facture. Il est étiqueté comme tel partout où il est affiché.

    python -m bench.token_cost [--sample 1000]
"""

from __future__ import annotations

import argparse
import json
import statistics
from typing import Any

from bench.src_path import ensure_src

ensure_src()

from reclam_graph import config as cfg  # noqa: E402
from reclam_graph.extract import SYSTEM_PROMPT, extract  # noqa: E402
from reclam_graph.schemas import Complaint  # noqa: E402

TOKENIZER_ID = "BAAI/bge-m3"
DEFAULT_SAMPLE = 1000
# Champs que le LLM ne produit pas : ils décrivent le moteur, pas l'extraction.
_NOT_EMITTED = {"engine", "engine_detail", "complaint_id"}


def _load_tokenizer() -> tuple[Any, str] | tuple[None, str]:
    """Charge le tokeniseur en local. Aucun téléchargement : s'il n'est pas en
    cache, on ne mesure pas et on le dit."""
    try:
        from transformers import AutoTokenizer
    except ImportError:
        return None, "transformers non installé"
    try:
        tok = AutoTokenizer.from_pretrained(TOKENIZER_ID, local_files_only=True)
    except Exception as exc:  # noqa: BLE001 - on veut la raison exacte dans la sortie
        return None, f"{TOKENIZER_ID} absent du cache local ({type(exc).__name__})"
    return tok, type(tok).__name__


def _sample(limit: int) -> list[Complaint]:
    out: list[Complaint] = []
    with cfg.COMPLAINTS_FILE.open(encoding="utf-8") as handle:
        for index, line in enumerate(handle):
            if index >= limit:
                break
            out.append(Complaint.model_validate_json(line))
    return out


def measure(sample: int = DEFAULT_SAMPLE) -> dict[str, Any]:
    tokenizer, tokenizer_label = _load_tokenizer()
    if tokenizer is None:
        return {
            "mesure": "non mesuré",
            "raison": tokenizer_label,
            "remede": "make setup-gpu (installe transformers) puis relancer",
            "cout_api_cloud_pour_1000_fcfa": "non calculé",
        }

    complaints = _sample(sample)
    system_tokens = len(tokenizer(SYSTEM_PROMPT)["input_ids"])
    body_tokens = [len(x) for x in tokenizer([c.text for c in complaints])["input_ids"]]

    extractions, _ = extract(complaints, engine="heuristic")
    payloads = [
        json.dumps(
            e.model_dump(mode="json", exclude=_NOT_EMITTED),
            ensure_ascii=False,
            separators=(",", ":"),
        )
        for e in extractions
    ]
    output_tokens = [len(x) for x in tokenizer(payloads)["input_ids"]]

    mean_in = system_tokens + statistics.mean(body_tokens)
    mean_out = statistics.mean(output_tokens)

    usd_per_complaint = (
        mean_in * cfg.CLOUD_API_INPUT_USD_PER_M / 1e6
        + mean_out * cfg.CLOUD_API_OUTPUT_USD_PER_M / 1e6
    )
    fcfa_per_1000 = usd_per_complaint * 1000 * cfg.USD_TO_FCFA

    return {
        "mesure": "mesuré",
        "tokeniseur": f"{TOKENIZER_ID} ({tokenizer_label})",
        "echantillon_reclamations": len(complaints),
        "tokens_prompt_systeme": system_tokens,
        "tokens_corps_reclamation": {
            "moyenne": round(statistics.mean(body_tokens), 2),
            "median": statistics.median(body_tokens),
            "max": max(body_tokens),
        },
        "tokens_entree_par_reclamation": round(mean_in, 2),
        "tokens_sortie_par_reclamation": round(mean_out, 2),
        "tarif_api": {
            "modele": cfg.CLOUD_API_MODEL_LABEL,
            "entree_usd_par_million": cfg.CLOUD_API_INPUT_USD_PER_M,
            "sortie_usd_par_million": cfg.CLOUD_API_OUTPUT_USD_PER_M,
            "taux_usd_fcfa": cfg.USD_TO_FCFA,
            "etiquette": "prix public affiché le 25/11/2026, pas une mesure",
        },
        "cout_api_cloud_pour_1_reclamation_usd": round(usd_per_complaint, 8),
        "cout_api_cloud_pour_1000_fcfa": round(fcfa_per_1000, 2),
        "avertissements": [
            "Le décompte utilise le tokeniseur de bge-m3 (XLM-RoBERTa), pas "
            "celui du fournisseur d'API : ORDRE DE GRANDEUR MESURÉ, pas une facture.",
            f"Le prompt système ({system_tokens} tokens) est renvoyé à chaque "
            "appel et pèse plus que la réclamation elle-même "
            f"({round(statistics.mean(body_tokens), 1)} tokens en moyenne). "
            "Un cache de prompt le réduirait fortement — non mesuré ici.",
            "Le taux USD/FCFA flotte : le FCFA est arrimé à l'euro, pas au dollar.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sample", type=int, default=DEFAULT_SAMPLE)
    args = parser.parse_args()

    report = measure(args.sample)
    cfg.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    cfg.TOKEN_COST_JSON.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    if report["mesure"] == "non mesuré":
        print(f"tokens : non mesuré — {report['raison']}")
    else:
        print(f"entrée : {report['tokens_entree_par_reclamation']} tokens/réclamation")
        print(f"sortie : {report['tokens_sortie_par_reclamation']} tokens/réclamation")
        print(f"API cloud / 1 000 : {report['cout_api_cloud_pour_1000_fcfa']} FCFA")
    print(f"✓ {cfg.TOKEN_COST_JSON}")


if __name__ == "__main__":
    main()
