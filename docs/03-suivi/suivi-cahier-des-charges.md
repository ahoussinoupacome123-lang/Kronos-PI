# Suivi du cahier des charges

> Avancement par exigence du [cahier des charges](../00-cadrage/cahier-des-charges.md). Statuts : `À faire`, `En cours`, `Terminé`, `Bloqué`. Mettre à jour à chaque PR.
> Mise à jour : 25/11/2026, 13 h.

## Tableau de bord

### Par priorité

| Priorité | Exigences | Terminées | En cours | Avancement |
|---|---|---|---|---|
| **P0 — démo challenge** | 34 | 31 | 2 | 91 % |
| P1 — pilote | 17 | 0 | 4 | 0 % |
| P2 — production | 6 | 0 | 0 | 0 % |
| **Global** | **57** | **31** | **6** | **54 %** |

### Par module

| Module | Exigences | Terminées | Avancement |
|---|---|---|---|
| EXT — Extraction | 6 | 3 | 50 % |
| PSE — Pseudonymisation | 6 | 4 | 67 % |
| HUB — Hub de corrélation | 6 | 4 | 67 % |
| RAD — Radar d'incidents | 3 | 1 | 33 % |
| DOS — Dossier de litige | 5 | 3 | 60 % |
| MIN — Minuteur | 4 | 3 | 75 % |
| AUD — Audit | 4 | 2 | 50 % |
| WEB — Plateforme web | 8 | 6 | 75 % (1 en cours) |
| ASSIST — Nexus | 5 | 4 | 80 % |
| API | 4 | 0 | 0 % |
| SEC — Sécurité | 6 | 1 | 17 % |

### Métriques (vérité au 25/11, données synthétiques)

| Métrique | Référence | Mesuré | Cible pilote | Statut |
|---|---|---|---|---|
| Rappel campagnes | 60 % | 100 % | ≥ 80 % | Atteint en synthétique |
| Précision après score | 75 % | 100 % (42 % brute) | ≥ 70 % | Atteint en synthétique |
| Délai médian | 29 min | 13 min | ≤ 15 min | Atteint en synthétique |
| FCFA gelables | 367 000 | 920 000 | — | Mesuré |
| F1 extraction LLM | — | non mesuré | ≥ 0,95 (montant) | **Bloqué par BUG-001** |
| Débit GPU | — | non mesuré | ≥ 50/s | **Bloqué par BUG-001** |
| Coût local / 1 000 | — | non calculé | publié | **Bloqué par BUG-001** |

## Répartition de l'équipe

