# DECISIONS.md — journal des decisions (une ligne par decision)

Format : `AAAA-MM-JJ HH:MM — decision — raison`.
Regle du brief : en cas de doute, decider, consigner ici en une ligne, continuer.

- 2026-11-14 09:05 — Depot initialise avec la structure de la section 14 du brief — permettre les 4 pistes (donnees / LLM / graphe / demo) en parallele.
- 2026-11-14 09:20 — Operateurs synthetiques fictifs (ALPHAMONEY, BETACASH, GAMMAPAY) plutot que les noms reels — les donnees sont synthetiques, nommer de vrais operateurs sur des fraudes inventees serait une fausse archive ; la correspondance narrative est indiquee dans PITCH.md.
- 2026-11-14 09:40 — Un seul client OpenAI-compatible (`LLM_BASE_URL`, `LLM_MODEL`) — vLLM et Ollama interchangeables, exigence du brief section 0.
- 2026-11-15 08:30 — Campagnes de mules specifiees explicitement (`datagen/scenarios.py`) plutot que tirees au hasard — le jury doit pouvoir rejouer la demo et retrouver les memes chiffres ; la verite terrain devient auditable ligne a ligne.
- 2026-11-15 11:10 — Deux "leurres" (grappes legitimes qui declenchent la regle 3/2/60) injectes volontairement — sans eux la precision mesuree serait un 1.00 fabrique ; ils justifient aussi la decision humaine.
- 2026-11-15 14:05 — `freezable(t) = total_campagne - deja_retire(t)` — metrique monotone decroissante : alerter plus tot sauve toujours plus. Mesurer le simple solde a l'instant t recompenserait une alerte tardive, ce qui serait un biais.
- 2026-11-15 16:40 — Les identifiants (alias, MSISDN, reference) sont preserves du bruitage caractere a caractere — les bruiter casserait la jointure inter-operateurs au lieu de tester l'extraction.
- 2026-11-15 17:20 — Ajout d'un annuaire d'alias PI-SPI simule (numero -> alias) — certaines plaintes citent le numero et non l'alias ; PI-SPI fournit justement cette resolution, et sans elle deux plaintes visant la meme mule ne se joindraient pas.
