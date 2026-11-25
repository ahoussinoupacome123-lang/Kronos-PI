# Registre des anomalies

> Toutes les anomalies détectées sur Réclam'Graph, ouvertes ou corrigées, avec leur cause racine et leur correctif. Mettre à jour en temps réel. Les anomalies corrigées avant le 25/11 sont reprises de [DECISIONS.md](../../DECISIONS.md).
> Mise à jour : 25/11/2026.

## Synthèse

| ID | Titre | Gravité | Statut |
|---|---|---|---|
| BUG-001 | Étiquette « GPU run » sur une exécution en repli CPU | Critique | Corrigé |
| BUG-002 | Alias de mules pollués par des clients du bruit | Majeure | Corrigé |
| BUG-003 | Pins GPU incompatibles avec vLLM (`ResolutionImpossible`) | Majeure | Corrigé |
| BUG-004 | Regex de montant qui rate « 25.000F » | Majeure | Corrigé |
| BUG-005 | Radar : pic du matin signalé comme incident | Majeure | Corrigé |
| BUG-006 | Typologie F1 = 1,00 : le classifieur reconnaissait les gabarits | Majeure | Corrigé |
| BUG-007 | Feuille de style Streamlit affichée en texte | Mineure | Corrigé |
| BUG-008 | Test de disponibilité LLM bloquant plusieurs minutes | Mineure | Corrigé |

---

## BUG-001 — Étiquette « GPU run » sur une exécution en repli CPU

