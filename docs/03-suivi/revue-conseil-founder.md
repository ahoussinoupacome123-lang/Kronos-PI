# Revue du conseil founder — Réclam'Graph avant la demi-finale

> **Objet.** Juger sans complaisance Réclam'Graph tel qu'il passera devant le jury le **25/11/2026 vers 16 h** (équipe 12 : 5 min de pitch, 3 min de démo, 5 min de questions), puis en finale le 26/11 (15 min : 5 + 3 + 7).
> **Méthode.** Les trois lentilles du skill `founder-board` (Offre, Monopole, Produit), résumés de cadres publiés, appliquées sans parler au nom de leurs auteurs ; puis la carte concurrentielle du skill `founder-competitors`.
> **Sources.** Les PDF de l'équipe (rapport stratégique, chronogramme), `README.md`, `PITCH.md`, `SUBMISSION.md`, `DECISIONS.md`, `results/benchmark.md`, `results/demo_bundle.json`, `results/gpu_log.txt`, `app/dashboard.py`. **Aucune recherche web nouvelle** n'a été faite pour cette revue : les faits sur les concurrents sont ceux, sourcés, du rapport de l'équipe.
> Rédigé le 25/11/2026.

## Sommaire

1. [Verdict en une minute](#1-verdict-en-une-minute)
2. [La découverte qui change tout : le « GPU run » n'a pas utilisé le GPU](#2-la-découverte-qui-change-tout)
3. [Notes par critère du jury](#3-notes-par-critère-du-jury)
4. [Le conseil : trois lentilles, un vote](#4-le-conseil--trois-lentilles-un-vote)
5. [Les 5 failles que le jury attaquera, et la réponse de 20 s](#5-les-5-failles-que-le-jury-attaquera)
6. [Concurrence et positionnement défendable](#6-concurrence-et-positionnement-défendable)
7. [Ce qu'il faut changer dans PITCH.md](#7-ce-quil-faut-changer-dans-pitchmd)
8. [Nouveau script de démo, 3 minutes](#8-nouveau-script-de-démo-3-minutes)
9. [Plan d'action jusqu'à 16 h, puis jusqu'à la finale](#9-plan-daction)
10. [Grille pour juger la plateforme web (landing, dashboard, assistant Nexus)](#10-grille-pour-juger-la-plateforme-web)

---

## 1. Verdict en une minute

**Note globale : 6,5 / 10 aujourd'hui. 8 / 10 atteignable avant 16 h.**

Le projet est **le meilleur angle possible du thème** : il ne se bat pas sur la classification (perdue d'avance), il se bat sur le périmètre (un opérateur seul est aveugle). La rigueur méthodologique est exceptionnelle pour un hackathon : référence honnête, leurres injectés, précision publiée même défavorable, sous-corpus ambigu, 103 tests, décisions datées.

Mais il porte **une bombe** : le tableau est étiqueté « GPU run — Tesla T4 », alors que **ni le LLM ni bge-m3 n'ont tourné**. Dans un **GPU Challenge**, c'est la question qu'un juge technique posera en premier, et la réponse honnête actuelle (« le GPU était branché, mais nous avons utilisé le repli CPU ») efface tout le capital de rigueur accumulé ailleurs. **Corriger ce point est la seule priorité absolue avant 16 h.**

Vote du conseil : **3 FUND IF** (Offre 7, Monopole 7, Produit 6 → moyenne 6,7).

---

## 2. La découverte qui change tout

Ce que disent les fichiers de résultats, sans interprétation :

| Fait | Source | Valeur |
|---|---|---|
| Étiquette d'exécution | `demo_bundle.json › meta.etiquette_execution` | « GPU run — Tesla T4 (15360 MiB) » |
| Moteur d'extraction réellement utilisé | `meta.moteurs_extraction` | `heuristic-fallback` — « extracteur heuristique local, non-LLM — F1 optimiste par construction » |
| Moteur d'embeddings réellement utilisé | `meta.moteur_embeddings` | `tfidf-svd`, device `cpu` — « ce n'est PAS bge-m3 » |
| Appels LLM | `meta.llm` | modèle « (aucun) », 0 requête, débit « non mesuré » |
| Utilisation GPU | `results/gpu_log.txt` | 8 échantillons sur 120 au-dessus de 0 %, moyenne 4,58 %, mémoire à 0 MiB en fin de run |
| Coût d'inférence locale / 1 000 | `benchmark.md §4` | « non calculé » |

**Conséquence.** Les trois blocs annoncés « sur GPU » dans `SUBMISSION.md` (générateur Qwen, extraction vLLM, bge-m3) n'ont **aucune mesure GPU**. La F1 d'extraction 0,982 vient d'un extracteur **écrit en connaissant les gabarits du générateur** (l'équipe l'écrit elle-même). L'argument économique du rapport (« seule l'inférence locale à quelques FCFA par réclamation rend l'automatisation rentable ») n'est **pas démontré**, et `DECISIONS.md` (25/11) reconnaît même que l'API cloud coûte 70,68 FCFA / 1 000, soit déjà très en dessous de l'humain.

**Ce qu'il faut faire, dans cet ordre :**

1. Sur la T4 : `make serve-llm` (Qwen2.5-7B-Instruct-AWQ), `bash scripts/record_gpu_evidence.sh` en parallèle, puis `make pipeline-llm && make bench-llm` **sur un échantillon** (500 à 2 000 plaintes suffisent, le débit se mesure sur un échantillon) et `make bench-embed` avec bge-m3 sur GPU.
2. Si le LLM ne tient pas dans le temps : **changer l'étiquette** en « exécution CPU sur machine GPU — LLM non mesuré » partout (README, benchmark, UI) et le dire en premier. Un jury pardonne une limite annoncée ; il ne pardonne pas une étiquette trompeuse découverte par lui.
3. Afficher dans la démo **trois chiffres GPU mesurés** : réclamations/s du LLM, tokens/s, coût pour 1 000 réclamations sur T4 — à côté de l'API cloud et de l'humain.

---

## 3. Notes par critère du jury

| Critère | Note /10 | Pourquoi | Ce qui fait gagner 2 points |
|---|---|---|---|
| **Besoin** | 8 | Chiffres BCEAO sourcés, nœud du problème net (même récit pour l'erreur et la fraude), timing PI-SPI réel | Une phrase d'un praticien (même informelle) : « oui, on voit ça tous les jours » |
| **Utilisateur** | 7 | Responsable litiges et fraude d'une EME : précis. Mais personne ne l'a interrogé | Une fiche « journée type » de cet utilisateur et ce qu'il fait aujourd'hui sans l'outil (Excel, appels entre opérateurs, J+5) |
| **Innovation** | 7 | Signal mule tiré du **texte des réclamations, entre émetteurs** : neuf dans la zone. L'honnêteté « pas inédit au monde » est un atout | Montrer pourquoi PI-Reclam ne peut pas le faire seul (il transporte, il ne corrèle pas) en une image |
| **Prototype** | 7 | Pipeline complet, Streamlit 8 onglets, mode démo hors ligne, audit chaîné, dossier camt.056 | Le LLM qui tourne vraiment sur une vraie plainte dans l'onglet « Tester une réclamation » |
| **Résultats vs référence** | 8 | Référence non truquée, rappel 60 % → 100 %, délai 29 → 13 min, 367 k → 920 k FCFA gelables, défaites publiées | Intervalle d'incertitude affiché (5 campagnes) et un deuxième jeu à graine différente |
| **Usage réel du GPU** | **3** | Voir section 2 : étiquette GPU, exécution CPU, 0 appel LLM | **Mesure LLM + bge-m3 sur T4** et courbe `nvidia-smi` pendant la démo → 7 |
| **Modèle économique** | 5 | 5 FCFA / réclamation non relié à une mesure ; TAM 2,7 M$ petit ; la valeur fraude déclarée est faible (≈ 2 Md FCFA/an) | Vendre la **conformité aux délais et le coût de traitement**, chiffrer le pilote (prix, durée, critère de succès) |
| **Équipe** | 6 | Alternance DSI Orabank, cybersécurité : crédible mais une seule ligne | Dire qui fait quoi et pourquoi cette équipe a accès aux opérateurs |
| **Pitch** | 6 | Bien écrit mais trop dense pour 5 min ; trop de chiffres, trop de précautions oratoires | Couper 30 %, une idée par minute, une seule image forte (le graphe qui s'allume) |
| **Global** | **6,5** | | **8** avec la correction GPU, le pitch resserré et la démo recentrée |

---

## 4. Le conseil : trois lentilles, un vote

### Lentille Offre — 7/10, FUND IF

**Ce qui est fort.** Résultat rêvé clair : « l'argent volé est gelé avant le retrait, le vrai client est remboursé dans les délais ». Délai court (alerte en minutes). La pile « extraction + alerte + dossier pré-rempli + minuteur + audit » est une vraie pile de valeur : chaque brique retire un problème que le responsable litiges vit.

**Ce qui tuerait le projet.**
1. **Probabilité perçue faible** : aucune preuve que des concurrents acceptent de partager un hash ; aucune lettre d'intérêt.
2. **Marché** : l'acheteur (EME) a de l'argent, mais la douleur « fraude » est sous-déclarée (≈ 3 400 FCFA par cas) ; la douleur qui paie est la **conformité** (sanctions Commission bancaire : 14 blâmes, 1 retrait d'agrément en 2024).
3. **Prix** : « 5 FCFA par réclamation » est un argument de prix bas, pas de valeur. On ne gagne pas sur le prix face à un outil interne.

**Questions.** Qui signe le bon de commande, le DG fraude ou le DSI ? Quelle garantie ? Que se passe-t-il si un seul opérateur adhère ?

**Conditions.** (a) Vendre en premier la conformité (« zéro dossier hors délai ») et en second la fraude ; (b) une offre pilote chiffrée avec un critère de succès ; (c) une garantie : pilote gratuit si le rappel n'atteint pas X sur leurs propres données historiques.

### Lentille Monopole — 7/10, FUND IF

**Ce qui est fort.** Vrai **effet de réseau** : chaque opérateur ajouté augmente le rappel de tous (la démo le prouve : 60 % seul, 100 % à trois). Petit marché dominable (175 participants PI-SPI, 28 opérateurs). Secret défendable : « la plainte la plus fréquente et la fraude la plus fréquente ont le même texte ; seul le croisement les sépare » — et c'est **mesuré** (sous-corpus ambigu).

**Ce qui tuerait le projet.**
1. **Distribution** : le seul canal réaliste est institutionnel (BCEAO, Alliance Fintech UEMOA). Si la BCEAO ajoute la corrélation dans PI-Reclam, le produit disparaît.
2. **Durabilité** : la technique (HMAC + règle 3/2/60 + networkx) se copie en un mois par l'équipe data d'un grand opérateur.
3. **Démarrage à froid** : la valeur est nulle avec un seul opérateur.

**Questions.** Comment arrivent les deux premiers opérateurs d'un même pays ? Qu'est-ce qui reste à vous si la BCEAO opère le hub ?

**Conditions.** (a) Se positionner comme **couche d'intelligence de PI-Reclam**, candidate à l'intégration (sortie = partenariat ou rachat), pas comme rival ; (b) l'actif durable = le **jeu d'évaluation**, les règles calibrées et l'historique d'alertes validées par les humains ; (c) premier consortium = 2 opérateurs d'un même pays (Bénin) sous l'égide de l'Alliance.

### Lentille Produit — 6/10, FUND IF

**Ce qui est fort.** « Une entrée, deux sorties : geler ou rembourser » : une phrase, c'est rare. Le principe « nous recommandons, nous ne gelons jamais » est exactement ce qu'un régulateur veut entendre.

**Ce qui tuerait le projet.**
1. **Trop de modules dans 3 minutes** : radar d'incidents, voix, essai interactif, confidentialité, 8 onglets. Le jury retient une image, pas huit.
2. **La couture** entre l'alerte du hub et l'action chez l'opérateur hôte n'est pas montrée : qui reçoit l'alerte, sur quel écran, que fait-il dans les 5 minutes ?
3. **L'expérience premier contact** : un tableau de F1 n'est pas une expérience ; le graphe qui s'allume l'est.

**Questions.** Quelle est la seule chose que le produit doit faire brillamment ? Que voit l'analyste fraude de l'opérateur hôte à 14 h 21 ?

**Conditions.** (a) Couper la voix et le radar d'incidents de la démo (les garder en réponse aux questions) ; (b) montrer l'écran de l'opérateur hôte qui reçoit l'alerte et clique « geler — validé par » ; (c) une seule image finale.

### Synthèse du président

- **Vote : 3 FUND IF, moyenne 6,7.**
- **Risques soulevés par plus d'un membre** : (1) la confiance dans le partage de données entre concurrents (Offre, Monopole) ; (2) le risque PI-Reclam / BCEAO (Monopole, Offre) ; (3) la densité du produit et du pitch (Produit, Offre).
- **Désaccord conservé** : la lentille Offre pousse à vendre la conformité d'abord ; la lentille Monopole pense que le seul actif durable est l'effet de réseau anti-fraude. Les deux sont vrais à des horizons différents : conformité pour **signer le pilote**, réseau pour **rester**.
- **La version la plus forte** que voit le conseil : non pas « un outil anti-fraude vendu à chaque opérateur », mais **la couche d'intelligence du système de réclamations interopérables de l'UEMOA**, d'abord vendue à un opérateur comme outil de conformité (dossiers PI-SPI dans les délais), puis transformée en consortium anti-mules dès que deux opérateurs d'un même pays sont branchés, avec la BCEAO ou l'Alliance comme opérateur de confiance du hub. C'est légèrement différent du pitch actuel, qui ouvre sur la fraude.

**Checklist des conditions :**

- [ ] Mesure LLM et bge-m3 réelle sur T4, ou étiquette corrigée
- [ ] Offre pilote chiffrée (durée, prix, critère de succès, garantie)
- [ ] Phrase de positionnement « couche d'intelligence de PI-Reclam »
- [ ] Écran « opérateur hôte reçoit l'alerte et valide » dans la démo
- [ ] Démo recentrée sur une seule histoire (Aïcha, CMP-01)
- [ ] Une lettre ou un message d'intérêt d'un acteur du forum (même informel) d'ici la finale
- [ ] Réponse écrite sur la base légale du partage pseudonymisé (APDP Bénin)

---

## 5. Les 5 failles que le jury attaquera

| # | Attaque probable | Réponse de 20 s | Fait à l'appui |
|---|---|---|---|
| 1 | **« Où est le GPU ? Votre run dit GPU mais votre extracteur est une heuristique. »** | *Si la mesure est faite :* « Le LLM Qwen2.5-7B tourne sur la T4 : X réclamations/s, Y tokens/s, Z FCFA pour 1 000. La courbe nvidia-smi est là. » *Sinon :* « Vous avez raison, et nous l'écrivons : le tableau principal sort du repli CPU. Le GPU sert l'extraction LLM, mesurée sur un échantillon de N plaintes. La valeur du projet n'est pas là : elle est dans le croisement, qui ne dépend d'aucun modèle. » | `results/benchmark.json`, `gpu_log.txt` |
| 2 | **« Des concurrents ne partageront jamais leurs données. »** | « Ils ne partagent pas de données : un hash d'alias et un montant arrondi. Le texte, le nom, le numéro du plaignant ne sortent jamais. En production, le hub est opéré par un tiers de confiance — BCEAO ou Alliance — ou remplacé par une intersection d'ensembles privée. Ils partagent déjà les réclamations via PI-Reclam : nous demandons moins que ce qu'ils font déjà. » | Tableau « Ce qui quitte l'opérateur », onglet Confidentialité |
| 3 | **« La BCEAO le fera dans PI-Reclam. »** | « Tant mieux : nous sommes conçus pour s'y brancher. PI-Reclam transporte les réclamations entre participants ; rien de public n'indique qu'il les corrèle. Notre sortie naturelle est l'intégration, et notre actif est le jeu d'évaluation et les règles calibrées. » | Rapport §03 et §04 |
| 4 | **« 100 % de rappel sur 5 campagnes synthétiques que vous avez écrites vous-mêmes. »** | « Oui : 5 campagnes, l'incertitude est large, nous l'écrivons. Mais la référence a la même règle et les mêmes données, seulement privée des autres réseaux : l'écart 60 → 100 % vient du périmètre, pas d'un réglage. Et nous avons injecté des leurres : la règle brute n'a que 42 % de précision. La prochaine étape est un historique réel anonymisé, en pilote. » | `DECISIONS.md` 16/11 et 15/11 |
| 5 | **« Qui paie, combien, et pourquoi maintenant ? »** | « Le responsable litiges paie pour ne plus rater un délai : 3 jours ouvrés, un mois, et des pénalités PI-Reclam. La Commission bancaire a prononcé 14 blâmes et retiré un agrément en 2024. Nous proposons un pilote de 8 semaines, puis un forfait par opérateur. La fraude évitée est le bonus, pas la justification. » | Rapport §03 et §10 |

Questions de réserve à préparer : « Et si le fraudeur change d'alias ? » (croiser aussi le MSISDN sous-jacent, l'agent de retrait, montant et heure) ; « Gel à tort d'un innocent ? » (aucun gel automatique, 2 opérateurs / 3 plaignants minimum, validateur humain tracé) ; « Votre HMAC est attaquable par dictionnaire » (oui si la clé fuit, d'où PSI ou hub tiers en production — à dire avant qu'on le dise).

---

## 6. Concurrence et positionnement défendable

Faits repris du rapport de l'équipe (sources §13 du PDF), **non revérifiés** pour cette revue.

| Acteur | Type | Ce qu'il fait | Ce qui lui manque face à Réclam'Graph | Menace |
|---|---|---|---|---|
| **PI-Reclam (BCEAO)** | Direct potentiel | Transport centralisé des réclamations entre participants PI-SPI, avec délais et pénalités | Aucune analyse ni corrélation publique connue | **La plus forte** : peut ajouter la corrélation. Réponse : se positionner comme sa couche d'intelligence |
| **Proto / BOB (BSP, Philippines)** | Indirect (SupTech) | Intake et routage des plaintes pour le régulateur, 14,4 M interactions/an, 89 % automatiques | Voit les plaintes escaladées, pas la première ligne en temps réel ; pas de corrélation anti-fraude entre institutions | Moyenne : pourrait être vendu à la BCEAO |
| **Registres de fraude mutualisés** (RBI, consortiums bancaires) | Indirect | Partage de déclarations de fraude entre institutions | Alimentés par des déclarations, pas par le texte des réclamations clients ; rien de public en UEMOA | Moyenne : modèle de gouvernance à imiter |
| **Feedzai, Featurespace, SAS, BioCatch** | Indirect | Détection de fraude transactionnelle, comportementale | Vue d'un seul établissement ; usage des réclamations comme signal non vérifié ; prix hors de portée de la plupart des EME | Faible à court terme, forte si un opérateur l'achète |
| **Outils internes Orange, MTN, Wave, Moov** | Substitut | Détection de transactions suspectes, OTP raccourcis, blocage de bénéficiaires | **Aveugles par construction** quand la mule est chez un concurrent | Forte pour copier la technique, faible pour copier le réseau |
| **Chattermill, Thematic, Enterpret, Intercom Fin** | Indirect | Analyse de feedback et agents IA, mono-entreprise | Environ 1 $ par commentaire ; ne relient rien à une transaction ; ignorent PI-SPI | Faible |

**Carte de positionnement (texte).** Axe horizontal : *périmètre de vue* (un établissement → tout le réseau). Axe vertical : *source du signal* (transactions → texte des réclamations clients).

- Bas-gauche (transactions, un établissement) : Feedzai, Featurespace, outils internes.
- Haut-gauche (texte, un établissement) : Chattermill, Thematic, Intercom Fin.
- Bas-droite (déclarations, réseau) : registres de fraude, plateforme d'incidents BCEAO.
- Milieu-droite (réclamations transportées, réseau, sans analyse) : PI-Reclam.
- **Haut-droite (texte des réclamations, réseau) : vide. C'est la place de Réclam'Graph.**

**Le gap, en une phrase défendable :** *« Nouveau dans la zone et par la source du signal : la seule couche qui lit les réclamations clients de plusieurs émetteurs pour en tirer un signal de compte mule, sans que le texte quitte jamais l'émetteur. »*

**Qui copie le plus vite :** l'équipe data d'un grand opérateur (Orange, MTN) pour la technique — mais seule, elle reste aveugle ; et la BCEAO pour le réseau. D'où la stratégie : s'allier avec celui qui peut copier le réseau.

---

## 7. Ce qu'il faut changer dans PITCH.md

| Où | Phrase actuelle | Remplacer par | Pourquoi |
|---|---|---|---|
| §1.1, ouverture | Récit d'Aïcha, puis 5 puces de chiffres | Garder Aïcha, puis **un seul chiffre** : « 2,65 millions de réclamations en un semestre, et la première cause est la même phrase que la première fraude. » | 5 puces en 1 min 15 = le jury décroche |
| §1.1, chute | « Ce n'est pas un problème de modèle. C'est un problème de périmètre. » | Garder, et **la mettre en dernière phrase du pitch aussi** | C'est la meilleure phrase du dossier ; elle doit être répétée |
| §1.3 | « Lire — la plainte brute devient du JSON structuré » | « Lire — un modèle de langage, sur notre GPU, transforme une plainte écrite en SMS en fiche structurée : montant, bénéficiaire, réseau. » | Dire **GPU** dans le pitch d'un GPU Challenge, mais seulement si mesuré |
| §1.4 | « 2 novembre 2026 : la monnaie électronique interopérable doit passer par PI-SPI (sources secondaires, à vérifier) » | « Depuis un an, PI-SPI a connecté 175 institutions et rend chaque transfert irrévocable. » | Ne jamais citer à l'oral un fait marqué « à vérifier » : le jury BCEAO peut le contredire |
| §1.5 | « Alternance à la DSI d'Orabank, spécialité cybersécurité, pile 100 % locale » | Une ligne par membre, rôle + preuve (« X : DSI Orabank, voit les litiges de l'intérieur ») | « Pourquoi nous » doit être des personnes, pas une stack |
| §1.6 | « Un pilote de 8 semaines avec un opérateur du forum » | « Un pilote de 8 semaines, sur un historique de réclamations anonymisé, avec un critère simple : combien de campagnes nous aurions vues avant le retrait. Nous cherchons un premier opérateur et un tiers de confiance pour le hub — l'Alliance est dans la salle. » | Une demande précise, mesurable, adressée à quelqu'un présent |
| §2, fin | « Terminer sur la courbe GPU si la démo tourne sur la machine GPU » | Terminer sur **la courbe GPU mesurée et le coût pour 1 000** — obligatoire, pas optionnel | C'est un GPU Challenge |
| §3, réponse « Pourquoi un LLM » | « 0,854 → 0,969 sur l'extraction des montants » | Ne citer ce chiffre **que s'il vient du LLM** ; aujourd'hui il vient de l'heuristique « F1 optimiste par construction » | Sinon un juge qui lit `benchmark.md` vous prend en défaut |
| §4, comparaison de prix | « Seule l'inférence locale […] rend l'automatisation rentable en UEMOA » | **Supprimer** tant que le coût local n'est pas mesuré ; vos propres mesures montrent l'API cloud à 70,68 FCFA / 1 000 | Phrase contredite par votre propre `DECISIONS.md` |
| §4, argument souveraineté | (absent) | « Le texte des réclamations ne peut pas partir chez une API hors zone : c'est pour cela que le modèle tourne chez l'opérateur, sur un GPU. » | Le vrai argument du GPU est la **confidentialité**, pas le coût |

---

## 8. Nouveau script de démo, 3 minutes

Une seule histoire (CMP-01, Aïcha), quatre écrans, une image finale. Radar d'incidents, voix et confidentialité détaillée : **hors démo**, gardés pour les questions.

| Temps | Écran | Ce qu'on montre | Phrase clé |
|---|---|---|---|
| 0:00 – 0:15 | Bandeau | « Données synthétiques, opérateurs fictifs, générateur publié. » | (dite en premier, une fois) |
| 0:15 – 0:45 | Le cas | La plainte brute d'Aïcha, pleine de fautes → la fiche extraite par le LLM sur GPU (montant, alias, réseau), avec le temps de traitement mesuré | « La regex lit 25.000, elle ne lit pas 25mil. Le modèle, si. » |
| 0:45 – 1:15 | Opérateur seul | CMP-01 vue par ALPHAMONEY : motif vu à 43 min, mule chez un concurrent, **0 FCFA gelable**, file J+5 | « Seul, l'opérateur a raison trop tard, et chez le mauvais réseau. » |
| 1:15 – 2:00 | Graphe | Curseur : 14 h 09, 14 h 16, **14 h 21 le nœud s'allume**. Alerte : 7 plaignants, 3 opérateurs. **Puis l'écran de l'opérateur hôte** : il voit le montant encore gelable, clique « recommander le gel — validé par : [nom] » → l'entrée d'audit apparaît | « Le hub n'a jamais lu une plainte. Et c'est un humain qui décide. » |
| 2:00 – 2:20 | Dossier | Un client sincère : demande d'annulation pré-remplie, minuteur J+3 / J+30 | « L'autre sortie : rembourser, dans les délais. » |
| 2:20 – 3:00 | Résultats | **Une seule ligne forte** (rappel 60 → 100 %, délai 29 → 13 min, 367 k → 920 k FCFA gelables), puis la **courbe nvidia-smi et le coût pour 1 000 sur T4** ; finir sur le sous-corpus ambigu | « Sur les plaintes ambiguës, aucun lecteur de texte ne bat le hasard. Il faut les croiser. Ce n'est pas un problème de modèle : c'est un problème de périmètre. » |

Sécurité : mode démo pré-calculé, vidéo de secours, `benchmark.md` ouvert dans un onglet.

---

## 9. Plan d'action

### Jusqu'à 16 h aujourd'hui (passage prévu 15 h 15 – 16 h 15, équipe 12 en dernier)

| Tranche | Qui | Action | Livrable |
|---|---|---|---|
| 12 h 00 – 12 h 30 | Personne B (LLM) | Sur la T4 : `make serve-llm`, `record_gpu_evidence.sh` en fond, `make bench-llm` sur 500 – 2 000 plaintes ; en parallèle `make bench-embed` bge-m3 GPU | `benchmark.json` avec débit LLM, `gpu_log.txt` avec utilisation réelle |
| 12 h 00 – 12 h 30 | Personne D (pitch) | Couper le pitch à 5 min selon la section 7 ; chronométrer à voix haute | `PITCH.md` v2 |
| 12 h 30 – 13 h 00 | Personne A (preuve) | Régénérer README et benchmark (`make readme`) ; si le LLM a échoué, **corriger l'étiquette** « GPU run » partout | Étiquettes honnêtes, chiffres GPU réels |
| 12 h 30 – 13 h 00 | Personne C (graphe) | Ajouter dans l'UI le bouton « recommander le gel — validé par » côté opérateur hôte, qui écrit l'audit | Écran de la couture hub → opérateur |
| 13 h 00 – 13 h 30 | Tous | Déjeuner court + première répétition complète 5 + 3 + 5 | Liste des accrocs |
| 13 h 30 – 14 h 00 | Personne D | Enregistrer la **vidéo de secours** (OBS) sur le nouveau script | Vidéo locale + clé USB |
| 14 h 00 – 14 h 30 | Tous | Répétition 2 avec un coéquipier qui joue le jury et pose les 5 attaques de la section 5 | Réponses de 20 s apprises |
| 14 h 30 – 15 h 00 | Tous | Gel du code. Vérifier la machine de démo hors ligne, batterie, adaptateur HDMI | Rien ne change après |
| 15 h 00 – 16 h 00 | Tous | Dernière répétition à blanc, puis attente au calme | Passage |

**Règle : à 14 h 30 on ne touche plus au code**, plateforme web comprise. Si la plateforme web n'est pas stable à 14 h 30, elle n'est pas montrée aujourd'hui.

### Si qualifiés, jusqu'à la finale du 26/11 (15 min : 5 + 3 + **7 min de questions**)

1. Préparer 7 minutes de questions : doubler les réponses de la section 5, ajouter alias changeant, HMAC/dictionnaire, base légale APDP, coût d'un pilote, intégration ISO 20022 réelle.
2. Contacter dans la soirée un acteur du forum (Moov Money, Payfonte, Alliance) pour un « on serait prêts à regarder » écrit — c'est le point qui fait passer la probabilité perçue de 6 à 8.
3. Deuxième graine du générateur pour montrer que l'écart tient sur un autre jeu.
4. Tests techniques des finalistes à 7 h 45 : machine prête la veille.
5. Profiter de la session Africa GPU Hub / Payfonte (11 h 20) pour une phrase de la finale : « comme dit ce matin, du prototype au pilote… ».

---

## 10. Grille pour juger la plateforme web

La plateforme web (landing, connexion, dashboard, assistant « Nexus ») est un **multiplicateur**, pas le produit. Devant un jury fintech et régulateur, elle aide si elle rend la thèse plus crédible ; elle nuit si elle la rend plus marketing.

### Ce qui doit impressionner

| Critère | Test concret |
|---|---|
| **Les chiffres affichés sont ceux de `results/`** | Chaque KPI du dashboard se lit depuis `demo_bundle.json` / `benchmark.json`, avec la mention « données synthétiques » visible et non cachée |
| **Le dashboard guide le responsable litiges** | À l'ouverture : « 3 alertes mule à valider, 2 dossiers à J-1 » — la prochaine action, pas un mur de graphiques |
| **La couture hub → opérateur** | Une alerte s'ouvre, montre les preuves pseudonymisées, le montant encore gelable, et un bouton « recommander le gel — validé par » qui écrit dans l'audit |
| **La confidentialité est visible** | Un panneau « ce qui a quitté votre système : un hash, un montant arrondi » sur chaque alerte |
| **Le minuteur réglementaire** | Les dossiers triés par échéance J+3 ouvrés / J+30, en rouge à J-1 |
| **L'assistant cite ses sources** | Nexus répond en renvoyant à une alerte, un dossier ou une ligne d'audit précise, et dit « je ne sais pas » hors du périmètre |
| **Le graphe** | Un graphe plaignants – alias hachés – opérateurs, animé dans le temps : c'est l'image que le jury retiendra |

### Ce qui serait du « bling » nuisible

| Risque | Pourquoi ça coûte des points |
|---|---|
| Logos réels d'EME (Orange, MTN, Wave, Moov) dans un défilé de « clients » ou « partenaires » | **Laisse croire à des partenariats qui n'existent pas** ; devant Moov et l'Alliance dans le jury, c'est le pire moment pour être pris. Si un défilé est gardé : intitulé « émetteurs de l'écosystème PI-SPI », sans le mot « clients », ou logos des opérateurs **fictifs** de la démo |
| Chiffres marketing inventés (« 99 % de fraude bloquée », « 10 000 alertes ») | Contredit la culture « rien sans mesure » qui est votre meilleur atout |
| Assistant qui « gèle », « bloque » ou « décide » | Contredit le principe non négociable ; un régulateur l'entendra immédiatement |
| Animations Three.js qui ralentissent la machine de démo ou cachent les chiffres | 3 minutes de démo : chaque seconde de chargement est perdue |
| Bouton « Payer », « Essai gratuit », témoignages clients | Il n'y a ni client ni prix validé : à retirer |
| Données qui ne sont pas celles du pipeline | Deux sources de vérité = deux jeux de chiffres que le jury peut confronter |
| Mention d'IA « qui comprend le fon, le wolof, le mina » | Faux d'après les WER publiés ; le rapport l'interdit lui-même |

**Recommandation pour aujourd'hui** : la plateforme web n'entre dans les 3 minutes de démo que si elle remplace un écran Streamlit **en mieux** et sans risque (hors ligne, chiffres de `results/`). Sinon, la montrer en ouverture de pitch (10 secondes de landing) ou la garder pour la finale. **Le Streamlit validé reste la démo de référence.**
