"""Régénère le bloc de résultats du README depuis `results/`.

Règle du brief : « Never announce a throughput, accuracy or cost figure that
was not measured. Every number shown in the UI, README or pitch comes from a
script and a results file in this repo. »

Ce script est ce script. Il remplace, dans README.md, tout ce qui se trouve
entre les deux marqueurs :

    <!-- RESULTATS:DEBUT -->
    <!-- RESULTATS:FIN -->

Usage : python scripts/refresh_results_block.py [--check]
`--check` ne réécrit rien et sort en erreur si le bloc n'est pas à jour.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

START = "<!-- RESULTATS:DEBUT -->"
END = "<!-- RESULTATS:FIN -->"


def fnum(value, suffix="", none="non mesuré"):
    if value is None or isinstance(value, str):
        return value if isinstance(value, str) else none
    if isinstance(value, float) and value != int(value):
        # Séparateur décimal français : la virgule.
        texte = f"{value:,.3f}".replace(",", " ").rstrip("0").rstrip(".")
        return texte.replace(".", ",") + suffix
    return f"{int(value):,}".replace(",", " ") + suffix


def build_block() -> str:
    bench = json.loads((ROOT / "results" / "benchmark.json").read_text(encoding="utf-8"))
    bundle = json.loads((ROOT / "results" / "demo_bundle.json").read_text(encoding="utf-8"))
    embed_path = ROOT / "results" / "embed_bench.json"
    embed = json.loads(embed_path.read_text(encoding="utf-8")) if embed_path.exists() else None

    mules = bench["detection_mules"]["avec_extraction_heuristique"]
    cons, prio, seul = mules["consortium"], mules["consortium_prioritaires"], mules["operateur_seul"]
    typ = bench["typologie"]
    champs = bench["extraction_champs"]
    amb = typ["sous_corpus_ambigu"]
    inc = bundle["evaluation_incidents"]
    vol = bundle["volumes"]
    cout = bench["cout"]

    lines = [
        START,
        "",
        f"> Chiffres régénérés depuis `results/` par `scripts/refresh_results_block.py`.  ",
        f"> **Exécution : {bench['meta']['etiquette_execution']}**  ",
        f"> Corpus : {fnum(bench['meta']['n_reclamations'])} réclamations synthétiques "
        f"sur {bundle['meta']['config']['dataset']['n_days']} jours, "
        f"{len(bundle['meta']['config']['dataset']['operators'])} opérateurs fictifs.  ",
        f"> Généré le {bench['meta']['genere_le'][:19].replace('T', ' à ')}.",
        "",
        "### Détection de comptes mules — l'écart principal",
        "",
        "| Métrique | Référence : opérateur seul | Réclam'Graph (consortium) |",
        "|---|---|---|",
        f"| Rappel des campagnes | **{seul['rappel']:.0%}** "
        f"({seul['campagnes_detectees']}/{seul['campagnes_injectees']}) | "
        f"**{cons['rappel']:.0%}** ({cons['campagnes_detectees']}/{cons['campagnes_injectees']}) |",
        f"| Délai de détection (médiane) | {fnum(seul['delai_detection_median_minutes'], ' min')} | "
        f"**{fnum(cons['delai_detection_median_minutes'], ' min')}** |",
        f"| FCFA encore gelables (5 campagnes) | {fnum(seul['fcfa_encore_gelables_total'], ' FCFA')} | "
        f"**{fnum(cons['fcfa_encore_gelables_total'], ' FCFA')}** |",
        f"| Précision des alertes | {seul['precision']:.0%} | "
        f"{cons['precision']:.0%} règle brute → **{prio['precision']:.0%}** après score |",
        "",
        f"Règle appliquée : **{bench['detection_mules']['regle']}**. "
        "Réclam'Graph recommande et documente ; il ne gèle jamais de lui-même.",
        "",
        "### Typologie — « quasi ex aequo », et nous le disons",
        "",
        "| Approche | F1 macro |",
        "|---|---|",
        f"| Référence mots-clés + regex | {fnum(typ['reference_mots_cles_regex']['f1_macro'])} |",
        f"| Référence TF-IDF + régression logistique (**supervisée**) | "
        f"**{fnum(typ['reference_tfidf_logreg']['f1_macro'])}** |",
        f"| Extracteur Réclam'Graph (sans étiquettes) | {fnum(typ['heuristique_locale']['f1_macro'])} |",
        "",
        "La référence supervisée **gagne**. C'est attendu, c'est publié tel quel, et "
        "c'est pourquoi la démonstration ne repose pas sur la classification.",
        "",
        f"#### Le sous-corpus ambigu ({fnum(amb['n'])} plaintes, "
        f"{amb['part_du_corpus']:.1%} du corpus)",
        "",
        "Des plaintes dont le texte sert **indifféremment** à une arnaque « erreur de "
        "dépôt » et à une erreur sincère de destinataire. Comparaison au taux de la "
        "classe majoritaire, c'est-à-dire au score d'un système qui répondrait toujours "
        "la même chose :",
        "",
        "| Moteur | Exactitude | Taux classe majoritaire | Gain |",
        "|---|---|---|---|",
    ]
    for name, m in amb["par_moteur"].items():
        lines.append(
            f"| {name} | {m['exactitude']:.1%} | {m['taux_classe_majoritaire']:.1%} | "
            f"**{m['gain_sur_classe_majoritaire']:+.1%}** |"
        )
    lg = typ["reference_tfidf_logreg"].get("sous_corpus_ambigu", {})
    if lg.get("n"):
        lines.append(
            f"| TF-IDF + logreg (supervisée) | {lg['exactitude']:.1%} | "
            f"{lg['taux_classe_majoritaire']:.1%} | "
            f"**{lg['gain_sur_classe_majoritaire']:+.1%}** |"
        )
    lines += [
        "",
        "**Aucun moteur ne dépasse le taux de la classe majoritaire.** Sur ces textes, "
        "lire la plainte ne suffit pas. C'est la mesure qui porte tout le projet : le "
        "signal utile n'est pas dans une plainte, il est dans le croisement de plusieurs.",
        "",
        "### Extraction de champs",
        "",
        "F1 sur les cas **récupérables** (la valeur est réellement présente dans le "
        "texte), puis entre parenthèses la F1 brute sur tous les cas de la vérité "
        "terrain, y compris ceux que le texte ne mentionne pas.",
        "",
        "| Champ | Référence regex | Extracteur local | Cas récupérables |",
        "|---|---|---|---|",
    ]
    for name, ref in champs["reference_regex"]["champs"].items():
        ours = champs["heuristique_locale"]["champs"][name]
        lines.append(
            f"| {name} | {fnum(ref['f1_recuperable'])} ({fnum(ref['f1_brut'])}) | "
            f"{fnum(ours['f1_recuperable'])} ({fnum(ours['f1_brut'])}) | "
            f"{fnum(ref['support_recuperable'])} / {fnum(ref['support_brut'])} |"
        )
    lines += [
        f"| **moyenne** | **{fnum(champs['reference_regex']['f1_moyenne_champs'])}** "
        f"({fnum(champs['reference_regex']['f1_moyenne_champs_brute'])}) | "
        f"**{fnum(champs['heuristique_locale']['f1_moyenne_champs'])}** "
        f"({fnum(champs['heuristique_locale']['f1_moyenne_champs_brute'])}) | |",
        "",
        "Le seul champ qui sépare vraiment les deux moteurs est le **montant** : la "
        "regex lit « 25 000 » et « 25.000F », elle ne lit pas « 25mil », « 25k » ni "
        "« vingt cinq mille ». C'est là que le LLM est attendu.",
        "",
        "### Radar d'incidents",
        "",
        f"- Incidents injectés : **{inc['incidents_injectes']}** — détectés : "
        f"**{inc['incidents_detectes']}** (rappel {inc['rappel']:.0%})",
        f"- Alertes émises au total : **{inc['alertes_radar_totales']}** — précision "
        f"**{inc['precision']:.0%}** ({inc.get('faux_positifs', 0)} faux positif(s))",
        f"- Délai de détection : **{fnum(inc['detail'][0]['delai_minutes'], ' min')}** "
        f"après le début réel du pic (granularité horaire), score de pic "
        f"**{fnum(inc['detail'][0]['zscore'])} σ**",
        "",
        f"> {inc['note_precision']}",
        "",
        "### Moteur d'embeddings — bge-m3 contre le repli TF-IDF",
        "",
    ]
    if embed:
        bge = embed["moteurs"].get("bge-m3", {})
        tfidf = embed["moteurs"].get("tfidf-svd", {})
        lines += [
            f"Mesuré sur {fnum(embed['n_textes'])} réclamations — "
            f"*{embed['etiquette_execution']}* :",
            "",
            "| Moteur | Dimension | Débit | Durée |",
            "|---|---|---|---|",
            f"| `bge-m3` (la cible) | {bge.get('dim', '—')} | "
            f"{fnum(bge.get('texts_per_second'))} textes/s | "
            f"{fnum(bge.get('seconds'), ' s')} |",
            f"| `tfidf-svd` (le repli) | {tfidf.get('dim', '—')} | "
            f"{fnum(tfidf.get('texts_per_second'))} textes/s | "
            f"{fnum(tfidf.get('seconds'), ' s')} |",
            "",
        ]
        if embed.get("conclusion"):
            lines += [f"> {embed['conclusion']}", ""]
    else:
        lines += [
            "Non mesuré. Lancer `make bench-embed`.",
            "",
        ]
    lines += [
        "### Partage minimal et traçabilité",
        "",
        f"- Réclamations traitées : **{fnum(vol['n_reclamations'])}**",
        f"- Enregistrements transmis au hub : **{fnum(vol['n_enregistrements_partages'])}** "
        f"(**{vol['part_partagee']:.1%}**) — une plainte sans bénéficiaire identifiable "
        f"ne quitte pas l'opérateur",
        f"- Décisions sur le corpus complet : {vol['decisions_corpus_complet']}",
        f"- Entrées d'audit : **{fnum(bundle['audit']['n_entrees'])}**, chaîne de "
        f"hachage intègre : **{'oui' if bundle['audit']['chaine_integre'] else 'non'}**",
        "",
        "### Débit et coût",
        "",
        "| Grandeur | Valeur | Étiquette |",
        "|---|---|---|",
        f"| Débit référence regex | {fnum(bench['debit']['reference_regex']['reclamations_par_seconde'])} réclamations/s | "
        f"{bench['debit']['reference_regex']['etiquette']} |",
        f"| Débit extracteur local | {fnum(bench['debit']['heuristique_locale']['reclamations_par_seconde'])} réclamations/s | "
        f"{bench['debit']['heuristique_locale']['etiquette']} |",
        f"| Débit LLM | {fnum(bench['debit']['llm'].get('requests_per_second') if isinstance(bench['debit']['llm'], dict) else None)} requêtes/s | "
        f"à mesurer sur la machine GPU (`make bench-llm`) |",
        f"| Prix horaire GPU | {fnum(cout['prix_horaire_gpu_fcfa'], ' FCFA/h')} | "
        f"{cout['prix_horaire_gpu_source']} |",
        f"| Inférence locale / 1 000 réclamations | {cout['cout_inference_locale_pour_1000_fcfa']} | "
        f"{cout['cout_inference_locale_note']} |",
        f"| API cloud / 1 000 réclamations | {fnum(cout['cout_api_cloud_pour_1000_fcfa'], ' FCFA')} | "
        f"{cout['cout_api_cloud_note']} |",
        f"| Agent humain / 1 000 (simple) | {fnum(cout['cout_humain_pour_1000_fcfa']['reclamation_simple'], ' FCFA')} | "
        f"{cout['cout_humain_pour_1000_fcfa']['etiquette']} |",
        f"| Agent humain / 1 000 (investiguée) | {fnum(cout['cout_humain_pour_1000_fcfa']['reclamation_investiguee'], ' FCFA')} | "
        f"{cout['cout_humain_pour_1000_fcfa']['etiquette']} |",
    ]
    for name, value in cout["reperes_editeurs_pour_1000_fcfa"].items():
        lines.append(f"| Repère — {name} / 1 000 | {fnum(value, ' FCFA')} | prix public affiché |")
    lines += [
        f"| Prix proposé / 1 000 | {fnum(cout['prix_propose_pour_1000_fcfa'], ' FCFA')} | "
        f"**hypothèse** de modèle économique |",
        "",
    ]
    lines += [f"- {w}" for w in cout["avertissements"]]
    lines += ["", END]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    readme = ROOT / "README.md"
    text = readme.read_text(encoding="utf-8")
    if START not in text or END not in text:
        print(f"ERREUR : marqueurs {START} / {END} absents de README.md", file=sys.stderr)
        return 2
    before = text.split(START)[0]
    after = text.split(END)[1]
    new = before + build_block() + after
    if args.check:
        if new != text:
            print("README.md n'est pas à jour. Lancer : python scripts/refresh_results_block.py")
            return 1
        print("README.md est à jour.")
        return 0
    readme.write_text(new, encoding="utf-8")
    print("✓ bloc de résultats du README régénéré depuis results/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