Décidée le 25/11/2026. Plus aucune modification de code après 14 h 30 le 25/11. Résumé par personne : [context.md, section 6](../../context.md#6-intervenants).

| ID | Tâche | Responsable | Échéance | Statut | Lien avec les exigences |
|---|---|---|---|---|---|
| T-01 | Servir le LLM sur la T4 (`make serve-llm`), puis `make pipeline-llm` et `make bench-llm` | Pacôme | 25/11 14 h | À faire | EXT, BUG-001 |
| T-02 | Mesurer bge-m3 sur le corpus (`make bench-embed`) avec `record_gpu_evidence.sh` en parallèle | Pacôme | 25/11 14 h | Terminé | RAD, preuve GPU |
| T-03 | Corriger BUG-001 : l'étiquette d'exécution nomme le moteur réellement utilisé | Pacôme | 25/11 14 h | Terminé | BUG-001 |
| T-04 | Régénérer `README`, `benchmark.md`, pousser `results/` ; puis `cd web && npm run sync` | Pacôme, Joachim | 25/11 14 h 15 | À faire | WEB-04 |
| T-05 | Vidéo de secours (OBS) du pipeline sur GPU | Pacôme | 25/11 14 h 30 | À faire | — |
| T-06 | Brancher Nexus sur le vLLM (`LLM_BASE_URL`) | Pacôme | 26/11 | À faire | ASSIST-05 |
| T-07 | Vérification mobile de la landing, du tableau de bord et de Nexus (retouches seulement) | Ange Marie | 25/11 14 h 30 | À faire | WEB-01, WEB-03 |
| T-08 | Écran de l'opérateur hôte qui valide la suspension | Ange Marie | 26/11 | À faire | WEB-08 |
| T-09 | Essai d'une réclamation dans le web (écrire une plainte, voir la chaîne réagir) | Ange Marie | 26/11 | À faire | WEB-03 |
| T-10 | Refonte avec le nouveau nom, mode sombre, vues par rôle, export PDF, `DESIGN.md` | Ange Marie | Après le challenge | À faire | WEB-07 |
| T-11 | Corriger `PITCH.md` selon la revue founder | Joachim | 25/11 13 h | À faire | — |
| T-12 | Mettre la plateforme en ligne (adresse de secours) | Joachim | 25/11 14 h | À faire | WEB |
| T-13 | Deux répétitions chronométrées de 13 min, 5 réponses de 20 s | Joachim, équipe | 25/11 16 h | À faire | — |
| T-14 | Visuels et captures du deck | Joachim | 26/11 | À faire | — |
| T-15 | Obtenir un « on serait prêts à tester » de Moov ou Payfonte au forum | Joachim | 26/11 midi | À faire | — |
| T-16 | Trancher le nouveau nom (propositions dans `context.md`) | Joachim | 26/11 | À faire | — |

## EXT — Extraction

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| EXT-01 | Fiche structurée depuis le texte brut | P0 | Terminé | Pacôme | 2026-11-17 | `feat/extraction` | Regex, heuristique et LLM codés |
| EXT-02 | Robustesse au bruit (25mil, nouchi, fautes) | P0 | Terminé | Pacôme | 2026-11-22 | `feat/extraction` | Regex montant corrigée (BUG-004) |
| EXT-03 | JSON guidé, aucune valeur inventée | P0 | En cours | Pacôme | — | `feat/extraction` | Codé ; jamais exécuté sur le GPU (BUG-001) |
| EXT-04 | Moteurs nommés dans chaque sortie | P0 | Terminé | Pacôme | 2026-11-17 | `feat/extraction` | L'étiquette d'exécution, elle, ne suit pas le moteur (BUG-001) |
| EXT-05 | Entrées multicanal, voix française | P1 | En cours | Pacôme | 2026-11-24 | `feat/voice` | Voix FR en bonus, non mesurée |
| EXT-06 | Inférence chez l'opérateur | P1 | À faire | — | — | — | Pilote |

## PSE — Pseudonymisation

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| PSE-01 | HMAC-SHA256 alias et plaignant | P0 | Terminé | Pacôme | 2026-11-16 | `feat/graph-hub` | — |
| PSE-02 | Montant arrondi (pas 5 000 FCFA) | P0 | Terminé | Pacôme | 2026-11-16 | `feat/graph-hub` | Deux vues : hub arrondi, hôte exact |
| PSE-03 | Texte et identité restent chez l'opérateur | P0 | Terminé | Pacôme | 2026-11-16 | `feat/graph-hub` | `SharedRecord` seul objet partagé |
| PSE-04 | Résolution numéro → alias | P0 | Terminé | Pacôme | 2026-11-15 | `feat/datagen` | Annuaire simulé |
| PSE-05 | Rotation de clé, tiers de confiance | P2 | À faire | — | — | — | — |
| PSE-06 | PSI | P2 | À faire | — | — | — | — |

## HUB — Hub de corrélation

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| HUB-01 | Graphe tripartite | P0 | Terminé | Pacôme | 2026-11-16 | `feat/graph-hub` | — |
| HUB-02 | Règle 3/2/60 paramétrable | P0 | Terminé | Pacôme | 2026-11-16 | `feat/graph-hub` | Variables `MULE_*` |
| HUB-03 | Score, « à qualifier » jamais supprimé | P0 | Terminé | Pacôme | 2026-11-22 | `feat/graph-hub` | Score recalibré le 22/11 |
| HUB-04 | Montant gelable, opérateurs à prévenir | P0 | Terminé | Pacôme | 2026-11-16 | `feat/graph-hub` | — |
| HUB-05 | Traitement en flux | P1 | À faire | — | — | — | — |
| HUB-06 | Corrélations complémentaires | P2 | À faire | — | — | — | — |

## RAD — Radar d'incidents

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| RAD-01 | Pics, base saisonnière, seuil ×2 | P0 | Terminé | Pacôme | 2026-11-18 | `feat/radar` | Rappel 100 %, précision 50 % |
| RAD-02 | Regroupement bge-m3 | P0 | Terminé | Pacôme | 2026-11-25 | `feat/radar` | Pipeline exécuté en `bge-m3` sur Tesla T4 (42,36 s) |
| RAD-03 | Diffusion aux participants | P1 | À faire | — | — | — | — |

## DOS — Dossier de litige

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| DOS-01 | Décision GELER / REMBOURSER / A_QUALIFIER | P0 | Terminé | Pacôme | 2026-11-19 | `feat/dossier` | — |
| DOS-02 | Dossier inspiré camt.056 + preuves | P0 | Terminé | Pacôme | 2026-11-19 | `feat/dossier` | Jamais présenté comme certifié |
| DOS-03 | Rappel d'irrévocabilité | P0 | Terminé | Pacôme | 2026-11-19 | `feat/dossier` | — |
| DOS-04 | Validation agent, envoi PI-Reclam | P1 | À faire | — | — | — | Envoi en P2 |
| DOS-05 | Export PDF et JSON | P1 | En cours | — | — | — | JSON fait, PDF à faire |

## MIN — Minuteur

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| MIN-01 | J+3 ouvrés avec fériés | P0 | Terminé | Pacôme | 2026-11-19 | `feat/dossier` | — |
| MIN-02 | J+30 calendaires | P0 | Terminé | Pacôme | 2026-11-19 | `feat/dossier` | — |
| MIN-03 | Échéance PI-Reclam paramétrable | P0 | Terminé | Pacôme | 2026-11-19 | `feat/dossier` | Marquée « non publique » |
| MIN-04 | Alertes avant échéance | P1 | À faire | — | — | — | — |

## AUD — Audit

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| AUD-01 | Journal append-only avec preuves | P0 | Terminé | Pacôme | 2026-11-19 | `feat/dossier` | `results/audit.jsonl` |
| AUD-02 | Chaînage et vérification | P0 | Terminé | Pacôme | 2026-11-19 | `feat/dossier` | Détection d'altération |
| AUD-03 | Ancrage externe | P2 | À faire | — | — | — | — |
| AUD-04 | Export Commission bancaire | P1 | En cours | — | — | — | JSONL disponible, format à définir |

## WEB — Plateforme web

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| WEB-01 | Landing (hero Three.js, EME, preuves, pied de page) | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | — |
| WEB-02 | Connexion, comptes de démo | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | — |
| WEB-03 | Tableau de bord qui guide | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | — |
| WEB-04 | Lecture de `results/` | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | API en P1 |
| WEB-05 | CGU, confidentialité, mentions | P0 | Terminé | agent juridique | 2026-11-25 | PR #1 | `docs/04-juridique` |
| WEB-06 | SVG, sans emoji, accessible | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | — |
| WEB-07 | Rôles et permissions | P1 | À faire | — | — | — | — |
| WEB-08 | Décisions écrites dans l'audit | P1 | En cours | Joachim + agents | 2026-11-25 | PR #1 | Décision signée avec motif, conservée dans le navigateur ; journal serveur en P1 |

## ASSIST — Nexus

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| ASSIST-01 | Nexus présent partout, guide vers l'action | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | — |
| ASSIST-02 | Répond depuis les données, cite la source | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | — |
| ASSIST-03 | Explique le graphe entre EME | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | — |
| ASSIST-04 | Jamais de gel automatique | P0 | Terminé | Joachim + agents | 2026-11-25 | PR #1 | — |
| ASSIST-05 | LLM local + RAG | P1 | À faire | — | — | — | Endpoint `/assistant` |

## API

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| API-01 | FastAPI : complaints, alerts, dossiers, incidents, metrics, assistant | P1 | À faire | — | — | — | Contrat dans [api.md](../01-general/api.md) |
| API-02 | Authentification par jeton | P1 | À faire | — | — | — | — |
| API-03 | Webhooks | P2 | À faire | — | — | — | — |
| API-04 | Connecteur PI-Reclam | P2 | À faire | — | — | — | — |

## SEC — Sécurité

| ID | Exigence | Prio | Statut | Responsable | Date | Branche / PR | Commentaires |
|---|---|---|---|---|---|---|---|
| SEC-01 | Aucun secret dans le dépôt | P0 | Terminé | Pacôme | 2026-11-14 | — | `.env` ignoré ; clé de dev signalée |
| SEC-02 | Sessions signées, cookies sûrs | P0 | En cours | Joachim + agents | 2026-11-25 | PR #1 | `jose`, `HttpOnly` |
| SEC-03 | Cloisonnement par participant | P1 | À faire | — | — | — | — |
| SEC-04 | Chiffrement au repos et en transit | P1 | À faire | — | — | — | — |
| SEC-05 | Journal d'accès, limitation de débit | P1 | À faire | — | — | — | — |
| SEC-06 | Test d'intrusion | P1 | À faire | — | — | — | — |
