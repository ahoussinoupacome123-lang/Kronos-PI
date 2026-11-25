# Analyse des risques juridiques — Réclam'Graph

> **À faire relire par un juriste.** Ce document organise les risques juridiques du projet selon une grille gravité x probabilité. Il ne constitue pas un avis juridique. Les textes cités doivent être vérifiés dans leur version en vigueur, et plusieurs points (base légale du partage inter-opérateurs, qualification du hub, secret bancaire) relèvent d'une question de droit non tranchée en UEMOA.

| | |
|---|---|
| **Date** | 25/11/2026 |
| **Rédaction** | Équipe Token Titans (GPU Challenge 2026) |
| **Objet** | Réclam'Graph : croisement inter-opérateurs de réclamations pseudonymisées, recommandations de gel, dossiers de litige PI-SPI, piste d'audit, assistant IA « Nexus » |
| **Stade** | Prototype de démonstration, données **synthétiques** ; aucun pilote engagé |
| **Confidentiel** | Non (document de travail interne) |

## Sommaire

1. [Ce que fait le produit, vu par un juriste](#1-ce-que-fait-le-produit-vu-par-un-juriste)
2. [Grille de notation](#2-grille-de-notation)
3. [Matrice des risques](#3-matrice-des-risques)
4. [Registre détaillé](#4-registre-détaillé)
5. [Fiches des risques critiques et élevés](#5-fiches-des-risques-critiques-et-élevés)
6. [Questions à poser à un juriste](#6-questions-à-poser-à-un-juriste)
7. [Préalables à tout pilote](#7-préalables-à-tout-pilote)
8. [Cadre de référence](#8-cadre-de-référence)

---

## 1. Ce que fait le produit, vu par un juriste

| Étape | Traitement | Qui le réalise | Données concernées |
|---|---|---|---|
| Lire | Extraction structurée de la réclamation (typologie, montant, heure, alias, réseau) | Chez l'opérateur, sur son infrastructure | Texte brut, identité et numéro du plaignant, alias du bénéficiaire |
| Pseudonymiser | HMAC-SHA256 de l'alias du bénéficiaire avec une clé de consortium | Chez l'opérateur | Alias haché, montant arrondi, horodatage, typologie, opérateur |
| Croiser | Graphe plaignants – bénéficiaires – opérateurs ; règle 3 plaignants / 2 réseaux / 60 min | Hub (tiers) | Uniquement les données pseudonymisées |
| Agir | Alerte « mule probable » ou dossier d'annulation PI-SPI pré-rempli, minuteur réglementaire | Hub produit la recommandation ; **l'opérateur décide** | Alerte, preuves, validateur humain |
| Tracer | Piste d'audit chaînée par hachage | Hub et opérateur | Décisions, seuils, preuves, identité du validateur |
| Assister | Assistant « Nexus » qui explique alertes et dossiers aux utilisateurs | Plateforme | Contenu affiché à l'utilisateur authentifié |

Trois traits portent l'essentiel du risque : **des concurrents partagent un signal sur des tiers** (les bénéficiaires), **une recommandation peut conduire au blocage d'un compte**, et **le hub concentre une vue que chaque opérateur n'a pas seul**.

---

## 2. Grille de notation

**Score = Gravité x Probabilité** (chacune de 1 à 5).

| Score | Niveau | Conduite à tenir |
|---|---|---|
| 1-4 | **Faible** (vert) | Accepter, consigner, revoir périodiquement |
| 5-9 | **Moyen** (jaune) | Atténuer, désigner un responsable, suivre mensuellement |
| 10-15 | **Élevé** (orange) | Plan d'atténuation écrit, avis d'un conseil, revue à chaque jalon |
| 16-25 | **Critique** (rouge) | Bloquant avant pilote ; conseil externe, accord écrit des autorités concernées |

Les notes ci-dessous valent **pour un pilote sur données réelles**. Pour la démonstration actuelle sur données synthétiques, la plupart des risques tombent au niveau faible (voir la colonne « Démo »).

---

## 3. Matrice des risques

```
                         PROBABILITÉ
                 Très faible  Faible  Possible  Probable  Quasi certaine
                     (1)        (2)      (3)       (4)         (5)
GRAVITÉ
Critique  (5)   |           |  R04   | R01 R02 |          |             |
Élevée    (4)   |           |  R08   | R03 R05 |   R06    |             |
                |           |        |   R07   |          |             |
Modérée   (3)   |           |  R11   | R09 R10 |   R12    |             |
Faible    (2)   |           |        |   R13   |          |             |
Négligeable(1)  |           |        |         |          |             |
```

---

## 4. Registre détaillé

| ID | Risque | Catégorie | G | P | Score | Niveau | Démo | Parade principale |
|---|---|---|---|---|---|---|---|---|
| R01 | Absence de base légale pour le partage inter-opérateurs de données relatives aux bénéficiaires (consentement impossible, intérêt légitime à démontrer, finalité de lutte contre la fraude à faire reconnaître) | Données personnelles | 5 | 3 | **15** | Élevé | Faible | Avis préalable APDP / IPDCP / CDP / ARTCI ; ancrage dans une obligation BCEAO ; hub opéré par un tiers de confiance |
| R02 | Gel ou blocage à tort d'un innocent sur la base d'une recommandation (faux positif, alias usurpé, grappe légitime type facturier) | Responsabilité / Réglementaire | 5 | 3 | **15** | Élevé | Faible | Aucun gel automatique ; seuils 3 / 2 / 60 visibles ; validation humaine tracée ; voie de recours rapide ; clause de responsabilité |
| R03 | Violation du secret bancaire ou du secret professionnel des EME par la communication d'informations sur un client à un établissement concurrent | Réglementaire | 4 | 3 | **12** | Élevé | Faible | Ne transmettre que des données pseudonymisées ; fonder le partage sur une dérogation légale (lutte contre la fraude, LBC/FT) ; accord écrit de la BCEAO |
| R04 | Ré-identification des personnes : un HMAC sur des numéros de téléphone est attaquable par dictionnaire si la clé fuit ; le montant et l'horodatage peuvent suffire à ré-identifier | Sécurité / Données | 5 | 2 | **10** | Élevé | Faible | Clé en HSM, rotation, accès restreint ; en production, intersection d'ensembles privée (PSI) ; arrondis et fenêtres temporelles ; analyse d'impact (AIPD) |
| R05 | Transferts transfrontaliers de données au sein de l'UEMOA sans formalités (autorisation ou déclaration selon chaque pays), hub hébergé hors de la zone | Données personnelles | 4 | 3 | **12** | Élevé | Faible | Hébergement dans la zone ; formalités pays par pays ; clauses contractuelles ; minimisation |
| R06 | Décision individuelle automatisée : un dispositif qui « classe » une personne comme mule peut être qualifié de profilage produisant des effets juridiques | Données personnelles | 4 | 4 | **16** | Critique | Faible | Décision humaine obligatoire et tracée ; information des personnes ; droit de contester ; motifs lisibles de l'alerte |
| R07 | Entente ou échange d'informations sensibles entre concurrents (droit de la concurrence UEMOA) au-delà de la stricte finalité anti-fraude | Concurrence | 4 | 2 | **8** | Moyen | Faible | Charte du consortium ; aucune donnée commerciale (volumes, prix, parts) ne circule ; gouvernance par un tiers (Alliance Fintech UEMOA, BCEAO) |
| R08 | Responsabilité de l'émetteur pour les actes de ses distributeurs (Instruction 008-05-2015, art. 18) et retard de remboursement au-delà de 3 jours ouvrés (art. 35) imputé à l'outil | Réglementaire | 4 | 2 | **8** | Moyen | Faible | Minuteur J+3 ouvrés et J+30 ; alertes avant échéance ; le produit aide à tenir le délai, il ne le porte pas |
| R09 | Assistant IA « Nexus » : réponse inexacte présentée comme un fait, conseil juridique ou financier implicite, hallucination sur un montant ou un délai | Responsabilité / IA | 3 | 3 | **9** | Moyen | Moyen | Réponses fondées sur les données affichées ; mention « assistant, à vérifier » ; jamais de décision par l'assistant ; journalisation |
| R10 | Données de démonstration perçues comme réelles ; confusion avec des opérateurs existants (marques, logos) | Propriété intellectuelle / Image | 3 | 3 | **9** | Moyen | **Moyen** | Opérateurs fictifs dans les données ; bandeau « données synthétiques » ; logos présentés comme écosystème visé et non comme clients ou partenaires |
| R11 | Dossier « inspiré d'ISO 20022 camt.056 » présenté comme un message conforme et accepté par PI-SPI | Contractuel / Image | 3 | 2 | **6** | Moyen | Moyen | Mention explicite « inspiré de », jamais « conforme » ; validation par un participant PI-SPI avant usage |
| R12 | Conservation excessive des réclamations, alertes et journaux d'audit ; journal immuable incompatible avec le droit à l'effacement | Données personnelles | 3 | 4 | **12** | Élevé | Faible | Durées par catégorie ; pseudonymisation du journal ; effacement des données sources, conservation des seules empreintes |
| R13 | Comptes de test et identifiants de démonstration accessibles publiquement | Sécurité | 2 | 3 | **6** | Moyen | Moyen | Comptes de démo sans données réelles ; désactivation avant toute mise en production ; mot de passe hors dépôt public |

---

## 5. Fiches des risques critiques et élevés

### R06 — Décision automatisée et profilage (score 16, critique)

**Description.** Le hub attribue à un bénéficiaire pseudonymisé un statut « mule probable ». Même sans gel automatique, si l'opérateur applique la recommandation sans examen réel, l'effet est celui d'une décision automatisée ayant des effets juridiques (blocage d'un compte, refus d'un service).

**Facteurs aggravants.** Pression des délais (88 % des dépôts retirés en espèces), tentation d'automatiser le gel pour « gagner des minutes », volume d'alertes.

**Facteurs atténuants.** Principe non négociable du produit : il recommande, il ne gèle jamais seul. Seuils visibles. Score sous le seuil affiché « à qualifier », jamais supprimé. Identité du validateur tracée.

| Option | Efficacité | Effort | Retenue |
|---|---|---|---|
| Validation humaine obligatoire avant toute mesure, avec motif écrit | Élevée | Faible | Oui |
| Affichage des motifs de l'alerte (plaignants, réseaux, délai, score) | Élevée | Faible | Oui |
| Procédure de contestation et de levée rapide pour la personne concernée | Élevée | Moyen | Oui |
| Mesure conservatoire limitée dans le temps (gel provisoire de quelques heures) plutôt que blocage | Moyenne | Moyen | À valider avec la BCEAO |

**Risque résiduel.** Moyen (8), sous réserve que la validation humaine soit effective et auditée.

### R01 — Base légale du partage inter-opérateurs (score 15)

**Description.** Les bénéficiaires visés par les réclamations ne sont pas clients de l'opérateur qui reçoit la plainte et n'ont consenti à rien. Le partage, même pseudonymisé, reste un traitement de données personnelles : une donnée pseudonymisée n'est pas anonyme.

**Pistes de base légale.** Intérêt légitime de prévention de la fraude ; exécution d'une obligation légale (traitement des réclamations, LBC/FT, sécurité des paiements) ; mission d'intérêt public si le hub est opéré par la BCEAO ou sous son égide.

**Recommandation.** Ne lancer aucun pilote sur données réelles sans avis écrit de l'autorité de protection des données du pays du pilote (APDP au Bénin en priorité) et sans analyse d'impact. Privilégier un hub opéré par un tiers de confiance (BCEAO, module PI-Reclam, Alliance Fintech UEMOA).

### R02 — Gel d'un innocent (score 15)

**Description.** Un faux positif peut priver une personne de ses fonds, l'exposer à une suspicion de fraude et engager la responsabilité de l'opérateur et, par ricochet, celle de l'éditeur. Le prototype mesure 42 % de précision sur la règle brute et 100 % après score, sur 5 campagnes synthétiques : cet échantillon ne permet aucune garantie sur données réelles.

**Recommandation.** Contractualiser que la plateforme fournit une aide à la décision ; plafonner la responsabilité de l'éditeur ; prévoir un circuit de levée sous quelques heures ; mesurer et publier le taux de faux positifs pendant le pilote.

### R03 — Secret bancaire (score 12)

**Description.** Les EME et banques sont tenues au secret. Communiquer à un concurrent qu'un de ses clients est visé par des plaintes, même sous forme d'empreinte, peut être qualifié de divulgation.

**Recommandation.** Faire confirmer par la BCEAO ou la Commission bancaire que l'échange d'empreintes à fin de lutte contre la fraude entre participants PI-SPI entre dans une exception au secret, ou l'inscrire dans les conventions de participation PI-SPI.

### R05 — Transferts transfrontaliers (score 12)

**Description.** Un consortium multi-pays (Bénin, Togo, Sénégal, Côte d'Ivoire) fait circuler des données entre juridictions dont les règles de transfert diffèrent.

**Recommandation.** Héberger le hub dans la zone UEMOA ; accomplir les formalités dans chaque pays avant d'y ouvrir le service ; commencer par un pilote mono-pays (deux opérateurs d'un même pays).

### R12 — Conservation et journal immuable (score 12)

**Description.** La piste d'audit est chaînée par hachage : on ne peut pas effacer une entrée sans casser la chaîne. Le droit à l'effacement et la limitation de conservation s'appliquent pourtant.

**Recommandation.** Ne jamais inscrire de donnée directement identifiante dans le journal (seulement des identifiants internes et des empreintes) ; fixer des durées par catégorie ; documenter la conservation au titre d'une obligation légale (preuve du traitement des réclamations).

---

## 6. Questions à poser à un juriste

1. Le partage d'empreintes HMAC d'alias de bénéficiaires entre émetteurs concurrents constitue-t-il un traitement de données personnelles soumis à autorisation préalable (et non à simple déclaration) au Bénin, au Togo, au Sénégal et en Côte d'Ivoire ?
2. Quelle base légale est la plus solide : intérêt légitime, obligation légale (Circulaire 002-2020/CB/C, Instruction 001-01-2024, LBC/FT) ou mission d'intérêt public si la BCEAO opère le hub ?
3. Le secret bancaire et le secret professionnel des EME admettent-ils une exception pour l'échange d'informations entre participants PI-SPI à fin de prévention de la fraude ? Faut-il l'inscrire dans les conventions de participation ?
4. Le hub est-il responsable conjoint de traitement avec les opérateurs, ou sous-traitant de chacun ? Quelles conséquences sur les contrats et sur les formalités ?
5. Une recommandation « mule probable » validée par un agent humain suffit-elle à écarter la qualification de décision individuelle automatisée ? Quelle information faut-il donner à la personne concernée, et à quel moment ?
6. Quelle mesure conservatoire un émetteur peut-il prendre sur un compte suspect sans décision de justice, et pour combien de temps ?
7. L'échange d'informations dans le consortium peut-il être regardé comme une pratique concertée au sens du droit de la concurrence UEMOA ? Quelles garanties de gouvernance prévoir ?
8. Comment concilier un journal d'audit chaîné et non modifiable avec le droit à l'effacement et les durées de conservation ?
9. Les logos d'opérateurs réels peuvent-ils figurer sur une page de présentation comme « écosystème visé » sans accord ? Sous quelle formulation ?
10. Quel régime de responsabilité et quel plafond contractuel sont acceptables pour un éditeur d'outil d'aide à la décision anti-fraude ?

---

## 7. Préalables à tout pilote

| # | Action | Responsable | Échéance |
|---|---|---|---|
| 1 | Relecture du présent document et des CGU / politique de confidentialité par un juriste du pays du pilote | Équipe | Avant tout échange de données réelles |
| 2 | Analyse d'impact relative à la protection des données (AIPD), centrée sur la ré-identification et le profilage | Équipe + DPO de l'opérateur | Avant pilote |
| 3 | Formalités auprès de l'autorité de protection des données du pays (APDP au Bénin en priorité) | Opérateur pilote, avec l'équipe | Avant pilote |
| 4 | Échange écrit avec la BCEAO ou la Commission bancaire sur le secret bancaire et l'articulation avec PI-Reclam | Équipe + opérateur | Avant pilote |
| 5 | Convention de consortium : finalité unique (fraude et litiges), données échangées, gouvernance, sortie, audits | Opérateurs + tiers de confiance | Avant pilote |
| 6 | Contrat de traitement (ou de responsabilité conjointe) entre le hub et chaque opérateur | Équipe + opérateurs | Avant pilote |
| 7 | Gestion de la clé de consortium : HSM, rotation, journal d'accès ; feuille de route PSI | Équipe technique | Avant pilote |
| 8 | Procédure de contestation et de levée pour les personnes concernées, délai cible en heures | Opérateur pilote | Avant pilote |
| 9 | Désignation d'un DPO ou d'un correspondant ; registre des traitements | Équipe | Avant pilote |
| 10 | Désactivation des comptes de démonstration et purge des données synthétiques de l'environnement de pilote | Équipe technique | Avant mise en production |

---

## 8. Cadre de référence

À vérifier dans leur version en vigueur avant toute citation.

| Domaine | Texte | Apport pour le projet |
|---|---|---|
| Monnaie électronique | Instruction BCEAO n° 008-05-2015 | Art. 18 : responsabilité de l'émetteur pour ses distributeurs. Art. 30 : dispositif de réclamations avec délai et traçabilité. Art. 35 : remboursement sous 3 jours ouvrés au plus |
| Réclamations | Circulaire n° 002-2020/CB/C | Dispositif interne obligatoire, réponse au client sous un mois, gratuité, saisine possible de la Commission bancaire |
| Services de paiement | Instruction BCEAO n° 001-01-2024 | Authentification forte, immatriculation des agents, responsabilité pleine de l'établissement |
| Paiement instantané | Conventions de participation PI-SPI, module PI-Reclam | Irrévocabilité, annulation subordonnée à l'accord du bénéficiaire, délais et pénalités (non publics) |
| Données — Bénin | Code du numérique (loi n° 2017-20), Autorité de protection des données personnelles (APDP) | Formalités préalables, droits des personnes, transferts |
| Données — Togo | Loi n° 2019-014 relative à la protection des données à caractère personnel, IPDCP | Formalités, droits, sécurité |
| Données — Sénégal | Loi n° 2008-12, Commission de protection des données personnelles (CDP) | Formalités, transferts |
| Données — Côte d'Ivoire | Loi n° 2013-450, ARTCI | Autorisation préalable de certains traitements, transferts |
| Concurrence | Règlements de l'UEMOA sur la concurrence | Échanges d'informations entre concurrents |
| LBC/FT | Loi uniforme relative à la lutte contre le blanchiment de capitaux et le financement du terrorisme (transposée dans chaque État) | Fondement possible d'un partage à fin de lutte contre la fraude |

---

*Document vivant : à mettre à jour à chaque changement de périmètre (passage à des données réelles, nouveau pays, nouvel opérateur, nouvelle fonction de l'assistant).*
