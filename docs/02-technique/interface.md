# Interfaces

> Les deux interfaces de Réclam'Graph : la **plateforme web** Next.js (`web/`, vitrine produit et tableau de bord par rôle, avec l'assistant Nexus) et l'**interface Streamlit** (`app/dashboard.py`, démo technique de secours). Les deux lisent les mêmes résultats (`results/`).
> Mise à jour : 25/11/2026.

## Sommaire

1. [Plateforme web](#1-plateforme-web)
2. [Assistant Nexus](#2-assistant-nexus)
3. [Design system](#3-design-system)
4. [Interface Streamlit](#4-interface-streamlit)

---

## 1. Plateforme web

### 1.1 Structure

| Élément | Choix |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Protection des routes | `proxy.ts` (Next.js 16) : toute route `/tableau-de-bord/*` exige une session |
| Session | JWT HS256 signé (`jose`) dans un cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production ; secret `AUTH_SECRET` dans `web/.env.local` |
| Données | Lecture serveur de `results/` (mode démo) ; API FastAPI en cible ([api.md](../01-general/api.md)) |
| Textes juridiques | Markdown dans `web/content/legal/`, rendus par `react-markdown` |
| Comptes de démo | `web/src/lib/demo-accounts.ts` (un par rôle) |

### 1.2 Routes

| Route | Accès | Rôle |
|---|---|---|
| `/` | Public | Accueil (DA claire, vert lime) : photo dont l'écran de téléphone rejoue la campagne CMP-01, logos des émetteurs visés, deux plaintes ambiguës du corpus, fonctionnement en quatre temps fixé au défilement, preuves mesurées en grille, responsable litiges et dossier minuté, confidentialité, appel au pilote. Composants dans `web/src/components/accueil/`, chiffres dans `web/src/lib/accueil.ts` |
| `/connexion` | Public | Connexion professionnelle, comptes de démonstration |
| `/tableau-de-bord` | Connecté | Vue d'ensemble : ce qui demande une décision maintenant, indicateurs clés face à la référence |
| `/tableau-de-bord/alertes` | Connecté | Alertes mules : prioritaires, à qualifier ; preuves, montant gelable, opérateurs à prévenir |
| `/tableau-de-bord/dossiers` | Connecté | Dossiers de litige, minuteurs J+3 / J+30, urgence |
| `/tableau-de-bord/graphe` | Connecté | Graphe plaignants / bénéficiaires / opérateurs |
| `/tableau-de-bord/incidents` | Connecté | Radar d'incidents |
| `/tableau-de-bord/preuves` | Connecté | Résultats face à la référence, coûts, GPU, avec étiquettes de mesure |
| `/tableau-de-bord/audit` | Connecté | Journal chaîné et vérification |
| `/cgu` | Public | Conditions générales d'utilisation |
| `/confidentialite` | Public | Politique de confidentialité |

Les sous-routes exactes du tableau de bord suivent l'implémentation de `web/src/app/` ; mettre ce tableau à jour à chaque ajout.

### 1.3 Principes d'expérience

| Principe | Application |
|---|---|
| Le tableau de bord guide | La première carte dit quoi faire maintenant (alerte prioritaire, dossier qui expire) ; chaque écran se termine par l'action suivante |
| Une entrée, deux sorties | Toute réclamation mène visiblement à GELER (recommandation) ou REMBOURSER (dossier) |
| Décision humaine visible | Aucun bouton « geler » automatique ; libellés « recommander », « valider » ; rappel de la règle 3/2/60 |
| Chiffres étiquetés | Chaque chiffre porte sa nature (mesuré, estimation, prix public, hypothèse) et rappelle « données synthétiques » |
| Pas d'emoji | Icônes et illustrations en SVG |
| Le consortium se voit | L'accueil du tableau de bord montre le réacteur du consortium (`ConsortiumHub`) : KronosPI au centre, un conduit par réseau, les plaintes entrent (couleur du réseau), l'alerte repart (lime). Le graphe d'une alerte (`AlertGraph`) reprend ce langage et reste rejouable plainte par plainte. Animations coupées si `prefers-reduced-motion` |

## 2. Assistant Nexus

| Élément | Description |
|---|---|
| Nom | **Nexus** — l'intelligence qui relie chaque EME aux autres à travers le graphe |
| Présence | Panneau accessible depuis tout le tableau de bord |
| Rôle | Guider l'utilisateur vers la prochaine action, expliquer une alerte (quels plaignants, quels réseaux, quel seuil), résumer un dossier, rappeler les délais, expliquer les métriques |
| Sources | Les données du tableau de bord (`results/`) ; chaque réponse cite ce qu'elle utilise |
| Limites | Ne gèle rien, ne valide rien ; propose un lien vers l'action ; rappelle que les données sont synthétiques |
| Cible (P1) | Réponses générées par le LLM local (même serveur vLLM), ancrées par RAG sur les données de l'utilisateur, endpoint `/assistant` |

## 3. Design system

| Élément | Règle |
|---|---|
| Ton | Fintech de confiance : sobre, précis, chiffres au premier plan |
| Couleurs | Une seule palette (DA vert lime) dans `web/src/app/globals.css`. Les noms historiques (`ink`, `paper`, `laterite`, `sage`…) gardent leur rôle : nuit vert-anthracite pour la barre latérale, rouge = geler, vert = rembourser, ambre = échéance proche. Réseaux fictifs : `reseau-a/b/c`, mêmes couleurs partout. Aucune couleur écrite en dur dans les composants |
| Icônes | Tableau de bord : SVG en ligne (`components/ui/icons.tsx`). Accueil : bibliothèque Lucide (`lucide-react`) |
| Accessibilité | Contraste AA, navigation clavier, `prefers-reduced-motion` respecté : animations GSAP déclarées sous `gsap.matchMedia`, défilement fluide coupé |
| Responsive | Mobile, tablette, bureau |
| EME du consortium | Données et alertes : opérateurs **fictifs** uniquement (ALPHAMONEY, BETACASH, GAMMAPAY). Logos officiels des émetteurs réels (`web/public/visuels/emetteurs/`, sources : Wikimedia Commons et sites officiels) : uniquement dans la bande « marché visé » de l'accueil, jamais présentés comme clients ni associés à une fraude |
| Visuels | `web/public/visuels/` : photos (héros, responsable fraude, agente au kiosque), fond, série d'objets 3D (PNG transparents : téléphone, bouclier, réseau, dossier, sablier, billets, carte UEMOA, bulles, puce GPU, cible, clé). Produits pour le projet par l'équipe ; photos en JPEG, objets limités à 900 px. Connexion : photo de la responsable fraude et alerte prioritaire réelle. Tableau de bord : `PageHead` accepte un `objet` 3D par page |
| Mobile | Toute grille responsive déclare `grid-cols-1` par défaut ; l'accueil rogne l'horizontal (`overflow-x: clip`) pour que les animations venues des côtés n'élargissent jamais la page. Vérifié : aucune page ne dépasse 390 px de large |

## 4. Interface Streamlit

`app/dashboard.py` (1 400 lignes), lancée par `make demo` (mode démo) ou `make demo-live`.

| Onglet | Contenu |
|---|---|
| Testez vous-même | Écrire une plainte, voir l'extraction et la chaîne réagir |
| 1 · L'histoire d'Aïcha | Cas d'ouverture de la démo (CMP-01) |
| 2 · Seul ou ensemble ? | Opérateur seul contre consortium |
| 3 · Qui est relié à qui | Graphe animé |
| 4 · Le dossier auto-rempli | Dossier de litige et minuteur |
| 5 · Les pannes en direct | Radar d'incidents |
| 6 · Les preuves chiffrées | Benchmark, coûts, GPU |
| 7 · Et la vie privée ? | Ce qui sort, ce qui ne sort pas |

Rôle : démo technique et secours si la plateforme web ne démarre pas. À terme, la plateforme web la remplace pour l'usage métier.
