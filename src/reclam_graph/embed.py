"""Embeddings et déduplication (bloc 3, module recyclé de Réclam'Radar).

Deux moteurs, toujours nommés dans les résultats :

``bge-m3``
    `BAAI/bge-m3` via sentence-transformers. C'est le moteur visé (le même que
    Réclam'Radar). Sur GPU il traite tout le corpus ; sur CPU il reste
    utilisable sur un échantillon, et le temps mesuré est étiqueté « CPU run ».

``tfidf-svd``
    TF-IDF caractères + n-grammes mots, réduit par SVD tronquée. Repli
    entièrement local, sans téléchargement de modèle, qui fait tourner le
    radar d'incidents sans GPU. Ce n'est **pas** bge-m3 et c'est écrit tel
    quel dans les sorties.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Sequence

import numpy as np

from . import config as cfg

#: Au-delà de ce nombre de textes, on n'essaie pas bge-m3 sur CPU : le temps
#: d'inférence rendrait le pipeline inutilisable pendant un hackathon.
ST_MAX_TEXTS_CPU = 2_000


@dataclass
class EmbedResult:
    vectors: np.ndarray
    engine: str
    engine_detail: str
    dim: int
    n_texts: int
    seconds: float
    device: str

    @property
    def texts_per_second(self) -> float | None:
        return round(self.n_texts / self.seconds, 2) if self.seconds > 0 else None

    def as_dict(self) -> dict[str, Any]:
        return {
            "engine": self.engine,
            "engine_detail": self.engine_detail,
            "dim": self.dim,
            "n_texts": self.n_texts,
            "seconds": round(self.seconds, 3),
            "texts_per_second": self.texts_per_second,
            "device": self.device,
        }


def _torch_device() -> str:
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"


def _embed_bge_m3(texts: Sequence[str], model_name: str) -> EmbedResult:
    from sentence_transformers import SentenceTransformer

    device = _torch_device()
    t0 = time.perf_counter()
    model = SentenceTransformer(model_name, device=device)
    vectors = model.encode(
        list(texts),
        batch_size=16 if device == "cpu" else 64,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    seconds = time.perf_counter() - t0
    return EmbedResult(
        vectors=np.asarray(vectors, dtype=np.float32),
        engine="bge-m3",
        engine_detail=f"sentence-transformers {model_name} sur {device}",
        dim=int(vectors.shape[1]),
        n_texts=len(texts),
        seconds=seconds,
        device=device,
    )


def _embed_tfidf_svd(texts: Sequence[str], dim: int = 256) -> EmbedResult:
    from sklearn.decomposition import TruncatedSVD
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import Normalizer

    t0 = time.perf_counter()
    # Les n-grammes de caractères absorbent les fautes de frappe, ce qui est
    # exactement le bruit de ce corpus (« trompe » / « trope » / « tromp »).
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        min_df=3,
        max_features=60_000,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(list(texts))
    n_components = int(min(dim, max(2, min(matrix.shape) - 1)))
    pipe = make_pipeline(
        TruncatedSVD(n_components=n_components, random_state=cfg.SEED),
        Normalizer(copy=False),
    )
    vectors = pipe.fit_transform(matrix)
    seconds = time.perf_counter() - t0
    return EmbedResult(
        vectors=np.asarray(vectors, dtype=np.float32),
        engine="tfidf-svd",
        engine_detail=(
            f"TF-IDF char_wb 3-5grammes + SVD({n_components}) — repli local, "
            f"ce n'est PAS bge-m3"
        ),
        dim=n_components,
        n_texts=len(texts),
        seconds=seconds,
        device="cpu",
    )


def embed_texts(
    texts: Sequence[str],
    engine: str = "auto",
    model_name: str | None = None,
) -> EmbedResult:
    """Encode des textes.

    `engine` : ``bge-m3``, ``tfidf`` ou ``auto``. En ``auto``, bge-m3 est
    tenté s'il y a un GPU, ou sur CPU si le corpus est petit ; sinon on prend
    le repli TF-IDF. Le moteur réellement utilisé est toujours renvoyé.
    """
    model_name = model_name or cfg.EMBED_MODEL
    if not texts:
        return EmbedResult(np.zeros((0, 0), dtype=np.float32), "aucun", "corpus vide", 0, 0, 0.0, "cpu")

    if engine == "tfidf":
        return _embed_tfidf_svd(texts)
    if engine == "bge-m3":
        return _embed_bge_m3(texts, model_name)
    if engine != "auto":
        raise ValueError(f"moteur d'embedding inconnu : {engine}")

    device = _torch_device()
    if device == "cuda" or len(texts) <= ST_MAX_TEXTS_CPU:
        try:
            return _embed_bge_m3(texts, model_name)
        except Exception as exc:
            result = _embed_tfidf_svd(texts)
            result.engine_detail += f" (bge-m3 indisponible : {type(exc).__name__})"
            return result
    return _embed_tfidf_svd(texts)


# ---------------------------------------------------------------------------
# Déduplication
# ---------------------------------------------------------------------------
def find_near_duplicates(
    vectors: np.ndarray, threshold: float = 0.93, block: int = 1024
) -> list[tuple[int, int, float]]:
    """Paires de textes quasi identiques (cosinus >= seuil).

    Sert à ne pas compter deux fois la même plainte renvoyée par SMS puis par
    l'application : un doublon gonflerait artificiellement le nombre de
    plaignants et donc les alertes.
    """
    if vectors.shape[0] < 2:
        return []
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    unit = vectors / np.clip(norms, 1e-9, None)
    pairs: list[tuple[int, int, float]] = []
    n = unit.shape[0]
    for start in range(0, n, block):
        chunk = unit[start : start + block]
        sims = chunk @ unit.T
        for local_i in range(chunk.shape[0]):
            global_i = start + local_i
            row = sims[local_i]
            for j in np.nonzero(row >= threshold)[0]:
                if int(j) > global_i:
                    pairs.append((global_i, int(j), float(row[j])))
    return pairs


def dedup_keep_first(
    vectors: np.ndarray, threshold: float = 0.93
) -> tuple[list[int], list[tuple[int, int, float]]]:
    """Indices à garder, et les paires de doublons détectées."""
    pairs = find_near_duplicates(vectors, threshold)
    dropped: set[int] = set()
    for i, j, _ in pairs:
        if i not in dropped:
            dropped.add(j)
    kept = [i for i in range(vectors.shape[0]) if i not in dropped]
    return kept, pairs
