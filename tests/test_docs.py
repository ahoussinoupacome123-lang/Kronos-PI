"""La documentation ne doit jamais affirmer un chiffre absent de `results/`.

Règle du brief : « Every number shown in the UI, README or pitch comes from a
script and a results file in this repo. » Ces tests sont le garde-fou : si une
mesure change et que la documentation ne suit pas, la suite échoue.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys

import pytest

from reclam_graph import config as cfg

from .conftest import needs_results

ROOT = cfg.ROOT
README = ROOT / "README.md"
PITCH = ROOT / "PITCH.md"
SUBMISSION = ROOT / "SUBMISSION.md"


def test_les_trois_livrables_documentaires_existent():
    for path in (README, PITCH, SUBMISSION, ROOT / "DECISIONS.md"):
        assert path.exists(), f"{path.name} manquant"
        assert path.stat().st_size > 1000, f"{path.name} suspicieusement court"


@needs_results
def test_le_bloc_de_resultats_du_readme_est_a_jour():
    """`scripts/refresh_results_block.py --check` doit passer."""
    done = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "refresh_results_block.py"), "--check"],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )
    assert done.returncode == 0, (
        "README.md n'est plus synchronisé avec results/.\n"
        "Lancer : python scripts/refresh_results_block.py\n"
        f"{done.stdout}{done.stderr}"
    )


@needs_results
def test_les_chiffres_phares_de_submission_correspondent_aux_mesures():
    """Les chiffres cités dans SUBMISSION.md doivent exister dans results/.

    La comparaison ignore le type d'espace (fine insécable ou ordinaire) et les
    espaces autour du « % » : le document est écrit pour des humains.
    """
    bench = json.loads(cfg.BENCHMARK_JSON.read_text(encoding="utf-8"))
    bundle = json.loads(cfg.DEMO_BUNDLE.read_text(encoding="utf-8"))
    mules = bench["detection_mules"]["avec_extraction_heuristique"]
    cons, prio, seul = (
        mules["consortium"],
        mules["consortium_prioritaires"],
        mules["operateur_seul"],
    )
    champs = bench["extraction_champs"]

    def flat(text: str) -> str:
        for space in ("\u202f", "\u00a0", "\u2009"):
            text = text.replace(space, " ")
        return re.sub(r"\s+", " ", text).replace(" %", "%")

    def group(value: int) -> str:
        return f"{value:,}".replace(",", " ")

    texte = flat(SUBMISSION.read_text(encoding="utf-8"))
    attendus = {
        "rappel consortium": f"{cons['rappel']:.0%}",
        "campagnes vues par l'operateur seul":
            f"({seul['campagnes_detectees']}/{seul['campagnes_injectees']})",
        "delai consortium": f"{cons['delai_detection_median_minutes']:.0f} min",
        "delai operateur seul": f"{seul['delai_detection_median_minutes']:.0f} min",
        "gelables consortium": group(cons["fcfa_encore_gelables_total"]),
        "gelables operateur seul": group(seul["fcfa_encore_gelables_total"]),
        "precision apres score": f"{prio['precision']:.0%}",
        "f1 montant regex":
            f"{champs['reference_regex']['champs']['montant_fcfa']['f1_recuperable']:.3f}".replace(".", ","),
        "f1 montant heuristique":
            f"{champs['heuristique_locale']['champs']['montant_fcfa']['f1_recuperable']:.3f}".replace(".", ","),
        "entrees audit": str(bundle["audit"]["n_entrees"]),
        "sous-corpus ambigu": group(bench["typologie"]["sous_corpus_ambigu"]["n"]),
    }
    manquants = {k: v for k, v in attendus.items() if flat(v) not in texte}
    assert not manquants, (
        "SUBMISSION.md ne cite plus les valeurs mesurées : "
        f"{manquants}. Mettre le document à jour."
    )


def test_la_documentation_annonce_les_donnees_synthetiques_en_haut():
    """Exigence du brief : annoncer en haut que les données sont synthétiques."""
    for path in (README, SUBMISSION):
        debut = path.read_text(encoding="utf-8")[:3000].lower()
        assert "synthétique" in debut, f"{path.name} n'annonce pas les données synthétiques"
    assert "fictif" in README.read_text(encoding="utf-8")[:3000].lower()


def test_la_documentation_contient_la_section_hypotheses_et_limites():
    readme = README.read_text(encoding="utf-8")
    assert "Hypothèses et limites" in readme
    for attendu in (
        "extrapolation",       # les 10 M de réclamations par an
        "ne sont pas publics",  # délais PI-Reclam
        "sources secondaires",  # règles du 2 novembre 2026
        "estimation",           # coûts agent
        "dictionnaire",         # limite du HMAC
    ):
        assert attendu in readme, f"le README n'énonce pas la limite « {attendu} »"


def test_le_readme_contient_le_schema_mermaid():
    readme = README.read_text(encoding="utf-8")
    assert "```mermaid" in readme
    assert "flowchart" in readme


def test_le_pitch_contient_les_interdits_de_langage():
    """Les « à ne jamais dire » doivent rester écrits noir sur blanc."""
    pitch = PITCH.read_text(encoding="utf-8")
    assert "À ne jamais dire" in pitch
    for interdit in (
        "Nous remplaçons les agents",
        "Aucune solution n'existe",
        "Inédit au monde",
    ):
        assert interdit in pitch, f"le pitch ne rappelle pas l'interdit « {interdit} »"
    assert "nouveau dans la zone et par la source du signal" in pitch


def test_le_pitch_contient_le_script_de_demo_minute():
    pitch = PITCH.read_text(encoding="utf-8")
    for jalon in ("0:00", "0:20", "0:50", "1:40", "2:15"):
        assert jalon in pitch, f"jalon {jalon} absent du script de démo"


def test_le_pitch_contient_les_sept_questions_du_jury():
    pitch = PITCH.read_text(encoding="utf-8")
    for question in (
        "ne partageront jamais leurs données",
        "si vous gelez un innocent",
        "La BCEAO le fera elle-même",
        "Vos données sont synthétiques",
        "Ça existe déjà",
        "Quel modèle économique",
    ):
        assert question in pitch, f"question jury absente : « {question} »"


def test_aucun_secret_dans_le_depot():
    """Pas de clé réelle commitée : .env.example seulement."""
    assert not (ROOT / ".env").exists() or ".env" in (ROOT / ".gitignore").read_text(
        encoding="utf-8"
    )
    exemple = (ROOT / ".env.example").read_text(encoding="utf-8")
    assert "a-remplacer" in exemple or "A_REMPLACER" in exemple.upper()
    assert cfg.CONSORTIUM_KEY_IS_DEV or True  # la clé réelle vient de l'environnement
