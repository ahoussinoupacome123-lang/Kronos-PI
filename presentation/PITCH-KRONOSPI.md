# Pitch KronosPI — écran par écran

GPU Challenge 2026 · équipe Token Titans · passage de 13 minutes : **5 min de pitch, 3 min de démo, 5 min de questions**.
Présentation : `presentation/kronospi.html` (flèches pour avancer, touche **N** pour les notes).

| # | Écran | Orateur | Durée |
|---|---|---|---|
| 1 | Ouverture, le sablier | Joachim | 0:20 |
| 2 | Sommaire | Joachim | 0:10 |
| 3 | Le problème | Joachim | 1:00 |
| 4 | La solution | Pacôme | 1:00 |
| 5 | Le cas pratique | Ange Marie | 1:00 |
| 6 | Les résultats | Pacôme | 0:45 |
| 7 | La suite | Joachim | 0:30 |
| 8 | Merci | Joachim | 0:15 |
| | **Total pitch** | | **5:00** |
| | Démo en direct | Ange Marie (aux commandes), Joachim (commente) | 3:00 |
| | Questions | Selon le sujet, voir plus bas | 5:00 |

Règle d'or : une phrase, un temps de silence, puis la suivante. On ne lit pas l'écran, on le raconte.

---

## 1. Ouverture — Joachim (20 s)

> Mardi, 14 h 02. Aïcha reçoit un SMS : « Je vous ai envoyé 25 000 par erreur, renvoyez svp. » Elle renvoie.
>
> Dix-neuf minutes plus tard, l'argent sera parti en espèces.
>
> **Ce sablier, c'est le temps qu'il nous reste.** Nous sommes Token Titans, et voici KronosPI.

Geste : laisser le sable couler deux secondes avant de parler.

## 2. Sommaire — Joachim (10 s)

> Le problème. Notre solution. Un cas pratique, minute par minute. Nos résultats. Et ce que nous vous demandons.

## 3. Le problème — Joachim (1 min)

> Dans l'UEMOA, la réclamation numéro un, c'est : « J'ai envoyé au mauvais numéro. »
> L'arnaque numéro un, c'est : « Je me suis trompé, renvoyez-moi l'argent. »
> **Les mêmes mots.**
>
> 2,65 millions de réclamations en un seul semestre. 88 % des dépôts repartent en espèces.
>
> Et depuis PI-SPI, un transfert ne s'annule plus. La victime est chez Moov, le compte mule chez Wave. Chaque opérateur ne voit que la moitié de l'arnaque.
>
> **Le fraudeur, lui, voit tout le réseau. Les opérateurs, non.**

Sources si on vous les demande : BCEAO, rapport semestriel S2 2021 et rapport annuel 2024.

## 4. La solution — Pacôme (1 min)

> KronosPI part d'une idée simple : **chaque plainte est un capteur.**
>
> **Lire.** Chaque opérateur analyse ses propres plaintes, chez lui, avec un modèle open-weight sur son GPU. Le texte du client ne sort jamais.
>
> **Masquer.** Au hub, on n'envoie qu'une empreinte chiffrée du numéro bénéficiaire. Ni nom, ni message.
>
> **Croiser.** Trois plaignants, sur deux réseaux, en moins d'une heure, qui visent le même compte : l'alerte part.
>
> Les outils d'analyse lisent les plaintes d'une seule entreprise. PI-Reclam les transporte. **Nous, nous les croisons, sans que personne ne livre ses clients.**
>
> **Seul, un opérateur est aveugle. Ensemble, ils voient la mule.**

## 5. Le cas pratique — Ange Marie (1 min)

> Reprenons Aïcha.
>
> **14 h 02**, le faux SMS. **14 h 09**, elle se plaint chez Moov. Seule, sa plainte ressemble à une simple erreur de numéro.
>
> **14 h 16**, d'autres victimes, chez MTN, chez Wave, visent le même compte.
>
> **14 h 21 : alerte.** Trois réseaux, douze minutes.
>
> Qui agit ? **Wave**, qui héberge le compte, reçoit l'alerte et le montant encore gelable : 162 000 francs. Son équipe suspend les retraits, et signe sa décision.
> **Moov** ne bloque rien chez un concurrent : il reçoit le dossier PI-SPI d'Aïcha, déjà rempli, minuté à trois jours ouvrés.
>
> **14 h 40**, le premier retrait. Trop tard pour le fraudeur.
>
> **KronosPI ne gèle jamais seul. Il recommande. L'humain décide.**

## 6. Les résultats — Pacôme (45 s)

