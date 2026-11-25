# Audit du dépôt existant

> Revue du travail livré par Pacôme dans `R-clam-Graph` (état du 25/11/2026, commit `7079cec`) : ce qui est solide, ce qui est risqué, et la marche à suivre pour la soutenance.
> Périmètre lu : `src/reclam_graph/`, `app/dashboard.py`, `bench/`, `tests/`, `Makefile`, `scripts/`, `results/`, `README.md`, `DECISIONS.md`, `PITCH.md`, `SUBMISSION.md`.

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Points forts](#2-points-forts)
3. [Faiblesses classées par gravité](#3-faiblesses-classées-par-gravité)
4. [Le risque n°1 : le GPU](#4-le-risque-n1--le-gpu)
5. [Marche à suivre sur la machine GPU](#5-marche-à-suivre-sur-la-machine-gpu)
6. [Comment le projet aurait dû commencer](#6-comment-le-projet-aurait-dû-commencer)
7. [Recommandations](#7-recommandations)

---

## 1. Vue d'ensemble

| Élément | Constat |
|---|---|
| Volume | ~5 500 lignes Python (`src/` 3 700, `app/dashboard.py` 1 400), 112 tests, 30+ commits sur 11 branches thématiques |
| Organisation | Branches par chantier (`feat/datagen`, `feat/graph-hub`, `feat/radar`…), commits Conventional Commits en français, merges propres |
| Chaîne | `make setup` → `make all` (données, pipeline, coûts, banc, README, tests) → `make demo` |
| Traçabilité | `DECISIONS.md` horodaté, bloc de résultats du README régénéré par script et vérifié par un test |
| Résultats | `results/benchmark.{json,md}`, `demo_bundle.json` (1 Mo, tout ce que l'UI rejoue), `mule_alerts.json`, `dossiers.json`, `incidents.json`, `audit.jsonl`, `gpu_log.txt`, `token_cost.json`, `embed_bench.json` |

Verdict global : **travail d'un niveau rare pour un hackathon**, sur la rigueur de mesure comme sur l'architecture. Une faille de présentation, critique pour un *GPU* Challenge, est à corriger avant le passage.

## 2. Points forts

| # | Point fort | Où |
|---|---|---|
| 1 | Frontière de confiance explicite : `Complaint`/`Extraction` restent chez l'opérateur, seul `SharedRecord` (alias HMAC, montant arrondi, typologie) sort | `schemas.py`, `pseudonymize.py` |
| 2 | Référence loyale : l'opérateur seul reçoit la même règle 3/2/60, privée des autres réseaux | `graph_hub.detect_baseline_alerts` |
| 3 | Métrique d'impact monotone et non biaisée (`gelable(t) = total − retiré(t)`) | `datagen/scenarios.py` |
| 4 | Moteurs toujours nommés dans les sorties (`regex-baseline`, `llm`, `heuristic-fallback` ; `bge-m3`, `tfidf-svd`) | `extract.py`, `embed.py` |
| 5 | Leurres légitimes et arnaques isolées injectés pour mesurer la précision | `datagen/` |
| 6 | Sous-corpus ambigu mesuré : argument central du projet, publié même défavorable | `bench/benchmark.py` |
| 7 | Dossier « inspiré » d'ISO 20022 camt.056, jamais présenté comme certifié | `dossier.py` |
| 8 | Minuteur en jours ouvrés avec fériés (art. 35) et calendaires (Circulaire CB) | `timer.py` |
| 9 | Audit append-only chaîné par hachage, portée écrite | `audit.py` |
| 10 | Mode démo qui rejoue `demo_bundle.json` sans LLM ni GPU | `pipeline.py`, `app/dashboard.py` |
| 11 | Client LLM unique compatible OpenAI, test de disponibilité borné à 2,5 s | `llm.py` |
| 12 | Voix limitée au français, refus explicite des langues locales avec la raison | `voice.py` |
| 13 | Coûts tirés de prix publics datés, coût local refusé sans débit GPU | `config.py`, `bench/token_cost.py` |

## 3. Faiblesses classées par gravité

| ID | Gravité | Faiblesse | Conséquence | Correctif |
|---|---|---|---|---|
| D-01 | **Critique** | L'étiquette « GPU run — Tesla T4 » décrit le **matériel détecté**, pas le **moteur utilisé**. Le run publié a tourné avec `heuristic-fallback` et `tfidf-svd` | Un juré qui ouvre `results/` conclut à une présentation trompeuse — l'inverse de la posture d'honnêteté du projet | Relancer avec le LLM (§5) ; et faire dépendre l'étiquette du moteur (`config.Hardware.run_label` → inclure `moteurs_extraction`) |
| D-02 | **Critique** | Débit LLM « non mesuré », coût d'inférence locale « non calculé » | Pas de réponse chiffrée à « où est le GPU ? » | `make bench-llm` sur la T4 |
| D-03 | Majeure | `gpu_log.txt` : utilisation moyenne 4,58 %, mémoire max 2 649 Mo ; échantillons à 0 % pendant le pipeline | Prouve l'inverse de ce qu'on veut montrer | Enregistrer le journal pendant `pipeline-llm` et `bench-llm` |
| D-04 | Majeure | `make pipeline` force `--embed-engine tfidf` même sur GPU ; bge-m3 n'a été mesuré que sur 300 textes (32,8 textes/s, chargement inclus) | Le pipeline publié n'utilise pas le modèle annoncé dans le pitch | `make pipeline-llm` (qui passe `--embed-engine auto`) |
| D-05 | Majeure | L'argument du dossier « seule l'inférence locale rend l'automatisation rentable » est contredit par la mesure : API cloud 70,68 FCFA / 1 000 réclamations | Le pitch peut se faire démonter par ses propres résultats | Pivoter vers souveraineté, partage minimal, débit (consigné dans `DECISIONS.md` le 25/11, à reporter dans `PITCH.md`) |
| D-06 | Moyenne | Extracteur heuristique écrit en connaissant les gabarits : F1 0,982 « optimiste par construction » | Le gain d'extraction affiché n'est pas celui du LLM | Publier la F1 du LLM sur échantillon (`bench-llm`) |
| D-07 | Moyenne | Précision brute 42 %, 5 campagnes seulement | Incertitude large | Le dire ; élargir le jeu (20 campagnes) après le challenge |
| D-08 | Moyenne | Pas d'API : l'UI lit des fichiers JSON | Pas d'intégration possible avec un SI opérateur | API FastAPI (voir [api.md](../01-general/api.md)) |
| D-09 | Mineure | `app/dashboard.py` monolithique (1 400 lignes) | Difficile à faire évoluer | Découper par onglet ; la plateforme web prend le relais |
| D-10 | Mineure | Emojis et symboles dans les onglets Streamlit (`▶`) | Cosmétique | Remplacer par des icônes SVG dans la plateforme web |
| D-11 | Mineure | Clé de consortium par défaut `cle-de-developpement-a-remplacer` | Acceptable en démo, à signaler | Déjà signalé dans `privacy_report` (`cle_par_defaut_de_dev`) |

## 4. Le risque n°1 : le GPU

Constat dans `results/demo_bundle.json` (`meta`) et la première entrée de `results/audit.jsonl` :

| Champ | Valeur publiée | Ce qu'un juré lit |
|---|---|---|
| `etiquette_execution` | GPU run — Tesla T4 (15360 MiB) | « Ça a tourné sur GPU » |
| `moteurs_extraction` | `heuristic-fallback` | Extraction sans LLM |
| `moteur_embeddings` | `tfidf-svd` | Embeddings sans bge-m3 |
| `llm.requests_per_second` | `null` (« non mesuré ») | Aucun appel LLM |
| `gpu_log.txt` | moyenne 4,58 %, majorité d'échantillons à 0 % | GPU inactif |

Cause racine : `config.Hardware.run_label()` construit l'étiquette à partir de `nvidia-smi` (matériel présent), indépendamment des moteurs effectivement utilisés ; et la cible `make all` appelle `make pipeline` (repli) au lieu de `make pipeline-llm`.

Ce qui a réellement tourné sur le GPU : `bench/embed_bench.py` (bge-m3 sur `cuda`, 300 textes, 32,83 textes/s, chargement du modèle compris).

## 5. Marche à suivre sur la machine GPU

À exécuter sur la T4 (Colab, Kaggle ou machine des organisateurs), dans cet ordre. Durée estimée : 30 à 45 min, dont le téléchargement de Qwen2.5-7B-AWQ (~5 Go).

| Étape | Commande | Terminal | Sortie attendue |
|---|---|---|---|
| 1 | `make setup && make setup-gpu` | T1 | Résolution sans `ResolutionImpossible` (pins corrigés le 25/11) |
| 2 | `make env` | T1 | VRAM ≥ 12 Go → `Qwen/Qwen2.5-7B-Instruct-AWQ` |
| 3 | `make data` | T1 | `data/complaints.jsonl` identique octet pour octet |
| 4 | `make serve-llm` | **T2** (laisser tourner) | vLLM écoute sur `http://localhost:8000/v1` |
| 5 | `INTERVAL=0.5 bash scripts/record_gpu_evidence.sh` | **T3** (laisser tourner) | `results/gpu_log.txt` alimenté |
| 6 | `make pipeline-llm` | T1 | `moteurs_extraction = ["llm"]`, `moteur_embeddings = "bge-m3"`, `llm.requests_per_second` renseigné |
| 7 | `make token-cost && make bench-llm` | T1 | Débit LLM et coût local pour 1 000 réclamations calculés |
| 8 | `make bench-embed` | T1 | bge-m3 mesuré à chaud |
| 9 | Ctrl-C dans T3, puis `make readme && make test` | T1 | README régénéré, tests verts |
| 10 | Rapatrier `results/` (zip, hors dépôt), committer sur une branche `results/gpu-llm` | — | PR vers `main` |

Si le temps manque : réduire l'échantillon LLM (le banc mesure sur échantillon), et **corriger l'étiquette** des résultats CPU en « CPU run (repli heuristique) sur machine équipée d'une T4 ». Ne jamais présenter le run actuel comme une exécution GPU.

À dire au jury si le run LLM ne passe pas : « Le pipeline de démo tourne en repli local ; le GPU porte l'extraction LLM et bge-m3, mesurés à X réclamations/s sur T4 » — uniquement avec un X mesuré.

## 6. Comment le projet aurait dû commencer

L'ordre réel a été : données → hub → radar → dossier → UI → GPU le dernier jour. L'ordre idéal pour un *GPU* Challenge met le GPU en premier, parce que c'est l'étape la plus risquée (dépendances, quotas, téléchargements) et celle que le jury vérifie.

| Ordre | Chantier | Pourquoi à ce rang |
|---|---|---|
| 1 | **Squelette de bout en bout sur GPU** : vLLM servi, 100 plaintes extraites en JSON guidé, `gpu_log` enregistré | Dérisquer l'environnement GPU le jour 1 (les pins vLLM/torch ont cassé le 25/11) |
| 2 | Générateur + vérité terrain + référence | La référence fixe la barre à battre |
| 3 | Hub graphe + règle 3/2/60 + métrique gelable | C'est l'écart principal de la démo |
| 4 | Banc de mesure automatisé, README régénéré | Chaque chiffre a une source dès le début |
| 5 | Dossier, minuteur, audit | Sorties métier |
| 6 | Interface produit (plateforme web) + mode démo | Ce que le jury voit |
| 7 | Radar d'incidents, voix | Bonus |

Règle qui aurait évité D-01 : **l'étiquette d'exécution doit être calculée à partir des moteurs effectivement utilisés**, et un test doit échouer si `etiquette_execution` contient « GPU » alors qu'aucun moteur GPU n'a tourné.

## 7. Recommandations

1. **Avant 16 h** : étapes du §5, ou correction de l'étiquette. C'est la seule action qui change la note technique.
2. Ajouter un test `test_etiquette_coherente_avec_les_moteurs` (suggestion pour Pacôme).
3. Reporter dans `PITCH.md` le pivot de l'argument GPU (D-05).
4. Garder `app/dashboard.py` comme outil de démo de secours ; la plateforme web (`web/`) devient la vitrine produit.
5. Après le challenge : API FastAPI, découpage de l'UI, jeu de 20 campagnes, mesure LLM sur corpus complet.
