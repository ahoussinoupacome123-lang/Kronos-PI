"""Notes vocales — transcription (bonus, hors périmètre indispensable).

**Français uniquement, et assumé comme tel.**

Le brief classe la voix en priorité `f`, « seulement s'il reste du temps », et
pour une raison documentée : les taux d'erreur publiés en langues locales
interdisent d'en faire une promesse.

    Whisper large-v3 dépasse 97 % de WER en wolof et atteint 100 % en bambara.
    Le fongbé n'est correct que sur de la parole LUE, avec un MMS affiné.

Conséquence tenue dans tout ce module :

* on transcrit le **français** ;
* on **n'annonce aucun taux de précision** qui n'a pas été mesuré sur ce dépôt ;
* on refuse explicitement de prétendre comprendre le fon, le wolof ou le mina ;
* une transcription porte toujours un drapeau `a_verifier_par_un_humain`, car
  une plainte mal transcrite ne doit jamais alimenter une alerte mule en
  silence.

Aucune dépendance n'est requise pour importer ce module : s'il n'y a pas de
moteur de transcription installé, `available()` renvoie False et l'appelant
doit se replier explicitement.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from . import config as cfg

#: Modèle visé. `faster-whisper` est préféré sur petite VRAM (T4), mais le
#: module fonctionne avec n'importe lequel des deux dos à dos.
WHISPER_MODEL = "large-v3"
WHISPER_MODEL_SMALL = "small"

#: Langues pour lesquelles nous acceptons de produire une transcription.
SUPPORTED_LANGUAGES = ("fr",)

#: Langues explicitement refusées, avec la raison. Refuser est un choix
#: produit : une transcription à 97 % de WER est pire que pas de transcription,
#: parce qu'elle a l'air d'une donnée.
REFUSED_LANGUAGES = {
    "wo": "WER publié > 97 % (wolof) — inexploitable",
    "bm": "WER publié ≈ 100 % (bambara) — inexploitable",
    "fon": (
        "fongbé : correct uniquement sur parole lue avec un MMS affiné, "
        "pas sur de la parole spontanée de centre d'appel"
    ),
    "mina": "aucun taux d'erreur publié exploitable",
}


@dataclass
class Transcription:
    audio_path: str
    text: str
    language: str
    engine: str
    engine_detail: str
    seconds: float
    #: Vrai tant qu'un humain n'a pas relu. Toujours vrai à la sortie du moteur.
    a_verifier_par_un_humain: bool = True
    segments: list[dict[str, Any]] = field(default_factory=list)
    avertissements: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "audio": self.audio_path,
            "texte": self.text,
            "langue": self.language,
            "moteur": self.engine,
            "moteur_detail": self.engine_detail,
            "secondes": round(self.seconds, 3),
            "a_verifier_par_un_humain": self.a_verifier_par_un_humain,
            "n_segments": len(self.segments),
            "avertissements": self.avertissements,
            "precision": (
                "NON MESURÉE sur ce dépôt — aucun taux n'est annoncé "
                "(voir README, section « Hypothèses et limites »)"
            ),
        }


class VoiceTranscriber:
    """Enveloppe autour de faster-whisper ou openai-whisper, si présent."""

    def __init__(self, model: str | None = None, device: str | None = None) -> None:
        self.model_name = model or (
            WHISPER_MODEL if cfg.HARDWARE.has_gpu else WHISPER_MODEL_SMALL
        )
        self.device = device or ("cuda" if cfg.HARDWARE.has_gpu else "cpu")
        self._backend: str | None = None
        self._model: Any = None
        self._reason: str = ""

    # -- disponibilité -----------------------------------------------------
    def available(self) -> bool:
        """Y a-t-il un moteur de transcription utilisable ?"""
        if self._backend:
            return True
        try:
            import faster_whisper  # noqa: F401

            self._backend = "faster-whisper"
            return True
        except Exception:
            pass
        try:
            import whisper  # noqa: F401

            self._backend = "openai-whisper"
            return True
        except Exception as exc:
            self._reason = (
                "Aucun moteur de transcription installé "
                f"(ni faster-whisper, ni openai-whisper) : {exc}"
            )
            return False

    @property
    def status(self) -> str:
        if self.available():
            return f"{self._backend} prêt, modèle {self.model_name} sur {self.device}"
        return self._reason

    # -- chargement --------------------------------------------------------
    def _load(self) -> Any:
        if self._model is not None:
            return self._model
        if not self.available():
            raise RuntimeError(self._reason)
        if self._backend == "faster-whisper":
            from faster_whisper import WhisperModel

            # int8 sur CPU, float16 sur GPU : le T4 n'a pas de bf16.
            compute = "float16" if self.device == "cuda" else "int8"
            self._model = WhisperModel(
                self.model_name, device=self.device, compute_type=compute
            )
        else:
            import whisper

            self._model = whisper.load_model(self.model_name, device=self.device)
        return self._model

    # -- transcription -----------------------------------------------------
    def transcribe(self, audio_path: str | Path, language: str = "fr") -> Transcription:
        """Transcrit un fichier audio. Français uniquement.

        Lève `ValueError` pour une langue que nous refusons de prétendre
        traiter, et `RuntimeError` s'il n'y a aucun moteur installé.
        """
        language = language.lower()
        if language in REFUSED_LANGUAGES:
            raise ValueError(
                f"Transcription refusée pour « {language} » : "
                f"{REFUSED_LANGUAGES[language]}. "
                "Réclam'Graph ne prétend pas comprendre les langues locales."
            )
        if language not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Langue « {language} » hors périmètre. "
                f"Langues acceptées : {', '.join(SUPPORTED_LANGUAGES)}."
            )
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(path)

        model = self._load()
        t0 = time.perf_counter()
        segments: list[dict[str, Any]] = []
        if self._backend == "faster-whisper":
            found, _info = model.transcribe(str(path), language=language, vad_filter=True)
            for seg in found:
                segments.append(
                    {"debut": seg.start, "fin": seg.end, "texte": seg.text.strip()}
                )
            text = " ".join(s["texte"] for s in segments).strip()
        else:
            result = model.transcribe(str(path), language=language)
            text = str(result.get("text", "")).strip()
            for seg in result.get("segments", []):
                segments.append(
                    {
                        "debut": seg.get("start"),
                        "fin": seg.get("end"),
                        "texte": str(seg.get("text", "")).strip(),
                    }
                )
        seconds = time.perf_counter() - t0

        avertissements = [
            "Transcription automatique : à relire avant toute décision.",
            "Précision non mesurée sur ce dépôt — aucun taux n'est annoncé.",
        ]
        if not cfg.HARDWARE.has_gpu:
            avertissements.append(
                "Transcription réalisée sur CPU — ne pas présenter le temps "
                "mesuré comme un temps GPU."
            )
        if not text:
            avertissements.append("Aucune parole détectée : rien à exploiter.")

        return Transcription(
            audio_path=str(path),
            text=text,
            language=language,
            engine=self._backend or "inconnu",
            engine_detail=f"{self._backend} {self.model_name} sur {self.device}",
            seconds=seconds,
            a_verifier_par_un_humain=True,
            segments=segments,
            avertissements=avertissements,
        )


_default: VoiceTranscriber | None = None


def get_transcriber() -> VoiceTranscriber:
    global _default
    if _default is None:
        _default = VoiceTranscriber()
    return _default


def capability_report() -> dict[str, Any]:
    """Ce que nous savons et ne savons pas faire. Repris dans l'UI et le README."""
    transcriber = get_transcriber()
    return {
        "disponible": transcriber.available(),
        "etat": transcriber.status,
        "langues_acceptees": list(SUPPORTED_LANGUAGES),
        "langues_refusees": REFUSED_LANGUAGES,
        "precision": "NON MESURÉE sur ce dépôt",
        "position": (
            "La note vocale est un bonus, pas une promesse. Nous transcrivons le "
            "français. Nous ne prétendons pas comprendre le fon, le wolof ni le "
            "mina : les taux d'erreur publiés ne le permettent pas, et une "
            "transcription fausse est pire qu'une transcription absente parce "
            "qu'elle a l'air d'une donnée."
        ),
        "garde_fou": (
            "Toute transcription porte a_verifier_par_un_humain=True et ne doit "
            "pas alimenter une alerte mule sans relecture."
        ),
    }