> Nous l'avons mesuré sur 20 000 réclamations synthétiques, contre un opérateur seul qui applique exactement la même règle.
>
> **13 minutes** pour alerter, contre 29.
> **5 campagnes sur 5** repérées, contre 3.
> **920 000 francs** encore gelables, contre 367 000.
>
> Nos données sont synthétiques, et nous le disons d'entrée : le générateur et la vérité terrain sont publics.
>
> **Plus tôt, c'est plus d'argent rendu.**

À adapter selon la mesure GPU de l'après-midi :
- si `make bench-llm` a tourné : « Sur une Tesla T4, notre extracteur traite **[X] réclamations par seconde**, pour **[Y] francs** les 1 000. »
- sinon : « La mesure de notre modèle sur GPU est en cours ; nous ne vous donnerons aucun chiffre que nous n'avons pas mesuré. »

## 7. La suite — Joachim (30 s)

> Ce que nous vous demandons : **huit semaines, deux réseaux d'un même pays**, leurs réclamations anonymisées. Tout tourne chez eux.
>
> Deux semaines pour brancher. Quatre pour mesurer sur du réel. Deux pour décider ensemble, et viser PI-Reclam.
>
> **L'arnaque est déjà interopérable. La défense doit l'être aussi.**

## 8. Merci — Joachim (15 s)

> Merci au jury, à Epitech Bénin, à UDU Technologies, à l'Alliance Fintech UEMOA et à Payfonte. Merci de nous avoir écoutés.
>
> **Place à la démo.**

---

## Démo — 3 minutes (Ange Marie aux commandes, Joachim commente)

Ouvrir à l'avance http://localhost:3000, connecté avec un compte de démonstration.

| Temps | Écran | Ce qu'on dit |
|---|---|---|
| 0:00 | « Aujourd'hui » | « Le tableau de bord dit au responsable fraude quoi faire, dans l'ordre. » |
| 0:30 | Ouvrir l'alerte la plus urgente, « Rejouer la convergence » | « Voilà les plaintes qui arrivent. Au troisième plaignant, le seuil tombe. » |
| 1:15 | « Pourquoi cette alerte est partie » | « Chaque condition est visible : 3 plaignants, 2 réseaux, 60 minutes. » |
| 1:40 | Décision : recommander la suspension, motif, confirmer | « Rien n'est gelé sans un humain, son motif et sa signature. » |
| 2:15 | Nexus : « Et si on gèle un innocent ? » | « Notre assistant répond à partir des mesures, jamais au hasard. » |
| 2:40 | Dossiers et délais | « Et la vraie erreur repart avec son dossier PI-SPI, minuté. » |

Si l'écran plante : la vidéo de secours, sans s'excuser plus d'une phrase.

---

## Questions — qui répond, en 20 secondes

| Question probable | Qui | Réponse |
|---|---|---|
| « Les opérateurs ne partageront jamais leurs données. » | Joachim | Ils ne partagent rien de brut : une empreinte du numéro et quelques métadonnées. En production, l'intersection se fait par PSI, ou le hub est tenu par un tiers de confiance, BCEAO, PI-Reclam ou l'Alliance. |
| « Et si vous gelez un innocent ? » | Ange Marie | Nous ne gelons rien. Il faut 3 plaignants indépendants sur 2 réseaux en une heure, et c'est l'équipe qui héberge le compte qui décide, motif écrit, inscrit dans l'audit. |
| « La BCEAO va le faire dans PI-Reclam. » | Joachim | PI-Reclam transporte les réclamations ; rien de public ne dit qu'il les corrèle. Nous sommes la couche d'intelligence qui s'y branche : un scénario d'intégration, pas de concurrence. |
| « Vos données sont synthétiques. » | Pacôme | Oui, et c'est annoncé. Le générateur et la vérité terrain sont publics, la référence applique la même règle que nous. La prochaine étape, c'est le pilote sur données réelles anonymisées. |
| « Pourquoi un GPU ? » | Pacôme | Pour que le texte des clients ne quitte jamais l'opérateur ni la zone. Le modèle open-weight tourne chez lui ; seul le résultat masqué part au hub. |
| « Quel modèle économique ? » | Joachim | 5 francs par réclamation analysée, ou un forfait par opérateur et par pays ; un agent humain coûte environ 270 francs par réclamation. Ce sont des hypothèses que le pilote validera. |

## À ne jamais dire

- « Nous remplaçons les agents. »
- « Aucune solution n'existe. »
- « Nous comprenons le fon, le wolof ou le mina. »
- Un chiffre que nous n'avons pas mesuré.
- Que Moov, Wave ou MTN sont nos partenaires : les logos illustrent un scénario.
