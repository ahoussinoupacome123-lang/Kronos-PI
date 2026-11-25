# Contexte du projet — Réclam'Graph

> **Source de vérité commune** de tous les intervenants, humains ou agents IA. À lire au début de chaque session, à mettre à jour avant de clôturer chaque action (fonctionnalité, décision, correctif majeur, changement d'organisation).
> Méthode : skill `gestion-projet-git-doc` (branche par tâche, PR, `docs/` vivante, aucun co-auteur).

| | |
|---|---|
| **Dernière mise à jour** | 25/11/2026 — cadrage complet, audit du dépôt, ajout de la plateforme web (`web/`) et de l'assistant Nexus |
| **Phase courante** | GPU Challenge 2026 — demi-finale le 25/11 (passage équipe 12 vers 16 h 00), finale le 26/11 |
| **Équipe** | Token Titans (équipe 12) |
| **Dépôt** | `github.com/ahoussinoupacome123-lang/R-clam-Graph` (public) |
| **Lieu** | Epitech Bénin, Cotonou |

## Sommaire

1. [Objectif](#1-objectif)
2. [Périmètre](#2-périmètre)
3. [État actuel](#3-état-actuel)
4. [Décisions](#4-décisions)
5. [Contraintes et règles](#5-contraintes-et-règles)
6. [Intervenants](#6-intervenants)
7. [Documents](#7-documents)
8. [Historique](#8-historique)
9. [Documents non applicables](#9-documents-non-applicables)

---

## 1. Objectif

**Réclam'Graph** — *Chaque plainte est un capteur.* Analyse intelligente des réclamations clients du mobile money de l'UEMOA : croiser les plaintes de plusieurs opérateurs pour démasquer les **comptes mules avant le retrait**, et transformer chaque plainte légitime en **dossier de litige PI-SPI pré-rempli et minuté**.

Une entrée (la plainte), deux sorties : **geler** (mule probable, alerte inter-opérateurs, montant encore gelable) ou **rembourser** (erreur sincère, demande d'annulation pré-remplie, minuteur J+3 ouvrés / J+30, piste d'audit).

Pourquoi maintenant : PI-SPI (BCEAO, 30/09/2025) rend les transferts irrévocables et interopérables ; la victime est chez un opérateur, la mule chez un autre ; **chaque opérateur ne voit que la moitié du dossier**. PI-Reclam transporte les réclamations, rien de public n'indique qu'il les corrèle.

## 2. Périmètre

| Inclus | Exclu (pour l'instant) |
|---|---|
| Générateur synthétique déterministe (20 000 plaintes, 3 opérateurs fictifs, vérité terrain publiée) | Données réelles d'opérateurs (pilote seulement, après accord APDP/BCEAO) |
| Extraction structurée (regex de référence, LLM Qwen2.5 sur vLLM, repli heuristique) | Gel automatique d'un compte : **jamais**, décision humaine |
| Pseudonymisation HMAC-SHA256 côté opérateur | PSI (intersection d'ensembles privée) : cible de production |
| Hub graphe (règle 3 plaignants / 2 réseaux / 60 min + score) | Voix en langues locales (fon, wolof, mina) : refusée, WER publiés trop élevés |
| Radar d'incidents (pics + regroupement) | Connexion réelle à PI-SPI / PI-Reclam |
| Dossier de litige inspiré d'ISO 20022 camt.056, minuteur réglementaire, audit chaîné | Message ISO 20022 certifié |
| Interface Streamlit de démo (`app/`) et plateforme web Next.js (`web/`) avec assistant Nexus | Comptes de production, facturation |

Détail par exigence : [cahier des charges](docs/00-cadrage/cahier-des-charges.md).

## 3. État actuel

| Domaine | État |
|---|---|
| **Pipeline Python** (`src/reclam_graph/`) | Complet : 6 blocs, 15 modules, `make all` reproductible, 112 tests (`pytest`) |
| **Mesures** (`results/`) | Rappel mules 100 % (5/5) contre 60 % pour l'opérateur seul ; délai médian 13 min contre 29 ; 920 000 FCFA gelables contre 367 000 ; précision 42 % brute, 100 % après score ; F1 extraction 0,982 contre 0,959 ; radar incidents rappel 100 %, précision 50 % |
| **GPU** | **Risque n°1** : l'exécution étiquetée « GPU run — Tesla T4 » a utilisé le **repli CPU** (`heuristic-fallback`, `tfidf-svd`). Débit LLM « non mesuré », coût d'inférence locale « non calculé », utilisation GPU moyenne 4,58 %. bge-m3 a tourné sur CUDA dans `embed_bench` (300 textes, 32,8 textes/s). Voir [BUG-001](docs/03-suivi/anomalies.md) |
| **Interface Streamlit** (`app/dashboard.py`) | Fonctionnelle en mode démo (rejoue `results/demo_bundle.json`), onglet d'essai interactif |
| **Plateforme web** (`web/`) | Fusionnée dans `main` (PR #1, build vert) : landing Three.js, connexion, tableau de bord guidé (alertes, décision signée, dossiers, radar, preuves, audit), assistant Nexus ancré sur les mesures, CGU et confidentialité. Revue founder : 7,4/10, corrections appliquées ([revue](docs/03-suivi/revue-mvp-web.md)) |
| **Documentation** | `README.md`, `PITCH.md`, `SUBMISSION.md`, `DECISIONS.md` (Pacôme) + `docs/` (cadrage, architecture, suivi) |
| **À faire avant 16 h** | Relancer `make pipeline-llm` et `make bench-llm` sur la T4 avec `record_gpu_evidence.sh` ; sinon retirer l'étiquette « GPU run » des résultats CPU ; répétition chronométrée 5 + 3 + 5 |

Vue chiffrée : [suivi du cahier des charges](docs/03-suivi/suivi-cahier-des-charges.md).

## 4. Décisions

Le journal détaillé et horodaté reste [DECISIONS.md](DECISIONS.md) (une ligne par décision). Résumé des décisions structurantes :

| Date | Décision | Raison |
|---|---|---|
| 14/11 | Opérateurs fictifs `ALPHAMONEY`, `BETACASH`, `GAMMAPAY` | Ne pas attribuer des fraudes inventées à de vrais opérateurs |
| 14/11 | Un seul client LLM compatible OpenAI (`LLM_BASE_URL`, `LLM_MODEL`) | vLLM et Ollama interchangeables |
| 15/11 | Campagnes de mules spécifiées explicitement, générateur déterministe | Démo rejouable, vérité terrain auditable |
| 15/11 | Deux leurres légitimes injectés | Sans eux, une précision de 100 % serait fabriquée |
| 15/11 | `gelable(t) = total − déjà retiré(t)` | Métrique monotone : alerter plus tôt sauve toujours plus |
| 16/11 | Montant partagé arrondi (pas de 5 000 FCFA) | Partage minimal |
| 16/11 | La référence « opérateur seul » reçoit la même règle, privée des autres réseaux | Pas d'homme de paille |
| 16/11 | Règle 3/2/60 déclenche, score classe ; sous le seuil = « à qualifier », jamais supprimé | Décision humaine |
| 17/11 | Trois moteurs d'extraction nommés, jamais confondus (`regex-baseline`, `llm`, `heuristic-fallback`) | Une mesure de repli ne passe pas pour une mesure LLM |
| 19/11 | Dossier « inspiré » d'ISO 20022 camt.056, jamais présenté comme certifié | Crédibilité devant un participant PI-SPI |
| 19/11 | Audit chaîné par hachage : détection d'altération, pas inviolabilité | Portée écrite noir sur blanc |
| 20/11 | Mesure sur le sous-corpus ambigu (1 330 plaintes) : aucun moteur ne dépasse la classe majoritaire | C'est l'argument central : le signal est dans le croisement |
| 21/11 | Mode démo par défaut, rejoue `demo_bundle.json` | La démo ne dépend pas d'une session GPU en direct |
| 24/11 | Voix en français uniquement, langues locales refusées avec la raison | Une transcription à 97 % d'erreur a l'air d'une donnée |
| 25/11 | Coûts depuis des prix publics relevés, étiquetés comme tels ; coût local refusé sans débit GPU | Aucun chiffre non mesuré |
| 25/11 | **Plateforme web Next.js dans `web/`**, à côté du pipeline Python | Vitrine produit et parcours métier pour le jury, sans toucher au pipeline mesuré |
| 25/11 | **Assistant nommé « Nexus »** : guide chaque utilisateur, relie les EME entre elles à travers le graphe | Un nom de produit, pas un chatbot générique |
| 25/11 | **La plateforme web lit `results/`** (mode démo) ; API FastAPI en cible | Un seul jeu de chiffres, ceux du banc |
| 25/11 | Documentation structurée selon `gestion-projet-git-doc` (`docs/00` à `03`, `context.md`) | Demande de Joachim |

## 5. Contraintes et règles

1. **Aucun co-auteur** dans les commits, push et PR : pas de `Co-Authored-By`, pas de « Generated with ».
2. **Données synthétiques annoncées d'entrée** ; opérateurs fictifs ; générateur et vérité terrain publiés.
3. **Aucun chiffre non mesuré** : tout chiffre vient de `results/` ou porte l'étiquette « estimation », « hypothèse » ou « prix public affiché ». Le bloc de résultats du README est régénéré par script (`make readme`).
4. **Réclam'Graph recommande et documente, il ne gèle jamais seul.**
5. **Jamais de secret dans git** : `.env` ignoré, clé de consortium hors dépôt, comptes de démo du web sans mot de passe dans la documentation.
6. **Rien de rouge sur `main`** : `make test` vert ; pour `web/`, `npm run build` vert.
7. **Calendrier** : demi-finale 25/11 (passage équipe 12 vers 16 h 00, 13 min chronométrées = 5 min pitch + 3 min démo + 5 min questions ; test technique de 10 min le matin) ; finale 26/11 (tests techniques 07 h 45, finale 14 h 00, 15 min = 5 + 3 + 7).
8. **Ne jamais dire** : « nous remplaçons les agents », « aucune solution n'existe », « nous comprenons le fon / wolof / mina », un chiffre non mesuré.

## 6. Intervenants

| Qui | Rôle |
|---|---|
| **Joachim** | Porteur du projet, plateforme web, pitch, décisions produit |
| **Pacôme** | Pipeline Python, données synthétiques, banc de mesure, exécution GPU (T4) |
| **Claude (agents)** | Cadrage, documentation, plateforme web, revues (founder, juridique), sous la validation de Joachim |

## 7. Documents

| Besoin | Document |
|---|---|
| Index de la documentation | [docs/README.md](docs/README.md) |
| Ce que demande le challenge et comment le jury lira le projet | [00-cadrage/analyse-challenge.md](docs/00-cadrage/analyse-challenge.md) |
| Audit du dépôt et marche à suivre GPU | [00-cadrage/analyse-depot.md](docs/00-cadrage/analyse-depot.md) |
| Cahier des charges complet | [00-cadrage/cahier-des-charges.md](docs/00-cadrage/cahier-des-charges.md) |
| Roadmap | [00-cadrage/roadmap.md](docs/00-cadrage/roadmap.md) |
| Architecture, stack, API, démarrage | [01-general/](docs/01-general/) |
| Backend et interfaces | [02-technique/](docs/02-technique/) |
| Avancement, anomalies, revue founder | [03-suivi/](docs/03-suivi/) |
| CGU, confidentialité, risques juridiques | [04-juridique/](docs/04-juridique/) |
| Présentation et résultats | [README.md](README.md), [PITCH.md](PITCH.md), [SUBMISSION.md](SUBMISSION.md) |
| Journal des décisions | [DECISIONS.md](DECISIONS.md) |
| Variables d'environnement | [.env.example](.env.example), `web/.env.example` |

## 8. Historique

| Date | Évolution |
|---|---|
| 14/11/2026 | Dépôt initialisé, 4 pistes parallèles (données, LLM, graphe, démo) |
| 15–20/11/2026 | Générateur, campagnes, hub, radar, dossier, minuteur, audit ; mesure du sous-corpus ambigu |
| 21–24/11/2026 | Corrections (alias pollués, regex montant, radar saisonnier), mode démo, voix en bonus |
| 25/11/2026 matin | Dépendances GPU corrigées, coûts depuis prix publics, exécution sur Tesla T4 (en repli CPU), refonte de l'UI Streamlit, essai interactif |
| 25/11/2026 midi | Cadrage complet (`docs/`), `context.md`, branche `feat/plateforme-web` : plateforme web Next.js et assistant Nexus |
| 25/11/2026 12h33 | PR #1 fusionnée dans `main` : cadrage, juridique, revues founder et plateforme web ; branche supprimée |

## 9. Documents non applicables

| Document du skill | Pourquoi |
|---|---|
| `docs/01-general/base-de-donnees.md` | Pas de base de données au stade hackathon : fichiers JSON/JSONL dans `data/` et `results/`. Le modèle cible (PostgreSQL) est décrit dans le [cahier des charges](docs/00-cadrage/cahier-des-charges.md#7-choix-techniques) |
| `docs/02-technique/backend/<module>.md` | Les 15 modules sont décrits dans une section chacun de [backend.md](docs/02-technique/backend.md) ; un fichier par module viendra avec l'API FastAPI |
| `docs/02-technique/interface/<espace>.md` | Les écrans sont décrits dans [interface.md](docs/02-technique/interface.md) |
| `docs/assets/` | Les schémas sont en Mermaid, dans les documents eux-mêmes |
