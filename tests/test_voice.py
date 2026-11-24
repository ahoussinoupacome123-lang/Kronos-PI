"""La voix : un bonus, et surtout des refus assumés."""

from __future__ import annotations

import pytest

from reclam_graph.voice import (
    REFUSED_LANGUAGES,
    SUPPORTED_LANGUAGES,
    VoiceTranscriber,
    capability_report,
    get_transcriber,
)


def test_le_module_s_importe_sans_dependance_de_transcription():
    """Aucun import lourd au chargement : le pipeline ne doit pas en dépendre."""
    assert get_transcriber() is not None


def test_l_absence_de_moteur_est_dite_explicitement():
    t = VoiceTranscriber()
    if not t.available():
        assert "Aucun moteur de transcription installé" in t.status
    else:
        assert t.model_name in t.status


@pytest.mark.parametrize("langue", sorted(REFUSED_LANGUAGES))
def test_les_langues_locales_sont_refusees_avec_leur_raison(langue, tmp_path):
    """Le brief interdit de prétendre comprendre le fon, le wolof ou le mina."""
    audio = tmp_path / "note.wav"
    audio.write_bytes(b"\0" * 16)
    with pytest.raises(ValueError) as erreur:
        VoiceTranscriber().transcribe(audio, language=langue)
    message = str(erreur.value)
    assert "refusée" in message
    assert "ne prétend pas comprendre les langues locales" in message


def test_une_langue_hors_perimetre_est_refusee(tmp_path):
    audio = tmp_path / "note.wav"
    audio.write_bytes(b"\0" * 16)
    with pytest.raises(ValueError) as erreur:
        VoiceTranscriber().transcribe(audio, language="en")
    assert "hors périmètre" in str(erreur.value)


def test_le_francais_est_la_seule_langue_acceptee():
    assert SUPPORTED_LANGUAGES == ("fr",)


def test_un_fichier_absent_leve_une_erreur_claire():
    t = VoiceTranscriber()
    if not t.available():
        pytest.skip("aucun moteur de transcription installé")
    with pytest.raises(FileNotFoundError):
        t.transcribe("/chemin/qui/nexiste/pas.wav", language="fr")


def test_le_rapport_de_capacite_n_annonce_aucune_precision():
    """Règle absolue : aucun chiffre non mesuré."""
    rapport = capability_report()
    assert rapport["precision"] == "NON MESURÉE sur ce dépôt"
    assert rapport["langues_acceptees"] == ["fr"]
    assert set(rapport["langues_refusees"]) == set(REFUSED_LANGUAGES)
    assert "bonus, pas une promesse" in rapport["position"]
    assert "a_verifier_par_un_humain=True" in rapport["garde_fou"]
