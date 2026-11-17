"""Client LLM unique, compatible OpenAI (bloc 2).

Tout passe par ici : vLLM (GPU) et Ollama (CPU) sont donc interchangeables
sans toucher au reste du code, en changeant seulement `LLM_BASE_URL` et
`LLM_MODEL`. Exigence de la section 0 du brief.

Le client mesure ce qu'il fait — latence, jetons, requêtes par seconde — car
**aucun débit ne doit être annoncé sans avoir été mesuré**. Si aucun serveur
ne répond, `available()` renvoie False et l'appelant doit se replier
explicitement, jamais en silence.
"""

from __future__ import annotations

import json
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Any, Callable, Sequence

from . import config as cfg

#: Le test de disponibilité doit échouer vite : pas de démo bloquée sur un
#: serveur absent.
HEALTHCHECK_TIMEOUT_S = 2.5


@dataclass
class LLMMetrics:
    """Mesures réelles d'une campagne d'appels. Sert au calcul de coût."""

    requests: int = 0
    failures: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    wall_seconds: float = 0.0
    latencies_ms: list[float] = field(default_factory=list)
    model: str = ""
    base_url: str = ""
    concurrency: int = 0

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens

    @property
    def requests_per_second(self) -> float | None:
        if self.wall_seconds <= 0 or not self.requests:
            return None
        return round(self.requests / self.wall_seconds, 3)

    @property
    def tokens_per_second(self) -> float | None:
        if self.wall_seconds <= 0 or not self.total_tokens:
            return None
        return round(self.total_tokens / self.wall_seconds, 2)

    @property
    def median_latency_ms(self) -> float | None:
        if not self.latencies_ms:
            return None
        s = sorted(self.latencies_ms)
        mid = len(s) // 2
        return round(s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2, 2)

    def as_dict(self) -> dict[str, Any]:
        return {
            "model": self.model,
            "base_url": self.base_url,
            "concurrency": self.concurrency,
            "requests": self.requests,
            "failures": self.failures,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "wall_seconds": round(self.wall_seconds, 3),
            "requests_per_second": self.requests_per_second,
            "tokens_per_second": self.tokens_per_second,
            "median_latency_ms": self.median_latency_ms,
            "mesure": "mesuré sur cette machine" if self.requests else "non mesuré",
        }


