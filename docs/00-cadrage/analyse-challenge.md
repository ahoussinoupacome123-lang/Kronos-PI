# Analyse du challenge et du dossier

> Lecture croisée des trois documents de cadrage (programme officiel du GPU Challenge 2026, rapport stratégique « IDEA », dossier Token Titans « Réclam'Graph ») face à ce que le jury va évaluer. Objectif : savoir ce qui gagne, ce qui peut faire perdre, et ce qu'il faut préparer.
> Mise à jour : 25/11/2026.

## Sommaire

1. [Le challenge en faits](#1-le-challenge-en-faits)
2. [Qui juge et ce qu'il cherche](#2-qui-juge-et-ce-quil-cherche)
3. [Les trois documents](#3-les-trois-documents)
4. [Grille d'évaluation implicite](#4-grille-dévaluation-implicite)
5. [Ce qui est fort](#5-ce-qui-est-fort)
6. [Ce qui est fragile](#6-ce-qui-est-fragile)
7. [Questions que le jury posera](#7-questions-que-le-jury-posera)
8. [Recommandations pour le passage](#8-recommandations-pour-le-passage)

---

## 1. Le challenge en faits

| Élément | Valeur | Source |
|---|---|---|
| Organisateurs | Epitech Bénin, UDU Technologies, Alliance Fintech UEMOA, dans le cadre du Next Fintech Forum 2026, avec le soutien de Payfonte | Programme, pied de page |
| Lieu | Epitech Bénin, Cotonou | Programme |
| Thème imposé à l'équipe 12 | Analyse intelligente des réclamations clients | Dossier Token Titans |
| Dépôt des livrables | 25/11, 12 h 00 au plus tard, formulaire Microsoft Forms | Programme |
| Demi-finale (25/11) | 12 équipes, 6 qualifiées. Test technique de 10 min le matin (équipe 12 vers 11 h 20). Passages 13 h–16 h 15 ; **équipe 12 en dernier** (créneau 15 h 15–16 h 15) | Programme |
| Format demi-finale | **13 min chronométrées : 5 min pitch, 3 min démonstration, 5 min questions** | Programme |
| Contenu attendu du pitch | « Le besoin, l'utilisateur visé et votre solution » | Programme |
| Contenu attendu de la démo | « Le prototype et vos résultats face à votre référence » | Programme |
| Finale (26/11) | Tests techniques 07 h 45, finale 14 h 00, **15 min : 5 pitch, 3 démo, 7 questions** | Programme |
| Contexte de la finale | Matinée Fintech Academia : keynote IA et finance UEMOA, panel « paiements, fraude, données et régulation », session Africa GPU Hub et Payfonte « du prototype d'IA au pilote avec une fintech » | Programme |

**Lecture** : le programme dit explicitement ce qui est noté. Trois blocs (besoin/utilisateur/solution, prototype, résultats **face à une référence**) et un échange. Le panel du 26/11 porte exactement sur le terrain de Réclam'Graph (paiements, fraude, données, régulation) : c'est un alignement à exploiter dans la finale.

Passer en dernier (équipe 12) a deux effets : le jury aura vu 11 projets, dont plusieurs sur le même thème (« détection de pics de plaintes + chatbot » est l'idée par défaut) ; et il sera fatigué. Il faut une première phrase qui différencie en 10 secondes.

## 2. Qui juge et ce qu'il cherche

| Acteur | Ce qui le fait réagir | Ce qui le fait décrocher |
|---|---|---|
| **Alliance Fintech UEMOA** (association de fintechs, régulation) | Un problème propre à l'UEMOA, la conformité BCEAO, la confiance dans le mobile money | Une solution transposable telle quelle en Europe ; un discours qui ignore le régulateur |
| **Payfonte** (agrégateur de paiements) | Un pilote possible, les litiges marchands, un modèle économique | Un projet sans client identifiable ; des coûts non chiffrés |
| **Epitech / UDU Technologies** (technique) | Un prototype qui tourne, des mesures honnêtes, l'usage réel du GPU | Une démo qui plante ; des chiffres annoncés sans mesure ; un GPU décoratif |
| **Africa GPU Hub** (session du 26/11) | La justification du calcul local sur GPU | « On aurait pu tout faire sur CPU » |

## 3. Les trois documents

| Document | Rôle | Apport |
|---|---|---|
| **Programme et ordre de passage** | Règles du jeu | Format chronométré, critères explicites, ordre de passage |
| **IDEA** (rapport stratégique) | Pivot | Démontre que l'idée initiale Réclam'Radar (radar de pics + agent LLM + voix) est un produit de commodité (note ~4/10) et propose Réclam'Graph (~7/10) |
| **Token Titans — Réclam'Graph** (16 pages) | Dossier de référence | Problème chiffré (BCEAO), cadre réglementaire, benchmark, 8 angles évalués, solution, architecture, protocole de preuve, conseil Hormozi/Thiel/Jobs, modèle économique, risques, plan d'exécution |

Les deux documents stratégiques racontent la même chose ; le dossier Token Titans est la version complète. Les points structurants :

1. **Le nœud du problème** : la réclamation la plus fréquente (« j'ai envoyé au mauvais numéro ») et la fraude la plus fréquente (« je me suis trompé, renvoyez-moi l'argent ») utilisent le même récit. Un opérateur seul ne peut pas les distinguer quand le bénéficiaire est sur un autre réseau.
2. **Pourquoi maintenant** : PI-SPI (30/09/2025) rend le paiement irrévocable et interopérable ; 175 institutions connectées un an après ; règle du 2/11/2026 (sources secondaires) qui fait passer la monnaie électronique interopérable par PI-SPI.
3. **Le vide** : l'analyse mono-entreprise est couverte (Chattermill, Thematic, Intercom Fin) à des prix de l'ordre du coût humain local ; PI-Reclam est un tuyau ; personne ne tire le signal mule du texte des réclamations entre émetteurs de l'UEMOA.
4. **Le protocole de preuve** : référence = opérateur seul avec tri par mots-clés ; métriques = rappel des campagnes, délai de détection, FCFA gelables, F1 d'extraction, coût pour 1 000 réclamations.
5. **Le principe non négociable** : recommander et documenter, ne jamais geler seul.

## 4. Grille d'évaluation implicite

Grille reconstituée à partir du programme et du profil du jury, avec l'état du projet au 25/11 midi.

| Critère | Poids estimé | Ce que le jury veut voir | État Réclam'Graph |
|---|---|---|---|
| Besoin | Élevé | Un problème réel, chiffré, propre à l'UEMOA | **Fort** : 2,65 M réclamations/semestre, fraude d'ingénierie sociale, PI-SPI irrévocable |
| Utilisateur | Moyen | Une personne précise qui paie ou utilise | **Fort** : responsable litiges et fraude d'une EME, équipe PI-Reclam |
| Solution | Élevé | Différenciation nette, faisabilité | **Fort** : une entrée, deux sorties ; effet de réseau |
| Prototype | Élevé | Ça tourne devant le jury | **Bon** : mode démo pré-calculé, Streamlit ; plateforme web en cours |
| Résultats face à la référence | Élevé | Un écart mesuré, honnête | **Fort sur les mules** (100 % contre 60 %, 13 min contre 29, 920 000 contre 367 000 FCFA) ; **faible sur le GPU** (voir §6) |
| Usage du GPU | Moyen (c'est un *GPU* Challenge) | Une charge qui justifie le GPU, mesurée | **Fragile** : exécution en repli CPU, débit LLM non mesuré |
| Questions | Élevé | Réponses courtes, appuyées par un fait | **Préparé** : 4 questions types dans le dossier, section 11 |

## 5. Ce qui est fort

1. **Un argument qui ne dépend pas du modèle** : le sous-corpus ambigu (1 330 plaintes) montre qu'aucun moteur de lecture de texte ne dépasse la classe majoritaire. Le signal est dans le croisement. C'est une démonstration rare dans un hackathon.
2. **Honnêteté méthodologique** : la référence supervisée qui bat l'extracteur sur la typologie est publiée ; leurres injectés ; faux positif du radar non masqué ; deux F1 publiées par champ. Devant un jury technique, c'est un avantage décisif.
3. **Ancrage réglementaire précis** : art. 18, 30, 35 de l'Instruction 008-05-2015, Circulaire 002-2020/CB/C, PI-SPI, PI-Reclam. Le jury Alliance Fintech reconnaîtra son propre langage.
4. **Réponse au risque principal (gel à tort)** intégrée au produit : décision humaine, seuils visibles, audit.
5. **Reproductibilité** : `make all`, générateur déterministe, 112 tests.

## 6. Ce qui est fragile

| # | Fragilité | Gravité | Parade |
|---|---|---|---|
| F1 | **Le « GPU run » n'a pas utilisé le GPU** pour l'extraction ni les embeddings du pipeline (repli `heuristic-fallback` + `tfidf-svd`, GPU moyen 4,58 %). Un membre du jury technique qui lit `results/` le verra | Critique | Relancer `make pipeline-llm` + `make bench-llm` sur la T4 avant 16 h ; à défaut, renommer l'étiquette et le dire : « le GPU sert à X, mesuré à Y » (bge-m3 CUDA mesuré dans `embed_bench`) |
| F2 | Coût d'inférence locale « non calculé » alors que l'argument GPU du dossier repose dessus | Majeure | Découle de F1 ; sinon ne pas citer d'argument coût GPU |
| F3 | L'API cloud mesurée (70,68 FCFA / 1 000 réclamations) est **moins chère** que l'humain d'un facteur ~3 800 : l'argument « seule l'inférence locale rend l'automatisation rentable » du dossier ne tient plus | Majeure | Pivoter l'argument GPU vers la **souveraineté et le partage minimal** (le texte ne quitte pas l'opérateur, pas d'envoi à un fournisseur hors zone) et vers le débit |
| F4 | Partage de données entre concurrents : base légale non vérifiée (APDP, BCEAO) | Majeure | HMAC aujourd'hui, PSI ou hub tiers de confiance demain ; consultation APDP avant pilote |
| F5 | 5 campagnes seulement : un rappel de 100 % sur 5 cas a une incertitude large | Moyenne | Le dire avant qu'on le dise ; annoncer la prochaine étape (200 réclamations réelles anonymisées) |
| F6 | Précision brute de 42 % | Moyenne | Montrer qu'elle passe à 100 % après score, et que les alertes sous le seuil restent « à qualifier » |
| F7 | Aucune lettre d'intérêt d'un opérateur | Moyenne | Chercher un « on testerait » pendant le déjeuner du 26/11 (rencontres avec les professionnels) |
| F8 | Marché petit (SOM 0,1–0,25 M$ ARR) | Faible pour un jury fintech | Positionner sur la confiance et la conformité, extension GIMACPAY |

## 7. Questions que le jury posera

| Question | Réponse en 20 secondes | Fait d'appui |
|---|---|---|
| « Les opérateurs concurrents ne partageront jamais. » | Rien de brut ne sort : un alias haché, un montant arrondi, une typologie. En production, PSI ou hub tiers (BCEAO, Alliance Fintech). | La BCEAO opère déjà une plateforme de déclaration d'incidents |
| « Et si vous gelez un innocent ? » | Nous ne gelons rien. 3 plaignants, 2 réseaux, 60 min ; score ; décision humaine tracée. | Règle visible dans la démo ; leurres légitimes dans le jeu |
| « La BCEAO le fera dans PI-Reclam. » | PI-Reclam est le tuyau ; nous sommes la couche d'intelligence qui s'y branche. Intégration ou rachat, pas éviction. | Aucune analyse publique connue dans PI-Reclam |
| « Vos données sont synthétiques. » | Annoncé d'entrée, générateur et vérité terrain publiés ; prochaine étape : pilote sur historique anonymisé. | `data/ground_truth.json`, `make data` |
| « Où est le GPU ? » | Voir F1 : la réponse doit être un chiffre mesuré (réclamations/s du LLM sur T4, utilisation GPU pendant le run). | `results/gpu_log.txt`, `benchmark.json` |
| « Pourquoi pas une API cloud ? » | Elle coûte peu, mais le texte des plaintes contient des données personnelles qui ne doivent pas quitter l'opérateur ni la zone ; le modèle local tourne chez l'opérateur. | 24 % des fournisseurs gênés par les transferts transfrontaliers (GSMA 2026) |
| « Quel modèle économique ? » | Forfait par opérateur ou 5 FCFA par réclamation (hypothèse), pilote de 8 semaines. | Dossier, section 10 |

## 8. Recommandations pour le passage

1. **Ouvrir sur Aïcha** (14 h 02, 25 000 FCFA) puis la phrase : « Ce n'est pas un problème de modèle, c'est un problème de périmètre. »
2. **Démo de 3 minutes en mode démo pré-calculé**, jamais en direct sur le GPU ; vidéo de secours prête.
3. **Un seul tableau de résultats** : opérateur seul contre consortium (rappel, délai, FCFA gelables).
4. **Traiter le GPU avec un chiffre mesuré** ou ne pas en faire un argument.
5. **Montrer la plateforme web** comme le produit que verrait le responsable litiges : l'alerte, le dossier, le minuteur, l'audit, et l'assistant Nexus qui explique le graphe.
6. **Terminer sur la demande** : un pilote de 8 semaines avec un opérateur du forum.
