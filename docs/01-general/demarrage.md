# Guide de démarrage

> Installer et lancer Réclam'Graph de zéro : le pipeline Python, la démo Streamlit, la plateforme web Next.js, et l'exécution GPU. Un nouveau venu doit pouvoir tout lancer avec ce seul document.
> Mise à jour : 25/11/2026.

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Récupérer le dépôt](#2-récupérer-le-dépôt)
3. [Pipeline Python](#3-pipeline-python)
4. [Démo Streamlit](#4-démo-streamlit)
5. [Plateforme web](#5-plateforme-web)
6. [Exécution GPU](#6-exécution-gpu)
7. [Tests et vérifications](#7-tests-et-vérifications)
8. [Problèmes fréquents](#8-problèmes-fréquents)

---

## 1. Prérequis

| Outil | Version | Pour |
|---|---|---|
| Git | 2.40+ | Cloner |
| Python | 3.13+ | Pipeline |
| make | GNU make | Cibles du `Makefile` (sous Windows : Git Bash, WSL ou `mingw32-make`) |
| Node.js | 22+ (LTS) | Plateforme web |
| npm | 10+ | Plateforme web |
| GPU NVIDIA + pilote | T4 16 Go ou mieux, `nvidia-smi` disponible | Exécution LLM et bge-m3 (optionnel en démo) |

## 2. Récupérer le dépôt

```bash
git clone https://github.com/ahoussinoupacome123-lang/R-clam-Graph.git
cd R-clam-Graph
cp .env.example .env
```

Variables principales de `.env` (valeurs factices dans `.env.example`) :

| Variable | Rôle | Défaut |
|---|---|---|
| `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` | Serveur LLM compatible OpenAI | `http://localhost:8000/v1`, Qwen2.5-7B-AWQ |
| `EMBED_MODEL` | Modèle d'embeddings | `BAAI/bge-m3` |
| `RECLAM_CONSORTIUM_KEY` | Clé HMAC de consortium | Valeur de développement, **à remplacer, jamais commitée** |
| `GPU_HOURLY_PRICE_FCFA`, `CLOUD_API_PRICE_PER_1K_FCFA` | Paramètres de coût | Prix publics relevés le 25/11/2026 |
| `MULE_MIN_COMPLAINANTS`, `MULE_MIN_OPERATORS`, `MULE_WINDOW_MINUTES` | Règle du hub | 3 / 2 / 60 |
| `RECLAM_DEMO_MODE` | Rejouer les résultats pré-calculés | `1` |

## 3. Pipeline Python

```bash
make setup      # crée .venv et installe les dépendances CPU
make all        # données (20 000 plaintes) + pipeline + coûts + banc + README + tests
```

| Cible | Effet | Sortie |
|---|---|---|
| `make data` | Génère le corpus déterministe | `data/complaints.jsonl` (12 Mo, non versionné), `data/ground_truth.json` |
| `make pipeline` | Pipeline en repli local (extraction auto, TF-IDF) | `results/*.json` |
| `make token-cost` | Compte les tokens par réclamation | `results/token_cost.json` |
| `make bench` | Référence contre solution | `results/benchmark.{json,md}` |
| `make readme` | Réinjecte les chiffres dans le README | `README.md` |
| `make test` | 112 tests | — |
| `make env` | Affiche le matériel détecté et le modèle recommandé | — |
| `make help` | Liste toutes les cibles | — |

Sous Windows sans `make` : `set PYTHONPATH=src` puis `python -m reclam_graph.datagen`, `python -m reclam_graph.pipeline --embed-engine tfidf`, `python -m bench.benchmark`, `python -m pytest`.

## 4. Démo Streamlit

```bash
make demo        # mode démo : rejoue results/demo_bundle.json, sans GPU ni LLM
make demo-live   # calcul direct (nécessite les données et, pour le LLM, make serve-llm)
```

Ouvre `http://localhost:8501`. Onglets : essai interactif, l'histoire d'Aïcha, seul ou ensemble, graphe, dossier, pannes, preuves chiffrées, vie privée.

## 5. Plateforme web

```bash
cd web
cp .env.example .env.local     # puis renseigner AUTH_SECRET (32 caractères aléatoires au moins)
npm install
npm run dev                     # http://localhost:3000
```

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (doit être vert avant tout merge) |
| `npm run start` | Sert le build |
| `npm run lint` | ESLint |

**Comptes de démonstration** : un compte par rôle (responsable litiges et fraude, analyste, agent, superviseur régulateur) est défini dans `web/src/lib/demo-accounts.ts`. Les identifiants ne sont pas recopiés dans la documentation ; consulter ce fichier ou demander à Joachim. Ces comptes n'existent qu'en démonstration et ne donnent accès qu'à des données synthétiques.

La plateforme lit les résultats du pipeline (`results/`) : relancer `make pipeline` ou `make pipeline-llm` met à jour les chiffres affichés.

## 6. Exécution GPU

Procédure complète et ordonnée : [analyse-depot.md §5](../00-cadrage/analyse-depot.md#5-marche-à-suivre-sur-la-machine-gpu). Résumé :

```bash
make setup && make setup-gpu
make serve-llm                                   # terminal 2, laisser tourner
INTERVAL=0.5 bash scripts/record_gpu_evidence.sh # terminal 3, laisser tourner
make pipeline-llm && make token-cost && make bench-llm && make bench-embed
make readme && make test
```

Vérifier ensuite dans `results/demo_bundle.json` : `meta.moteurs_extraction` contient `llm`, `meta.moteur_embeddings.engine` vaut `bge-m3`, `meta.llm.requests_per_second` est renseigné.

## 7. Tests et vérifications

| Avant un merge sur `main` | Commande |
|---|---|
| Tests Python | `make test` |
| Compilation Python | `make lint` |
| Build web | `cd web && npm run build` |
| Lint web | `cd web && npm run lint` |
| Cohérence documentation / résultats | inclus dans `make test` (`test_docs.py`) |

## 8. Problèmes fréquents

| Symptôme | Cause | Solution |
|---|---|---|
| `ResolutionImpossible` à `make setup-gpu` | Pins torch/transformers incompatibles avec vLLM | Corrigé le 25/11 ; utiliser `requirements-gpu.txt` à jour |
| `available()` du LLM renvoie faux | Aucun serveur sur `LLM_BASE_URL` | `make serve-llm` dans un autre terminal ; test borné à 2,5 s |
| Résultats étiquetés « GPU run » mais moteur `heuristic-fallback` | `make pipeline` lancé au lieu de `make pipeline-llm` | Voir [BUG-001](../03-suivi/anomalies.md) |
| bge-m3 très lent | Exécution sur CPU (5 textes/s) | Utiliser le GPU ou le repli `tfidf-svd` |
| `record_gpu_evidence.sh` sort en erreur | Pas de `nvidia-smi` | Normal hors machine GPU : aucune mesure n'est fabriquée |
| Page web blanche après connexion | `AUTH_SECRET` absent de `web/.env.local` | Renseigner la variable et relancer `npm run dev` |
| `make` introuvable sous Windows | — | Git Bash, WSL, ou commandes Python directes (§3) |