| Champ | Valeur |
|---|---|
| Description | `results/demo_bundle.json`, `benchmark.{json,md}`, `embed_bench.json` et l'audit portent « GPU run — Tesla T4 (15360 MiB) » alors que `moteurs_extraction = ["heuristic-fallback"]` et `moteur_embeddings = "tfidf-svd"`. Débit LLM « non mesuré », coût local « non calculé », GPU moyen 4,58 %. Attendu : l'étiquette décrit ce qui a réellement calculé |
| Reproduction | Sur une machine avec GPU, `make all` (qui appelle `make pipeline`, en repli), puis lire `meta` dans `results/demo_bundle.json` |
| Gravité | Critique (présentation trompeuse dans un *GPU* Challenge, contraire à la posture d'honnêteté du projet) |
| Statut | Corrigé le 25/11/2026 |
| Détection | 25/11/2026 — audit du dépôt (agent) |
| Cause racine | `config.Hardware.run_label()` est calculé depuis `nvidia-smi` (matériel présent), pas depuis les moteurs utilisés ; `make all` enchaîne `make pipeline` (`--embed-engine tfidf`, extraction auto sans serveur LLM) |
| Correctif proposé | (1) Exécuter `make serve-llm`, `make pipeline-llm`, `make bench-llm` avec `record_gpu_evidence.sh` ([procédure](../00-cadrage/analyse-depot.md#5-marche-à-suivre-sur-la-machine-gpu)) ; (2) dériver l'étiquette des moteurs (« GPU run — LLM + bge-m3 » ou « repli CPU sur machine équipée d'une T4 ») ; (3) test qui échoue si l'étiquette contient « GPU » sans moteur GPU |
| Correctif appliqué | `config.execution_label(moteurs_extraction, moteur_embeddings)` dérive l'étiquette des moteurs qui ont calculé : « GPU run — … — calculé sur GPU : LLM + bge-m3 », ou « repli CPU sur machine équipée d'une Tesla T4 — aucun calcul sur GPU (…) ». Câblé dans `pipeline.py`, `bench/benchmark.py`, `bench/embed_bench.py`. `scripts/fix_execution_label.py` corrige les fichiers déjà produits à partir des moteurs qu'ils déclarent, sans toucher aux mesures. Deux tests (`tests/test_pipeline.py`) échouent si une étiquette annonce « GPU run » sans nommer un moteur GPU. Reste à faire : la mesure LLM elle-même (T-01) |
| Référence | `fix/etiquette-execution` |

## BUG-002 — Alias de mules pollués par des clients du bruit

| Champ | Valeur |
|---|---|
| Description | Un client du bruit nommé « Koffi Santos » chez BETACASH produisait l'alias de la mule de CMP-01 ; ses plaintes polluaient la grappe ; l'alerte partait à 23 min au lieu de 12 |
| Gravité | Majeure (benchmark invalide) |
| Statut | Corrigé |
| Détection / correction | 21/11/2026 — Pacôme |
| Cause racine | Alias de mules de même forme que les alias générés (`prenom.nom@operateur`) |
| Correctif | Ensemble d'alias réservés + invariant qui échoue bruyamment si une grappe est polluée |
| Référence | `DECISIONS.md` 2026-11-21 10:15 |

## BUG-003 — Pins GPU incompatibles avec vLLM

| Champ | Valeur |
|---|---|
| Description | `make setup-gpu` échouait en `ResolutionImpossible` : `torch==2.15.0` et `transformers==5.24.1` épinglés alors que vLLM 0.34.0 impose `torch==2.14.0` et `transformers<5.23.0` ; numpy exact `2.5.5` alors que vLLM plafonne sous 2.5 |
| Gravité | Majeure (bloque toute exécution GPU) |
| Statut | Corrigé |
| Détection / correction | 25/11/2026 — Pacôme |
| Cause racine | Versions vérifiées une par une, pas par résolution complète |
| Correctif | Pins alignés sur vLLM, numpy en fourchette `>=2.4.6,<2.6`, vérification par `pip install --dry-run` |
| Référence | Commits `ec6fc48`, `8522cfc`, `280d450` (`fix/gpu-deps`) |

## BUG-004 — Regex de montant qui rate « 25.000F »

| Champ | Valeur |
|---|---|
| Description | `\b` après « 25.000 » échoue quand une unité suit immédiatement |
| Gravité | Majeure (référence artificiellement faible : écart non crédible) |
| Statut | Corrigé |
| Détection / correction | 22/11/2026 — Pacôme |
| Correctif | Assertion sur les chiffres au lieu de `\b` ; la référence passe de 62,5 % à 75,6 % sur les montants |
| Référence | `DECISIONS.md` 2026-11-22 11:20 |

## BUG-005 — Radar : pic du matin signalé comme incident

| Champ | Valeur |
|---|---|
| Description | Comparer 10 h aux heures précédentes revenait à la comparer à la nuit : le pic d'activité normal du matin était un faux incident |
| Gravité | Majeure |
| Statut | Corrigé |
| Détection / correction | 18/11/2026 — Pacôme |
| Correctif | Base saisonnière (même heure, jours précédents) + seuil matériel ×2 le volume normal |
| Référence | `DECISIONS.md` 2026-11-18 11:30 et 12:15 |

## BUG-006 — Typologie F1 = 1,00

| Champ | Valeur |
|---|---|
| Description | TF-IDF + logreg atteignait 1,00 : des n-grammes reconnaissaient le gabarit, pas le sens |
| Gravité | Majeure (mesure invalide) |
| Statut | Corrigé |
| Détection / correction | 20/11/2026 — Pacôme |
| Correctif | Gabarits ambigus (même texte pour arnaque et erreur sincère) + 600 arnaques isolées ; mesure sur le sous-corpus ambigu |
| Référence | `DECISIONS.md` 2026-11-20 14:10 à 17:30 |

## BUG-007 — Feuille de style Streamlit affichée en texte

| Champ | Valeur |
|---|---|
| Description | Le CSS de la refonte s'affichait comme du texte sur la page |
| Gravité | Mineure |
| Statut | Corrigé |
| Détection / correction | 25/11/2026 — Pacôme |
| Référence | Commit `1754a27` |

## BUG-008 — Test de disponibilité LLM bloquant

| Champ | Valeur |
|---|---|
| Description | `available()` par défaut bloquait plusieurs minutes sans serveur LLM |
| Gravité | Mineure (critique pendant une démo de 3 min) |
| Statut | Corrigé |
| Détection / correction | 17/11/2026 — Pacôme |
| Correctif | Test borné à 2,5 s, sans réessai |
| Référence | `DECISIONS.md` 2026-11-17 08:20 |
