# Documentation de Réclam'Graph

Index de toute la documentation. Point d'entrée commun : [context.md](../context.md).

| Dossier | Document | Pour qui, pour quoi |
|---|---|---|
| **00-cadrage** | [analyse-challenge.md](00-cadrage/analyse-challenge.md) | Ce que demande le GPU Challenge 2026, comment le jury lira le projet, ce qui est fort et fragile |
| | [analyse-depot.md](00-cadrage/analyse-depot.md) | Audit du dépôt existant, risques classés, marche à suivre GPU, ordre idéal des chantiers |
| | [cahier-des-charges.md](00-cadrage/cahier-des-charges.md) | Exigences fonctionnelles et non fonctionnelles, métriques cibles, choix techniques, critères d'acceptation |
| | [roadmap.md](00-cadrage/roadmap.md) | Du passage du 25/11 au branchement sur PI-Reclam (18 mois) |
| **01-general** | [architecture.md](01-general/architecture.md) | Composants, flux, frontière de confiance, schémas |
| | [stack-technique.md](01-general/stack-technique.md) | Langages, bibliothèques, versions, justifications |
| | [demarrage.md](01-general/demarrage.md) | Installer et lancer le pipeline, la démo Streamlit et la plateforme web |
| | [api.md](01-general/api.md) | Contrat cible de l'API FastAPI entre le pipeline et la plateforme web |
| **02-technique** | [backend.md](02-technique/backend.md) | Chaque module de `src/reclam_graph/` |
| | [interface.md](02-technique/interface.md) | Plateforme web (`web/`) et interface Streamlit (`app/`) |
| **03-suivi** | [suivi-cahier-des-charges.md](03-suivi/suivi-cahier-des-charges.md) | Avancement par exigence |
| | [anomalies.md](03-suivi/anomalies.md) | Registre des anomalies |
| | [revue-conseil-founder.md](03-suivi/revue-conseil-founder.md) | Revue critique du projet (conseil founder) |
| **04-juridique** | [README](04-juridique/) | CGU, confidentialité, analyse des risques juridiques |

Documents historiques à la racine du dépôt (Pacôme) : [README.md](../README.md) (résultats régénérés), [PITCH.md](../PITCH.md), [SUBMISSION.md](../SUBMISSION.md), [DECISIONS.md](../DECISIONS.md).

## Conventions

- Markdown, français, tableaux plutôt que prose.
- Aucun chiffre sans source : `results/` (mesure), ou étiquette « estimation », « hypothèse », « prix public affiché ».
- Aucun secret : valeurs factices, renvoi vers `.env.example`.
- Chaque évolution met à jour, dans la même branche, le document concerné, le [suivi](03-suivi/suivi-cahier-des-charges.md), les [anomalies](03-suivi/anomalies.md) et [context.md](../context.md).
