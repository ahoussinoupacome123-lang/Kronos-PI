# Réclam'Graph — plateforme web

Landing, connexion, tableau de bord guidé et assistant **Nexus**, branchés sur les résultats mesurés du pipeline Python (`../results/`).

## Lancer

```bash
cd web
npm install
cp .env.example .env.local   # puis remplir AUTH_SECRET
npm run sync                 # recopie ../results -> src/data/demo.json (après chaque make all)
npm run dev                  # http://localhost:3000
```

Entrée en démo : `/connexion`, bouton « Entrer » d'un des quatre comptes fictifs. Un compte personnel s'ajoute sans être publié (`DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD_HASH` dans `.env.local`, hachage via `npm run hash -- "<mot de passe>"`).

## Routes

| Route | Rôle |
|---|---|
| `/` | Accueil : écran de téléphone qui rejoue la campagne CMP-01, émetteurs visés, preuves mesurées, fonctionnement fixé au défilement, confidentialité (GSAP, Lenis) |
| `/connexion` | Connexion, comptes de démonstration |
| `/tableau-de-bord` | « Aujourd'hui » : actions à faire dans l'ordre, indicateurs mesurés |
| `/tableau-de-bord/alertes` · `/[id]` | Alertes du consortium, graphe rejouable, décision humaine signée |
| `/tableau-de-bord/dossiers` | Dossiers de litige, échéances J+3, J+30, PI-Reclam |
| `/tableau-de-bord/incidents` | Radar d'incidents |
| `/tableau-de-bord/preuves` | Résultats face à la référence, preuve GPU |
| `/tableau-de-bord/audit` | Journal du pipeline et décisions de la session |
| `/cgu` · `/confidentialite` · `/mentions-legales` | Documents juridiques (`content/legal/*.md`) |
| `POST /api/nexus` | Assistant : LLM local si `LLM_BASE_URL`, sinon réponses ancrées |

## Règles

- Aucun chiffre écrit en dur : tout vient de `src/data/demo.json`, produit par `npm run sync`.
- Données synthétiques, opérateurs fictifs. Les émetteurs réels de la landing sont présentés comme marché adressable, avec des monogrammes neutres, jamais comme clients.
- Réclam'Graph recommande ; toute décision exige un motif écrit et une confirmation.