class LLMClient:
    """Enveloppe fine autour du SDK OpenAI, pointée sur un serveur local."""

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        timeout: float | None = None,
    ) -> None:
        self.base_url = base_url or cfg.LLM_BASE_URL
        self.model = model or cfg.LLM_MODEL
        self.api_key = api_key or cfg.LLM_API_KEY
        self.timeout = timeout or cfg.LLM_TIMEOUT_S
        self._client: Any = None
        self._available: bool | None = None
        self._reason: str = ""

    # -- cycle de vie ------------------------------------------------------
    def _ensure(self) -> Any:
        if self._client is None:
            from openai import OpenAI

            self._client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
                timeout=self.timeout,
                max_retries=2,
            )
        return self._client

    def _probe_client(self) -> Any:
        """Client dédié au test de disponibilité : court délai, aucun réessai.

        Sans cela, un `available()` sur une machine sans serveur LLM bloque
        plusieurs minutes en réessais — exactement ce qu'il ne faut pas
        pendant une démo de trois minutes.
        """
        from openai import OpenAI

        return OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
            timeout=HEALTHCHECK_TIMEOUT_S,
            max_retries=0,
        )

    def available(self, force: bool = False) -> bool:
        """Le serveur répond-il ? Résultat mis en cache.

        Test borné à `HEALTHCHECK_TIMEOUT_S` secondes, sans réessai.
        """
        if self._available is not None and not force:
            return self._available
        try:
            models = self._probe_client().models.list()
            names = [m.id for m in getattr(models, "data", [])]
            self._available = True
            self._reason = f"serveur joignable, modèles : {names or '(liste vide)'}"
            if names and self.model not in names:
                # On ne corrige pas en silence : on signale.
                self._reason += (
                    f" — attention, LLM_MODEL={self.model} n'est pas dans la liste"
                )
        except Exception as exc:
            self._available = False
            self._reason = f"serveur injoignable sur {self.base_url} : {exc}"
        return self._available

    @property
    def status(self) -> str:
        if self._available is None:
            self.available()
        return self._reason

    # -- appels ------------------------------------------------------------
    def complete_json(
        self,
        system: str,
        user: str,
        guided_json: dict[str, Any],
        max_tokens: int = 512,
        temperature: float = 0.0,
    ) -> tuple[dict[str, Any] | None, dict[str, Any]]:
        """Un appel, sortie JSON contrainte par schéma.

        Utilise le *guided decoding* de vLLM (`extra_body.guided_json`), qui
        garantit un JSON conforme au schéma. Si le serveur ne connaît pas ce
        paramètre (Ollama, llama.cpp), on retombe sur `response_format`
        json_object, puis sur un simple parse.
        """
        client = self._ensure()
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        attempts: list[dict[str, Any]] = [
            {"extra_body": {"guided_json": guided_json}},
            {"response_format": {"type": "json_object"}},
            {},
        ]
        last_error = ""
        for extra in attempts:
            t0 = time.perf_counter()
            try:
                resp = client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **extra,
                )
            except Exception as exc:
                last_error = str(exc)
                continue
            latency_ms = (time.perf_counter() - t0) * 1000.0
            content = (resp.choices[0].message.content or "").strip()
            usage = getattr(resp, "usage", None)
            meta = {
                "latency_ms": latency_ms,
                "prompt_tokens": getattr(usage, "prompt_tokens", 0) or 0,
                "completion_tokens": getattr(usage, "completion_tokens", 0) or 0,
                "mode": "guided_json" if "extra_body" in extra else
                        ("json_object" if "response_format" in extra else "plain"),
            }
            parsed = _loose_json(content)
            if parsed is not None:
                return parsed, meta
            last_error = f"réponse non JSON : {content[:200]}"
        return None, {"error": last_error, "latency_ms": None}

    def map_json(
        self,
        items: Sequence[tuple[str, str]],
        guided_json: dict[str, Any],
        system: str,
        concurrency: int | None = None,
        max_tokens: int = 512,
        on_progress: Callable[[int, int], None] | None = None,
    ) -> tuple[list[dict[str, Any] | None], LLMMetrics]:
        """Traite un lot d'items `(id, texte)` en parallèle, et mesure le débit."""
        conc = concurrency or cfg.LLM_MAX_CONCURRENCY
        metrics = LLMMetrics(model=self.model, base_url=self.base_url, concurrency=conc)
        results: list[dict[str, Any] | None] = [None] * len(items)

        def work(i: int) -> None:
            _, text = items[i]
            parsed, meta = self.complete_json(system, text, guided_json, max_tokens)
            results[i] = parsed
            if parsed is None:
                metrics.failures += 1
            metrics.requests += 1
            metrics.prompt_tokens += meta.get("prompt_tokens", 0) or 0
            metrics.completion_tokens += meta.get("completion_tokens", 0) or 0
            if meta.get("latency_ms"):
                metrics.latencies_ms.append(meta["latency_ms"])
            if on_progress:
                on_progress(metrics.requests, len(items))

        t0 = time.perf_counter()
        with ThreadPoolExecutor(max_workers=conc) as pool:
            list(pool.map(work, range(len(items))))
        metrics.wall_seconds = time.perf_counter() - t0
        return results, metrics


def _loose_json(text: str) -> dict[str, Any] | None:
    """Parse un JSON éventuellement entouré de texte ou d'un bloc markdown."""
    if not text:
        return None
    try:
        out = json.loads(text)
        return out if isinstance(out, dict) else None
    except Exception:
        pass
    if "```" in text:
        chunk = text.split("```")[1]
        chunk = chunk[4:] if chunk.lower().startswith("json") else chunk
        try:
            out = json.loads(chunk.strip())
            return out if isinstance(out, dict) else None
        except Exception:
            pass
    start, end = text.find("{"), text.rfind("}")
    if 0 <= start < end:
        try:
            out = json.loads(text[start : end + 1])
            return out if isinstance(out, dict) else None
        except Exception:
            return None
    return None


_default: LLMClient | None = None


def get_client() -> LLMClient:
    global _default
    if _default is None:
        _default = LLMClient()
    return _default
