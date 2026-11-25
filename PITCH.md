# Réclam'Graph — pitch, démo et questions du jury

Équipe **Token Titans** (équipe 12) — GPU Challenge 2026.
Thème imposé : **analyse intelligente des réclamations clients**.

Format : **5 min de pitch · 3 min de démo · 5 min de questions.**

> Tous les chiffres de nos mesures viennent de [`results/benchmark.json`](results/benchmark.json)
> et sont rappelés dans [README.md](README.md#3-résultats-mesurés). Les données sont
> **synthétiques** et c'est annoncé d'entrée.

---

## 1. Le pitch, 5 minutes

### 1.1 Problème — 1 min 15

> « Mardi, 14 h 02. Aïcha reçoit un SMS : *je vous ai envoyé 25 000 par erreur,
> renvoyez s'il vous plaît*. Elle renvoie. À 14 h 09, elle réclame. »

- **2,65 millions de réclamations** en un semestre chez les émetteurs de l'UEMOA.
- Le motif numéro un : **l'erreur de bénéficiaire**.
- La fraude numéro un : **l'ingénierie sociale**, dont l'arnaque à l'« erreur de dépôt ».
- **La plainte la plus fréquente et la fraude la plus fréquente racontent la même
  histoire, avec les mêmes mots.**
- **PI-SPI rend le transfert irrévocable** : une annulation exige l'accord du
  bénéficiaire. Et comme la victime est chez un opérateur et la mule chez un autre,
  **chaque opérateur ne voit que la moitié du dossier**.

> Phrase à dire : *« Ce n'est pas un problème de modèle. C'est un problème de
> périmètre. »*

### 1.2 Utilisateur — 30 s

Le **responsable litiges et fraude** d'un établissement de monnaie électronique ou
d'une banque participant à PI-SPI : il doit tenir **3 jours ouvrés** et **un mois**,
récupérer des fonds, éviter des pénalités. Et l'**équipe PI-Reclam** côté régulateur,
qui gagne une vue consolidée des campagnes.

### 1.3 Solution — 1 min 30

**Une entrée : la plainte. Deux sorties : geler ou rembourser.**

1. **Lire** — la plainte brute devient du JSON structuré, malgré les fautes, les
   abréviations SMS et les montants écrits « 25mil ».
2. **Pseudonymiser** — l'alias du bénéficiaire est haché (HMAC-SHA256) chez
   l'opérateur. **Le texte ne sort jamais. Le nom ne sort jamais. Le montant sort arrondi.**
3. **Croiser** — au hub : **3 plaignants indépendants, 2 réseaux, 60 minutes** → alerte
   « mule probable ».
4. **Agir** — mule : les opérateurs sont prévenus avec le montant encore gelable.
   Erreur sincère : demande d'annulation PI-SPI pré-remplie, minuteur J+3 / J+30,
   piste d'audit.

> **« Nous ne gelons rien. Nous recommandons et nous documentons. La décision reste
> humaine, chez l'opérateur, et elle est tracée. »**

### 1.4 Pourquoi maintenant — 45 s

- **2 novembre 2026** : la monnaie électronique interopérable doit passer par PI-SPI
  *(sources secondaires, à vérifier sur le communiqué BCEAO)*.
- **175 institutions** déjà connectées à PI-SPI en novembre 2026.
- Des **délais réglementaires** opposables : 3 jours ouvrés (art. 35), un mois
  (Circulaire CB), et des pénalités PI-Reclam fixées par convention.

> *« L'infrastructure qui crée le problème vient d'être déployée. La couche qui le
> traite n'existe pas encore. »*

### 1.5 Pourquoi nous — 30 s

Alternance à la **DSI d'Orabank**, spécialité **cybersécurité**, pile **100 % locale** :
pas de donnée qui sort de la zone, pas de facture par appel d'API.

### 1.6 Demande — 30 s

Un **pilote de 8 semaines** avec un opérateur du forum, sur un historique de litiges
anonymisé.

---

## 2. La démo, 3 minutes

Interface : `make demo` — **mode démo par défaut**, résultats pré-calculés, **aucune
dépendance à une session GPU en direct**.

> Les opérateurs affichés (`ALPHAMONEY`, `BETACASH`, `GAMMAPAY`) sont **fictifs**.
> Dans le récit, Aïcha est cliente du premier et les autres plaignants sont chez les
> deux concurrents. **Le dire en une phrase au début de la démo.**

### 0:00 → 0:20 — Le cas · onglet « Le cas »

Mardi 14 h 02, Aïcha, cliente ALPHAMONEY à Cotonou, reçoit le SMS, renvoie 25 000 FCFA.
À **14 h 09** elle réclame. **Montrer la plainte brute, pleine de fautes :**

> *Bonjour l'equipe jai recu un faux msg de det de 25.000 frs, jai rennvoye a
> koffi.santos@betacash a 14h02, et e vai depot nexistat as. je porte plainte. c'est
> urggent*

À droite, l'extraction : typologie, **25 000 FCFA**, alias du bénéficiaire, réseau de
destination. *« La regex de référence lit « 25.000 » ; elle ne lit pas « 25mil ». »*

### 0:20 → 0:50 — Opérateur seul · onglet « Opérateur seul / consortium »

Choisir **CMP-01**. Colonne de gauche :

- L'opérateur seul **finit** par voir le motif, **43 minutes** après la première plainte.
- Mais le compte mule est hébergé **chez un concurrent** : il ne peut rien suspendre.
- **FCFA encore gelables : 0.** La plainte part en file normale, traitement à **J+5**.

**Montrer le compteur qui descend** : la courbe « FCFA encore gelables » décroît dès que
la mule commence à retirer.

### 0:50 → 1:40 — Consortium · onglet « Graphe animé »

Déplacer le curseur. Les plaintes arrivent : ALPHAMONEY à 14 h 09, BETACASH à 14 h 16,
**GAMMAPAY à 14 h 21 → le nœud bénéficiaire s'allume en rouge.**

> **« mule probable, 7 plaignants, 3 opérateurs, 162 000 FCFA dont 118 000 encore sur
> le compte »**

- **Délai de détection : 12 minutes** au lieu de 43.
- Opérateurs à prévenir : les trois.
- Et dire la phrase : *« Tout ce que vous voyez ici est pseudonymisé. Le hub n'a jamais
  lu une seule plainte. »*

### 1:40 → 2:15 — La vraie erreur · onglet « Détail et dossier »

Décocher le filtre, prendre un dossier **REMBOURSER** : un client qui s'est réellement
trompé.

- La **demande d'annulation PI-SPI pré-remplie** (ossature ISO 20022 camt.056, motif `CUST`).
- Le **minuteur** : J+3 jours ouvrés, J+30 calendaires, échéance PI-Reclam.
- L'**entrée d'audit** avec les preuves et le **champ validateur humain** — taper un nom
  pour montrer qu'il se remplit.
- Rappeler l'**irrévocabilité** : *« Nous ne pouvons pas annuler unilatéralement. Nous
  produisons une demande motivée, datée, et traçable. »*

### 2:15 → 3:00 — Les chiffres · onglet « Résultats »

| | Opérateur seul | Réclam'Graph |
|---|---|---|
| Rappel des campagnes | **60 %** (3/5) | **100 %** (5/5) |
| Délai médian de détection | **29 min** | **13 min** |
| FCFA encore gelables | **367 000** | **920 000** |
| Précision des alertes | 75 % | 42 % brute → **100 %** après score |

Puis les deux phrases qui font la différence devant un jury :

1. *« Sur la classification, la référence supervisée nous bat : 0,98 contre 0,81. Nous
   le publions. Ce n'est pas là que se trouve la valeur. »*
2. *« Et voici la mesure qui porte tout le projet : sur les 1 330 plaintes dont le texte
   sert indifféremment à une arnaque et à une erreur sincère, **aucun moteur ne dépasse
   le taux de la classe majoritaire**. Lire la plainte ne suffit pas. Il faut les croiser. »*

Terminer sur l'onglet **Résultats**, qui porte les mesures GPU et la courbe
`nvidia-smi` relevée pendant l'exécution :

> *« Tout cela a tourné sur une Tesla T4. Le modèle Qwen2.5-7B en AWQ, servi par vLLM :
> **3,087 réclamations par seconde**. Les embeddings bge-m3 : **25,65 textes par
> seconde**. Et donc le coût : **28,31 FCFA pour mille réclamations**, c'est-à-dire le
> prix horaire de la carte divisé par un débit que nous avons mesuré, pas estimé. »*

Et la phrase qui désamorce la question du coût avant qu'on la pose :

> *« Une API cloud ferait la même chose pour 70,68 FCFA les mille. Nous sommes deux fois
> et demie moins chers, mais honnêtement, à côté des 270 000 FCFA que coûte le
> traitement humain de mille réclamations, ces deux chiffres sont du bruit. Notre
> argument n'est pas le coût du modèle. C'est le croisement entre opérateurs. »*

Si une étiquette affiche « repli CPU sur machine équipée d'une T4 », c'est que rien n'a
tourné sur la carte pour cette exécution-là : le dire, ne jamais le masquer.

### Si quelque chose casse

Le mode démo ne dépend de rien. En dernier recours : la **vidéo de secours** et le
`results/benchmark.md` ouvert dans un éditeur.

---

## 3. Questions du jury — réponses en 20 secondes

| Question | Réponse | Fait à l'appui |
|---|---|---|
| **« Les opérateurs concurrents ne partageront jamais leurs données. »** | Rien de brut ne quitte l'opérateur : un identifiant de bénéficiaire **haché** et des métadonnées minimales. En production, *private set intersection* ou un hub opéré par un tiers de confiance (BCEAO, PI-Reclam, Alliance Fintech UEMOA). | La BCEAO exploite déjà une plateforme de déclaration d'incidents cyber et de fraude pour les participants |
| **« Et si vous gelez un innocent ? »** | Nous ne gelons rien : nous **recommandons et documentons**. Seuil de 2 opérateurs distincts et 3 plaignants indépendants minimum ; décision humaine chez l'opérateur, tracée dans l'audit. | La règle est **visible dans la démo**, et deux « leurres » légitimes sont injectés exprès pour mesurer la précision |
| **« La BCEAO le fera elle-même dans PI-Reclam. »** | PI-Reclam est le **tuyau** ; nous sommes la **couche d'intelligence** qui s'y branche. Scénario d'intégration ou d'acquisition, pas d'éviction. | Aucune analyse publique connue dans PI-Reclam |
| **« Vos données sont synthétiques. »** | Oui, et c'est annoncé d'entrée. Le **générateur et la vérité terrain sont publiés**, la génération est **déterministe**, et la robustesse au bruit est mesurée. Prochaine étape : pilote sur données réelles anonymisées. | Générateur et jeu de données dans le dépôt ; 103 tests dont un test de déterminisme |
| **« Ça existe déjà, non ? »** | Les briques existent : Proto, PI-Reclam, registres de fraude ailleurs. Nous n'avons trouvé **aucun système public** qui tire le signal « compte mule » du **texte des réclamations clients entre émetteurs de l'UEMOA**. | Benchmark détaillé en [section 7 du README](README.md#7-ce-qui-existe-déjà--nous-ne-prétendons-rien-dinédit) |
| **« Quel modèle économique ? »** | Forfait par opérateur ou **5 FCFA par réclamation analysée**, plus une option d'intéressement sur les fonds récupérés ; pilote de 8 semaines. | Hypothèses chiffrées en [section 4](#4-modèle-économique--hypothèses) |
| **« Pourquoi un LLM, si un TF-IDF classe aussi bien ? »** | Justement : nous ne l'utilisons **pas** pour classer. Il sert à **extraire** d'un texte sale — montants « 25mil », alias, heures — là où la regex décroche. La valeur vient du **croisement**, pas du classement. | Notre propre mesure : référence supervisée 0,98 contre 0,81 pour nous sur la typologie ; mais 0,854 → 0,969 sur l'extraction des montants |
| **« Votre précision à 100 %, c'est suspect. »** | C'est la précision **après filtre de score**, sur **5 campagnes** : l'incertitude est large et nous l'écrivons. La précision de la **règle brute est de 42 %**, et elle dépend de la typologie produite par l'extracteur — dont nous montrons les limites sur le sous-corpus ambigu. | Les deux chiffres sont publiés côte à côte dans `results/benchmark.md` |

### À ne jamais dire

- ❌ **« Nous remplaçons les agents »** — économiquement faux face aux prix de l'IA
  cloud, et politiquement mauvais. Nous **outillons** les agents.
- ❌ **« Aucune solution n'existe »** — faux : Proto, PI-Reclam, registres de fraude.
- ❌ **Tout chiffre de débit, d'exactitude ou de coût qui n'a pas été mesuré.**
- ❌ **« Notre pipeline tourne sur GPU »** sans préciser quelle étape. L'extraction LLM et
  les embeddings bge-m3 tournent sur la T4, c'est mesuré ; le reste est du CPU, et les
  étiquettes du dépôt le disent étape par étape.
- ❌ **« Nous comprenons le fon, le wolof, le mina »** — les taux d'erreur publiés ne le
  permettent pas. Nous injectons du **bruit lexical** nouchi et fon dans les données ;
  ce n'est pas de la compréhension.
- ❌ **« Inédit au monde »** — dire **« nouveau dans la zone et par la source du signal »**.

---

## 4. Modèle économique — hypothèses

> **Tout ce qui suit est une hypothèse ou une estimation**, pas une mesure. Les sources
> sont des offres d'emploi et des prix publics d'éditeurs.

### Qui paie

| Segment | Prix proposé (hypothèse) |
|---|---|
| EME et opérateurs (Orange, Wave, MTN, Moov, Yas : 28 des 69 initiatives) | **5 FCFA** par réclamation analysée, ou 3 à 5 M FCFA/mois par grand opérateur et par pays |
| Banques et IMF dans PI-SPI | 0,5 à 1 M FCFA/mois |
| Agrégateurs (type Payfonte) | licence + partage de revenus |
| Régulateur ou association (BCEAO, Alliance Fintech UEMOA) | licence de hub, 0,1 à 0,3 M USD/an |
| Option | **5 %** des fonds récupérés |

### Comparaison de prix

| Offre | Prix par unité traitée |
|---|---|
| Intercom Fin | ~590 FCFA par résolution |
| Thematic | ~600 FCFA par commentaire |
| Agent humain | 270 à 700 FCFA par réclamation *(estimation, offres d'emploi)* |
| **Réclam'Graph proposé** | **5 FCFA par réclamation** *(hypothèse)* |

> *« Seule l'inférence locale en poids ouverts, à quelques FCFA par réclamation, rend
> l'automatisation rentable en UEMOA. »*

### Gain pour un opérateur moyen — hypothèses

- ~10 M réclamations par an dans l'Union *(**extrapolation non sourcée**)*.
- Un opérateur à 20 % de part en traite ~2 M.
- 30 % de temps gagné sur 2 M réclamations à 400 FCFA ≈ **240 M FCFA par an**
  (~400 000 USD) *(hypothèse)*.
- Gain de confiance (70 % des comptes sont inactifs) : réel mais **non quantifié**.
- Pénalités PI-SPI et sanctions de la Commission bancaire évitées : **non chiffrable**
  publiquement, les barèmes ne sont pas publics.

### Marché (UEMOA)

| Agrégat | Estimation |
|---|---|
| TAM | ~2,7 M USD/an (28 initiatives opérateurs × 45 000 USD + 147 autres participants × 10 000 USD + licence régulateur) |
| SAM | ~0,8 M USD (~40 institutions à fort volume × 20 000 USD) |
| SOM à 3 ans | 5 à 8 clients, 0,1 à 0,25 M USD d'ARR |

**Marché petit** : bon à dominer, faible pour du capital-risque. Extension naturelle :
**GIMACPAY** (CEMAC) et les autres systèmes de paiement instantané africains.

### Aller au marché

1. **Pilote de 8 semaines** avec une fintech du forum (Moov Money, ou Payfonte pour les
   litiges marchands) sur un historique de litiges anonymisé.
2. **Bénin** : deux opérateurs d'un même pays sous l'égide de l'Alliance Fintech UEMOA —
   premier consortium, premier effet de réseau.
3. **Régional** : proposer à la BCEAO une **branche sur PI-Reclam** comme couche
   d'intelligence.

---

## 5. Aide-mémoire de dernière minute

- [ ] `make demo` lancé, **mode démo activé**, onglet « Le cas » ouvert.
- [ ] Dire en premier : **« les données sont synthétiques, les opérateurs fictifs »**.
- [ ] Savoir citer de tête : **3,087 req/s** (LLM sur T4), **25,65 textes/s** (bge-m3),
      **28,31 FCFA** les mille en local contre **70,68 FCFA** en API cloud.
- [ ] Sur la machine GPU : `bash scripts/record_gpu_evidence.sh` en parallèle, et une
      **capture d'écran de `nvidia-smi`** pendant le traitement.
- [ ] Vidéo de secours enregistrée (OBS).
- [ ] Ne jamais citer un chiffre absent de `results/`.
- [ ] Si on nous pousse sur la nouveauté : **« nouveau dans la zone et par la source du
      signal »**.
