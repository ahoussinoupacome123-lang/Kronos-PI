# Stack technique

> Technologies, versions exactes et raisons des choix. Les versions Python viennent de `requirements.txt` et `requirements-gpu.txt` ; les versions web de `web/package.json`.
> Mise à jour : 25/11/2026.

## 1. Pipeline et ML (Python)

| Brique | Version | Rôle | Pourquoi |
|---|---|---|---|
| Python | 3.13+ (vérifié 3.14.4) | Langage du pipeline | Écosystème ML |
| numpy | `>=2.4.6,<2.6` | Calcul | Fourchette : vLLM plafonne sous 2.5 |
| pandas | 3.1.1 | Tables | — |
| scipy | 1.18.1 | Statistiques | — |
| scikit-learn | 1.9.1 | TF-IDF, régression logistique (référence), SVD (repli embeddings) | Référence supervisée loyale |
| networkx | 3.7 | Hub graphe | Simple, suffisant en lot |
| Faker | 40.63.0 | Générateur synthétique | Noms, numéros |
| pydantic | 2.14.4 | Schémas (`Complaint`, `SharedRecord`…) | Validation, réutilisables par FastAPI |
| openai | 3.59.0 | Client unique compatible OpenAI | vLLM et Ollama interchangeables |
| python-dotenv | 1.2.4 | Configuration | — |
| orjson | 3.13.0 | Sérialisation rapide | — |
| streamlit | 1.67.0 | Interface de démo technique | Rapide à produire |
| plotly | 7.2.0 | Graphes de l'UI Streamlit | — |
| pytest | 9.2.0 | Tests (112) | — |

### Extras GPU (`requirements-gpu.txt`, machine GPU seulement)

| Brique | Version | Rôle |
|---|---|---|
| vllm | 0.34.0 | Serveur LLM, décodage guidé JSON |
| torch | 2.14.0 | Imposé par vLLM 0.34.0 |
| transformers | 5.22.2 | `<5.23.0` exigé par vLLM |
| sentence-transformers | 6.3.0 | bge-m3 |
| huggingface-hub | 2.4.0 | Téléchargement des modèles |
| accelerate | — | Chargement des modèles |

### Modèles

| Modèle | Usage | Condition |
|---|---|---|
| `Qwen/Qwen2.5-7B-Instruct-AWQ` | Extraction JSON, génération synthétique, assistant (P1) | VRAM ≥ 12 Go ; fp16 sur T4 (pas de bf16) |
| `Qwen/Qwen2.5-3B-Instruct` | Même rôle, débit | VRAM < 12 Go |
| `BAAI/bge-m3` | Embeddings 1024 dim, déduplication, radar | GPU (32,8 textes/s mesurés sur T4, chargement compris, 300 textes) |

## 2. Plateforme web (TypeScript)

| Brique | Version | Rôle | Pourquoi |
|---|---|---|---|
| Next.js | 16.4.6 (App Router) | Rendu serveur, routes, `proxy.ts` pour la protection | Produit web complet, déploiement simple |
| React / React DOM | 19.3.0 | Interface | — |
| TypeScript | 5 | Typage | — |
| Tailwind CSS | 4.3.3 | Styles | Design system rapide |
| three | 0.187.0 | Animation 3D du hero (graphe de réseaux) | Différencier la landing |
| jose | 6.2.x | Session signée (JWT HS256) en cookie `HttpOnly` | Léger, compatible runtime Node |
| react-markdown + remark-gfm | 10.1 / 4.0 | Rendu des CGU et de la politique de confidentialité depuis `web/content/legal/*.md` | Textes juridiques éditables en Markdown |

Next.js 16 : le middleware s'appelle `proxy.ts` ; `cookies()`, `headers()`, `searchParams` sont asynchrones. Lire `web/node_modules/next/dist/docs/` avant toute modification.

## 3. Cible de production

| Brique | Rôle |
|---|---|
| FastAPI | API entre pipeline et plateforme web |
| PostgreSQL (+ Apache AGE) ou Neo4j | Persistance, graphe, audit |
| Redis Streams ou NATS | Flux opérateur → hub |
| PSI (intersection d'ensembles privée) | Remplacement du HMAC partagé |
| Hébergement souverain UEMOA | Localisation des données |

## 4. Alternatives écartées

| Alternative | Raison |
|---|---|
| API LLM cloud pour l'extraction | Le texte des plaintes quitterait l'opérateur et la zone ; pourtant moins chère (70,68 FCFA / 1 000, mesuré) : l'argument est la souveraineté, pas le prix |
| Classifieur seul (TF-IDF) comme produit | La typologie n'est pas le différenciateur ; sur le sous-corpus ambigu, aucun moteur textuel ne dépasse la classe majoritaire |
| Streamlit comme produit final | Pas de rôles, d'authentification ni de design produit |
| Whisper en langues locales | WER publiés > 97 % (wolof) |
