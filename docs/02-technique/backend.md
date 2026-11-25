# Backend — pipeline Python

> Organisation de `src/reclam_graph/` et de `bench/` : responsabilité, fonctions principales, dépendances et usage de chaque module. Lire avec [architecture.md](../01-general/architecture.md).
> Mise à jour : 25/11/2026.

## Sommaire

1. [Organisation](#1-organisation)
2. [Modules](#2-modules)
3. [Banc de mesure](#3-banc-de-mesure)
4. [Sorties](#4-sorties)
5. [Tests](#5-tests)

---

## 1. Organisation

```
src/reclam_graph/
├── config.py          # configuration, matériel, coûts, étiquettes
├── schemas.py         # modèles pydantic (frontières de données)
├── datagen/           # bloc 1 : générateur synthétique
│   ├── generator.py
│   ├── scenarios.py   # campagnes de mules, modèle de retrait
│   └── templates.py   # gabarits de texte bruité
├── llm.py             # client LLM unique compatible OpenAI
├── extract.py         # bloc 2 : extraction structurée
├── embed.py           # bloc 3 : embeddings, déduplication
├── pseudonymize.py    # bloc 4 : frontière de confiance
├── graph_hub.py       # bloc 5 : hub de corrélation
├── radar.py           # radar d'incidents
├── dossier.py         # bloc 6 : dossier de litige
├── timer.py           # bloc 6 : minuteur réglementaire
├── audit.py           # bloc 6 : piste d'audit
├── voice.py           # bonus : transcription française
└── pipeline.py        # orchestration lire → pseudonymiser → croiser → agir
```

Couches : **schémas** (données) → **blocs** (fonctions pures autant que possible) → **pipeline** (orchestration, écriture de `results/`) → **interfaces** (`app/`, `web/`). Patron constant : chaque moteur est **nommé** dans ses sorties, et chaque chiffre a une étiquette (mesure, estimation, prix public, hypothèse).

## 2. Modules

### config.py

| | |
|---|---|
| Responsabilité | Point unique de configuration : variables d'environnement, détection du matériel (`nvidia-smi`), choix du modèle selon la VRAM, paramètres de coût, règle du hub, délais |
| Éléments | `Hardware` (dont `run_label()`), `detect_hardware()`, `summary()`, `_fr()` (nombres à la française) |
| Point d'attention | `run_label()` décrit le matériel détecté, pas les moteurs utilisés : cause racine de [BUG-001](../03-suivi/anomalies.md) |

### schemas.py

| Modèle | Rôle | Reste chez l'opérateur ? |
|---|---|---|
| `Typology`, `Channel`, `Decision`, `ExtractionEngine` | Énumérations | — |
| `Complaint` | Réclamation brute | Oui |
| `Extraction` | Sortie JSON de l'extracteur | Oui |
| `SharedRecord` | Seul objet envoyé au hub | Non (c'est ce qui sort) |
| `MuleAlert` | Alerte « mule probable » (recommandation) | — |
| `IncidentAlert` | Alerte du radar | — |
| `RegulatoryTimer` | Échéances | — |
| `DisputeFile` | Dossier de litige | Oui |
| `AuditEntry` | Entrée de journal chaînée | — |

### datagen/

| Fichier | Rôle | Fonctions clés |
|---|---|---|
| `generator.py` | 20 000 réclamations sur 7 jours, 3 opérateurs fictifs, déterministe (graine fixe) ; bruit SMS, fautes, nouchi/fon ; indicateurs d'arnaque réellement présents | `generate_dataset`, `noisify`, `format_amount`, `detect_indicators` |
| `scenarios.py` | 5 campagnes de mules explicites, leurres, incident PI-SPI ; modèle de retrait | `withdrawn_fcfa`, `freezable_fcfa` |
| `templates.py` | Gabarits de texte, dont gabarits **ambigus** (même texte pour arnaque et erreur sincère) | `amount_in_words` |

Usage : `make data` ou `python -m reclam_graph.datagen`.

### llm.py

| | |
|---|---|
| Responsabilité | Client unique compatible OpenAI (vLLM, Ollama) ; mesure latence, tokens, requêtes/s |
| Éléments | `LLMClient`, `LLMMetrics`, `get_client()`, `_loose_json()` |
| Garde-fou | Test de disponibilité borné à 2,5 s sans réessai |

### extract.py

| Moteur | Fonction | Rôle |
|---|---|---|
| `regex-baseline` | `extract_regex` | Référence : ce qu'un opérateur a aujourd'hui |
| `llm` | `extract_llm_batch` | Cible : JSON guidé, mesure du débit |
| `heuristic-fallback` | `extract_heuristic` | Repli sans GPU ; F1 « optimiste par construction » |
| Point d'entrée | `extract(engine=…)` | Choisit et nomme le moteur |

### embed.py

| Moteur | Rôle | Mesure |
|---|---|---|
| `bge-m3` | Cible, 1024 dim | 32,8 textes/s sur T4 (300 textes) ; 5,0 textes/s sur CPU |
| `tfidf-svd` | Repli local, 256 dim | 496 textes/s |

Fonctions : `embed_texts`, `find_near_duplicates`, `dedup_keep_first`.

### pseudonymize.py

| Fonction | Rôle |
|---|---|
| `hmac_hash` | HMAC-SHA256 tronqué, déterministe pour une clé |
| `round_amount` | Arrondi au pas de 5 000 FCFA (minimum un pas) |
| `load_alias_directory`, `resolve_beneficiary`, `normalize_msisdn` | Résolution numéro → alias PI-SPI simulée |
| `to_shared_record` | Construit le `SharedRecord` ; `None` si rien n'est partageable |
| `privacy_report` | Posture vie privée affichée dans l'UI et le README |

### graph_hub.py

| Fonction | Rôle |
|---|---|
| `build_graph` | Graphe tripartite plaignants / bénéficiaires / opérateurs |
| `detect_mule_alerts` | Règle 3/2/60 en fenêtre glissante, alias par alias |
| `score_cluster` | Score 0–1 (pondéré vers typologie d'arnaque et vitesse d'arrivée) |
| `detect_baseline_alerts` | Référence : chaque opérateur ne voit que ses plaintes |
| `cashout_models_from_ground_truth`, `map_alerts_to_campaigns`, `attach_impact` | Montant encore gelable à l'instant de l'alerte |

### radar.py

| Fonction | Rôle |
|---|---|
| `detect_incidents` | Pics par (opérateur, typologie), base saisonnière robuste (médiane + MAD), seuil ×2 |
| `_dominant_cluster`, `_label_incident` | Nomme l'incident par regroupement |
| `evaluate_against_ground_truth` | Rappel et précision contre les incidents injectés |

### dossier.py

| Fonction | Rôle |
|---|---|
| `decide` | GELER / REMBOURSER / A_QUALIFIER |
| `build_dispute_file` | Dossier complet : décision, message inspiré camt.056, minuteur, preuves, avis d'irrévocabilité |
| `render_markdown` | Rendu lisible par un agent |

### timer.py

| Fonction | Rôle |
|---|---|
| `build_timer` | J+3 ouvrés (art. 35), J+30 calendaires (Circulaire CB), échéance PI-Reclam paramétrable « non publique » |
| `add_business_days`, `is_business_day`, `business_days_between` | Calendrier ouvré avec fériés |
| `urgency` | Niveau et message du bandeau d'urgence |

### audit.py

| Élément | Rôle |
|---|---|
| `AuditLog` | Journal append-only chaîné (`prev_hash`, `entry_hash`) |
| `verify_chain` | Détection d'altération (portée : pas d'inviolabilité cryptographique) |
| `report` | Résumé pour l'onglet Audit |

### voice.py

| Élément | Rôle |
|---|---|
| `VoiceTranscriber`, `get_transcriber` | faster-whisper ou openai-whisper s'ils sont présents ; français seulement |
| `capability_report` | Ce qui est supporté et refusé (wolof, bambara, fongbe, mina) avec la raison |

### pipeline.py

| Fonction | Rôle |
|---|---|
| `run` | Exécute les six blocs, écrit `results/`, renvoie le paquet de démo |
| `_graph_payload` | Nœuds et arêtes pour le graphe animé |
| `_build_demo_case` | Cas d'ouverture : première victime de CMP-01 (Aïcha) |
| `main` | CLI : `--engine {auto,llm,regex,heuristic}`, `--embed-engine {auto,tfidf,bge-m3}` |

## 3. Banc de mesure

| Fichier | Rôle | Cible make |
|---|---|---|
| `bench/benchmark.py` | Référence contre solution : mules, typologie, sous-corpus ambigu, extraction, radar, débit, coûts, GPU | `bench`, `bench-llm` |
| `bench/metrics.py` | F1, rappel, précision | — |
| `bench/token_cost.py` | Tokens réels par réclamation → coût API cloud | `token-cost` |
| `bench/embed_bench.py` | bge-m3 contre TF-IDF | `bench-embed` |

## 4. Sorties

| Fichier | Contenu | Lu par |
|---|---|---|
| `results/demo_bundle.json` | Tout ce que les interfaces rejouent (méta, volumes, cas, alertes, graphe, dossiers, incidents, métriques) | Streamlit, plateforme web |
| `results/benchmark.{json,md}` | Résultats face à la référence | README, UI |
| `results/mule_alerts.json`, `baseline_alerts.json` | Alertes consortium et opérateur seul | UI |
| `results/dossiers.json` | 200 dossiers | UI |
| `results/incidents.json` | Radar | UI |
| `results/audit.jsonl` | Journal chaîné | UI |
| `results/gpu_log.txt` | Échantillons `nvidia-smi` | Banc |
| `results/token_cost.json`, `embed_bench.json` | Coûts, embeddings | Banc |

## 5. Tests

112 tests `pytest` dans `tests/` : générateur déterministe, extraction, pseudonymisation, hub, radar, minuteur, dossier et audit, pipeline, voix, cohérence documentation / résultats (`test_docs.py`). Lancement : `make test`.
