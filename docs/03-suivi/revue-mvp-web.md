# Revue du MVP web — avant le passage du 25/11, 16 h

> Revue en lecture seule de la plateforme `web/` (landing, connexion, tableau de bord, assistant Nexus), parcourue sur `http://localhost:3100`. Méthode : les trois lentilles du skill founder-board (Offre, Monopole, Produit), appliquées comme des grilles publiées, puis un regard « jury régulateur ». Aucun fichier de code n'a été modifié.

Date : 25/11/2026. Auteur : revue automatisée (agent), à valider par l'équipe.

## Sommaire

1. [Verdict](#1-verdict)
2. [Notes par critère](#2-notes-par-critère)
3. [Les trois lentilles](#3-les-trois-lentilles)
4. [Les 7 corrections les plus rentables](#4-les-7-corrections-les-plus-rentables)
5. [Montrer, ne pas montrer](#5-montrer-ne-pas-montrer)
6. [Script de démo web, 3 minutes](#6-script-de-démo-web-3-minutes)

---

## 1. Verdict

**7,4/10 aujourd'hui, 8,5/10 atteignable avec les corrections 1 à 4 (moins d'une heure de travail).**

Le site fait ce que le Streamlit ne fait pas : il raconte le problème en 10 secondes et donne au jury un parcours de responsable litiges crédible (alerte → raison → décision signée → audit). Son meilleur atout est son honnêteté : les pertes (typologie, GPU peu utilisé, données synthétiques) sont écrites avant qu'on les demande. Ce qui peut le faire tomber : une incohérence d'horloge visible dès l'écran « Aujourd'hui », deux phrases qui surpromettent sur le GPU et le LLM, et un ton de Nexus trop accusateur pour un jury régulateur.

Vote du conseil : **2 « financer sous conditions », 1 « financer »**.

## 2. Notes par critère

| Critère | Note /10 | Justification |
|---|---|---|
| Clarté du message en 10 s | 8,5 | « Chaque plainte est un capteur. » + l'animation qui converge + le panneau « 3 · 2 » : on comprend sans lire. Le mot géant « graphe » en fond n'apporte rien au sens. |
| Crédibilité régulateur | 7,5 | Décision humaine, motif obligatoire, aperçu avant signature, audit, articles BCEAO cités, limite du HMAC écrite. Perdent des points : le ton de Nexus (« l'ont accusé »), l'horloge incohérente, le libellé « 100 % » sans effectif. |
| Honnêteté des chiffres | 7 | Tout vient de `results/`, les pertes sont publiées. Mais : « 100 % après score » sur 5 alertes sans le n ; F1 montant 0,969 de l'extracteur local affichée sans l'avertissement « optimiste par construction » ; la landing promet un Nexus « qui tourne sur le GPU » alors qu'aucun LLM n'est branché. |
| Utilité du dashboard pour un responsable litiges | 7,5 | La liste « À faire maintenant, dans cet ordre » est la bonne idée : elle guide. Les rangées de KPI d'évaluation (rappel, FCFA gelables vs vérité terrain) n'ont pas leur place sur l'écran quotidien d'un opérateur. |
| Risque de « bling » nuisible | 8 | Retenu : pas de logos réels (monogrammes neutres + avertissement), pas d'émoticônes, Three.js au service du récit. Risque résiduel : le marquee des émetteurs réels avec parts de marché, devant Moov ; le défendre comme « marché adressable » à l'oral. |
| Parcours démo 3 min | 7 | Le chemin existe et fonctionne (connexion en un clic, alerte rejouable, décision, Nexus). Il manque un lien direct landing → alerte CMP-01, et l'horloge figée contredit les alertes affichées. |
| Qualité visuelle / exécution | 8,5 | Monde visuel cohérent (indigo, latérite = geler, sauge = rembourser), typographie soignée, états vides présents. |

## 3. Les trois lentilles

### Lentille Offre — 7/10, FINANCER SOUS CONDITIONS
- **Fort** : le résultat rêvé est concret et chiffré (« alerte 13 min au lieu de 29, 920 000 FCFA gelables au lieu de 367 000 »), l'effort client est faible (le texte ne quitte pas l'opérateur, dossier pré-rempli).
- **Ce qui tue** : (1) la probabilité perçue repose sur 5 campagnes synthétiques ; (2) le « 100 % » sans effectif sonne fabriqué ; (3) l'offre pilote (« Huit semaines, deux réseaux ») n'a ni prix ni garantie.
- **Condition** : afficher l'effectif à côté de chaque pourcentage et chiffrer le pilote (même « gratuit, contre 200 réclamations anonymisées »).

### Lentille Monopole — 7/10, FINANCER SOUS CONDITIONS
- **Fort** : l'effet de réseau est montré, pas dit (chaque réseau ajouté augmente le rappel de tous) ; le timing PI-SPI est sur la landing.
- **Ce qui tue** : (1) PI-Reclam peut absorber la fonction — la landing ne le nomme qu'en passant ; (2) aucune trace de distribution (qui signe le premier ?).
- **Condition** : une phrase « nous nous branchons sur PI-Reclam, nous ne le remplaçons pas » visible sur la landing.

### Lentille Produit — 8/10, FINANCER
- **Fort** : une entrée, deux sorties ; la décision humaine est un vrai écran, pas une mention légale ; Nexus guide.
- **Ce qui tue** : (1) l'horloge de démo incohérente casse la confiance au premier écran ; (2) trop de KPI d'évaluation dans l'écran opérationnel.
- **Désaccord à garder** : la lentille Produit veut retirer le marquee des émetteurs (bruit), la lentille Offre veut le garder (preuve de marché). Arbitrage proposé : le garder, il est honnêtement légendé.

## 4. Les 7 corrections les plus rentables

Classées par rapport gain jury / effort.

| # | Fichier | Élément | Correction |
|---|---|---|---|
| 1 | `web/src/lib/data.ts` (`DEMO_NOW`) et `web/src/lib/derive.ts` | L'horloge est figée au mer. 18/11 09:00, mais « Aujourd'hui » liste des alertes du 19, 20 et 22/11 et « Ouvrir la plus urgente » mène à CMP-02 (18/11 09:24), **dans le futur** de l'horloge. | Filtrer `priorityAlerts`, `toQualifyAlerts` et « Dernières alertes » sur `alertAt <= DEMO_NOW`, **ou** avancer `DEMO_NOW` après la dernière alerte (ex. 23/11 18:00) et vérifier que les échéances restent parlantes. Le plus simple pour 16 h : avancer l'horloge. |
| 2 | `web/src/app/page.tsx`, section Nexus | « Branché sur le même modèle open-weight que le pipeline, il tourne sur le GPU de l'établissement. » | Remplacer par : « Prévu pour tourner sur le modèle open-weight du pipeline, sur le GPU de l'établissement. Aujourd'hui, il répond à partir des seuls résultats mesurés. » (aucun `LLM_BASE_URL` n'est configuré). |
| 3 | `web/src/app/page.tsx`, chat d'exemple ; `web/src/lib/nexus.ts` n'est pas concerné | « Alors trois personnes de trois réseaux différents l'ont accusé en 12 minutes avec le même récit. » | Ton régulateur, pas procureur : « Alors c'est à vous de le dire. La règle exige au moins 3 plaignants sur 2 réseaux ; ici, 7 sur 3 en 12 minutes. Je recommande une suspension temporaire des retraits, réversible, et votre décision sera tracée. » |
| 4 | `web/src/app/page.tsx` (Ledger « Précision ») et `web/src/app/tableau-de-bord/preuves/page.tsx` | « 100 % après score » sans effectif. | Écrire « 5 sur 5 alertes prioritaires (100 %) » et, en note, « score réglé sur ce même corpus : à revalider sur données réelles » (cf. DECISIONS.md du 22/11, recalibrage du score). |
| 5 | `web/src/app/tableau-de-bord/preuves/page.tsx`, tableau « Extraction des champs » | La colonne « Local » (0,969 sur le montant) est présentée comme une performance. | Renommer la colonne « Repli local* » et ajouter sous le tableau : « *écrit en connaissant les gabarits du générateur : F1 optimiste par construction. La cible est le LLM, non mesuré. » |
| 6 | `web/src/app/page.tsx`, légende sous les deux bulles | « Deux plaintes réelles du corpus synthétique » : contradiction dans les termes. | « Deux plaintes du corpus synthétique, reproduites telles qu'écrites. » |
| 7 | `web/src/app/page.tsx` (section « Le problème » ou « Fonctionnement ») | PI-Reclam, le concurrent le plus dangereux, n'est pas positionné. | Ajouter une phrase : « PI-Reclam transporte les réclamations entre participants. Réclam'Graph est la couche d'analyse qui s'y branche. » |

À noter hors top 7 : le tableau de bord « Aujourd'hui » mélange KPI d'évaluation et KPI opérationnels ; après le jury, déplacer « Campagnes détectées » et « FCFA gelables vs opérateur seul » vers « Preuves » et mettre à la place « alertes en attente de décision » et « dossiers hors délai ». Variable `typo` morte dans la branche par défaut de `groundedAnswer` (`web/src/lib/nexus.ts`).

## 5. Montrer, ne pas montrer

| Montrer | Ne pas montrer |
|---|---|
| Le hero en entier une fois (l'animation fait le pitch en 10 s) | Le scroll complet de la landing : le jury n'a pas 3 minutes pour lire |
| Les deux bulles « Deux récits. Les mêmes mots. » | Le marquee des émetteurs commenté à l'oral comme des clients |
| L'entrée en un clic par un compte de démonstration | La saisie d'un e-mail et d'un mot de passe en direct |
| L'alerte CMP-01 : graphe rejoué, seuil franchi, courbe des FCFA | Les alertes du 19-22/11 tant que l'horloge n'est pas corrigée |
| La décision avec motif, aperçu, signature, puis la page Audit | Le tableau JSON ISO 20022 déplié (illisible à distance) |
| Nexus : « Par quoi je commence ? » puis « Et si on gèle un innocent ? » | Une question libre improvisée à Nexus (moteur ancré, réponses par mots-clés) |
| La bannière honnête de la page Preuves si le jury demande « où est le GPU ? » | La page Preuves en démo principale : elle se défend en questions |

## 6. Script de démo web, 3 minutes

Prérequis : serveur lancé, onglet landing ouvert, navigateur en plein écran, `localStorage` vidé (bouton « Réinitialiser la démo » sur la page Audit), correction 1 appliquée.

| Temps | Écran | Geste | Phrase |
|---|---|---|---|
| 0:00 – 0:20 | Landing, hero | Rien : laisser l'animation converger | « Mardi, 14 h 02. Sept victimes sur trois réseaux envoient de l'argent au même compte. Chaque opérateur ne voit que ses propres plaintes. Regardez le compteur : au troisième plaignant du deuxième réseau, le compte s'allume. » |
| 0:20 – 0:40 | Landing, « Deux récits » | Scroll jusqu'aux deux bulles | « À gauche Aïcha, victime d'une campagne. À droite, une vraie erreur. Mêmes mots. Sur 1 330 plaintes ambiguës, aucun moteur de lecture ne fait mieux qu'une réponse au hasard. Le signal est dans le croisement. » |
| 0:40 – 0:55 | Connexion | « Ouvrir la démo », puis « Entrer » sur Aminata Diallo | « Je suis responsable litiges chez un opérateur. » |
| 0:55 – 1:15 | Aujourd'hui | Montrer la liste numérotée | « Le tableau de bord me dit quoi faire, dans l'ordre : décider sur les alertes, tenir les échéances J+3, qualifier le reste. » |
| 1:15 – 1:50 | Alerte CMP-01 | « Rejouer la convergence », puis montrer la courbe | « 7 plaignants, 3 réseaux, alerte en 12 minutes, avant le premier retrait. L'opérateur seul aurait alerté à 14 h 52, et il n'héberge pas le compte. 162 000 FCFA encore gelables. » |
| 1:50 – 2:20 | Décision | « Recommander la suspension », motif, « Vérifier », « Confirmer et signer » | « Réclam'Graph ne gèle rien. Je décide, j'écris pourquoi, je signe. C'est ce que demande l'article 30 de l'instruction BCEAO : la traçabilité. » |
| 2:20 – 2:45 | Nexus | « Par quoi je commence ? » | « Nexus a vu ma décision : il passe à l'alerte suivante, puis aux échéances. Il ne répond qu'à partir des mesures. » |
| 2:45 – 3:00 | Landing, section Preuves (ou onglet déjà ouvert) | Montrer le tableau | « 5 campagnes sur 5 contre 3, 13 minutes contre 29, 920 000 FCFA contre 367 000. Données synthétiques, générateur publié. Ce que nous voulons : un pilote de 8 semaines sur vos réclamations anonymisées. » |

Plan B si le navigateur ou le WebGL échoue : enchaîner directement sur `/connexion` (pas de Three.js) ; si le serveur tombe, la démo Streamlit (`make demo`) reste la référence.
