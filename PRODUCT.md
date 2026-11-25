# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Jury du GPU Challenge 2026** (Alliance Fintech UEMOA, Payfonte, opérateurs comme Moov, Epitech Bénin) : priorité du 25 et du 26/11/2026. Il juge le besoin, l'utilisateur, la solution, le prototype et les résultats face à une référence, en 13 puis 15 minutes.
- **Responsable litiges et fraude d'un établissement de monnaie électronique ou d'une banque participant à PI-SPI** : utilisateur du produit. Il doit tenir les délais (J+3 ouvrés, J+30), récupérer les fonds et éviter les pénalités.
- Secondaires : agents du centre de contact (dossier pré-rempli), supervision du consortium ou régulateur (vue consolidée).

## Product Purpose

Croiser les réclamations clients de plusieurs émetteurs de l'UEMOA pour démasquer les comptes mules avant le retrait en espèces, et transformer chaque plainte légitime en dossier de litige PI-SPI minuté. Succès : l'argent est gelé avant le cash-out, la vraie erreur est remboursée dans les délais, chaque décision est tracée.

## Positioning

Un opérateur seul est aveugle par construction : la victime est chez lui, la mule chez un concurrent, et PI-SPI rend le transfert irrévocable. Le produit tire le signal « mule » du texte des réclamations croisé entre émetteurs, sans que le texte quitte l'opérateur (alias haché HMAC). Formule exacte : « nouveau dans la zone et par la source du signal », jamais « inédit au monde ».

## Operating Context

Salle de veille fraude et centre de contact d'un émetteur, à Cotonou, Lomé, Dakar ou Abidjan, en journée. Réclamations par SMS, application, agence ou appel, en français local bruité. Cadre : Instruction BCEAO 008-05-2015 (art. 30 et 35), Circulaire 002-2020/CB/C, PI-SPI et PI-Reclam.

## Capabilities and Constraints

- Pipeline Python mesuré (`src/`, `results/`) : extraction, pseudonymisation, hub graphe (règle 3 plaignants, 2 réseaux, 60 min), radar d'incidents, dossiers, minuteur, audit chaîné.
- Plateforme web (`web/`) en mode démo : lit `results/` via `npm run sync`, aucun chiffre écrit en dur.
- Assistant **Nexus** : répond à partir des mesures ; LLM local optionnel.
- Le produit recommande, il ne gèle jamais seul : toute décision exige un motif et une confirmation.
- Non mesuré à ce jour : débit et F1 du LLM, coût local sur GPU (le run publié a utilisé le repli CPU).
- Nom commercial : **en cours de choix** (souhait : court, ludique, fintech, dans l'esprit « X-Link ») ; centralisé dans `web/src/lib/brand.ts`. Livrables du challenge déposés sous « Réclam'Graph ».

## Brand Commitments

- Références visuelles imposées par Joachim : landing inspirée d'Evalis (toeic-building.vercel.app) ; tableau de bord inspiré d'une maquette type GeneX (clair, aéré, barre latérale marine, cartes douces, visuel 3D).
- Pas d'émoticônes : SVG dessinés ou 3D uniquement. Pas d'images générées (décision du 25/11).
- Ton : direct, concret, chiffré en FCFA, honnête sur les limites.

## Evidence on Hand

- `results/benchmark.json`, `results/demo_bundle.json` : corpus synthétique de 20 000 réclamations, 3 opérateurs fictifs (ALPHAMONEY, BETACASH, GAMMAPAY), 5 campagnes de mules.
- Faits BCEAO sourcés dans `docs/00-cadrage/analyse-challenge.md`.
- Aucun client, partenaire, témoignage ni prix réel : ne jamais en inventer. Les prix du modèle économique sont des hypothèses et doivent être étiquetés comme tels.

## Product Principles

1. Prouver plutôt qu'affirmer : chaque chiffre vient d'une mesure, ou porte l'étiquette « estimation » ou « hypothèse ».
2. La décision reste humaine, visible et tracée.
3. Le minimum de données sort de chez l'opérateur.
4. Le tableau de bord dit quoi faire ensuite, dans l'ordre d'urgence.

## Accessibility & Inclusion

Contraste AA, navigation au clavier, `prefers-reduced-motion` respecté, interface lisible sur téléphone (agents en agence).
