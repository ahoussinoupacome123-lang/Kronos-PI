# Politique de confidentialité

Version 1.0 — 25 novembre 2026

## 1. En bref

- La Plateforme Réclam'Graph est un **prototype** qui ne traite que des **données synthétiques**. Aucune donnée réelle de client ou de bénéficiaire n'y est traitée.
- Les seules données personnelles réelles traitées aujourd'hui sont celles des **utilisateurs de la Plateforme** : identifiants de compte et journaux de connexion.
- Un seul cookie est déposé : un **cookie de session technique**, nécessaire à la connexion. Aucun traceur publicitaire, aucune mesure d'audience tierce.
- La présente politique décrit aussi, pour la transparence, la manière dont la Plateforme est conçue pour traiter des données réelles lors d'un futur pilote.

## 2. Qui est responsable

### 2.1 Pour la Plateforme actuelle

L'Équipe Token Titans — GPU Challenge 2026, Epitech Bénin, Cotonou, est responsable du traitement des données des utilisateurs de la Plateforme.

### 2.2 Pour un futur pilote

Dans un pilote sur données réelles, les rôles seraient répartis ainsi, sous réserve de validation juridique :

| Acteur | Rôle envisagé | Données |
|---|---|---|
| Chaque établissement participant (EME, banque) | Responsable de traitement pour les réclamations de ses clients | Texte de la réclamation, identité et numéro du plaignant |
| Le hub Réclam'Graph | Sous-traitant de chaque établissement, ou responsable conjoint selon la gouvernance retenue | Données pseudonymisées uniquement |
| Un tiers de confiance (BCEAO, PI-Reclam, Alliance Fintech UEMOA), s'il opère le hub | Responsable ou sous-traitant selon la convention | Données pseudonymisées uniquement |

## 3. Données traitées

### 3.1 Utilisateurs de la Plateforme

| Donnée | Finalité | Base légale |
|---|---|---|
| Adresse électronique, nom affiché, rôle | Créer et gérer le compte, contrôler les accès | Exécution des CGU |
| Mot de passe (stocké sous forme d'empreinte) | Authentifier l'utilisateur | Exécution des CGU |
| Journaux de connexion et d'action (date, heure, action, adresse IP) | Sécurité, traçabilité des décisions, détection des abus | Intérêt légitime de l'Éditeur |
| Échanges avec l'assistant Nexus | Fournir la réponse, sécurité, amélioration du prototype | Intérêt légitime de l'Éditeur |

### 3.2 Données de démonstration

Les réclamations, alias, numéros, montants, alertes et dossiers affichés sont **générés** et ne correspondent à aucune personne réelle. Ils ne sont pas des données personnelles.

### 3.3 Conception pour un pilote : ce qui ne quitte jamais l'établissement

La Plateforme est conçue selon un principe de minimisation. Lors d'un pilote, la répartition serait la suivante :

| Champ | Reste chez l'établissement | Transmis au hub |
|---|---|---|
| Texte de la réclamation | Oui | Non |
| Identité et numéro du plaignant | Oui | Non |
| Alias du bénéficiaire | Oui | Sous forme d'empreinte HMAC-SHA256 uniquement |
| Opérateur, horodatage, typologie | Oui | Oui |
| Montant | Oui (exact) | Arrondi |
| Indices d'arnaque extraits du texte | Oui | Non |

## 4. Bases légales envisagées pour un pilote

Le croisement inter-établissements de données pseudonymisées ne sera mis en œuvre qu'après validation de sa base légale par les autorités compétentes. Les pistes étudiées sont l'intérêt légitime de prévention de la fraude, le respect d'obligations légales (traitement des réclamations, sécurité des paiements, lutte contre le blanchiment) et, si le hub est opéré par une autorité, une mission d'intérêt public.

## 5. Décision humaine

Aucune décision produisant des effets à l'égard d'une personne (gel, blocage, refus) n'est prise automatiquement. La Plateforme émet des recommandations ; la décision appartient à une personne habilitée de l'établissement, et elle est tracée avec ses motifs.

## 6. Durées de conservation

| Catégorie | Durée |
|---|---|
| Compte utilisateur | Pendant la durée du prototype, puis suppression sous 3 mois après sa clôture |
| Journaux de connexion | 12 mois |
| Échanges avec Nexus | 3 mois |
| Données de démonstration | Pendant la durée du prototype |
| Pilote — empreintes et métadonnées au hub | Durée de la fenêtre d'analyse, à fixer avec les autorités (cible : quelques jours, prolongée seulement pour une alerte confirmée) |
| Pilote — journal d'audit | Durée de preuve réglementaire, sans donnée directement identifiante |

## 7. Droits des personnes

Toute personne dispose, dans les conditions prévues par la loi applicable, d'un droit d'accès, de rectification, d'effacement, d'opposition et de limitation, ainsi que du droit de contester une mesure prise à son égard et d'obtenir l'intervention d'une personne.

Pour exercer ces droits : dpo@reclamgraph.example

Toute personne peut aussi saisir l'autorité de protection des données compétente, notamment l'Autorité de protection des données personnelles (APDP) au Bénin, l'Instance de protection des données à caractère personnel (IPDCP) au Togo, la Commission de protection des données personnelles (CDP) au Sénégal ou l'ARTCI en Côte d'Ivoire.

## 8. Délégué à la protection des données

Un délégué à la protection des données sera désigné avant tout pilote sur données réelles. Dans l'intervalle, les demandes sont adressées à : dpo@reclamgraph.example

## 9. Transferts

Les données des utilisateurs du prototype peuvent être hébergées par un prestataire d'hébergement en nuage situé hors de l'UEMOA. Pour un pilote, le hub serait hébergé dans la zone UEMOA, et les formalités de transfert seraient accomplies dans chaque pays concerné avant l'ouverture du service.

## 10. Sécurité

- Mots de passe stockés sous forme d'empreinte, jamais en clair.
- Connexions chiffrées (HTTPS).
- Accès limités selon le rôle.
- Pour un pilote : pseudonymisation des alias par HMAC-SHA256 avec une clé de consortium conservée dans un module matériel sécurisé, avec rotation.
- Limite connue et assumée : une empreinte HMAC sur des numéros de téléphone peut être attaquée par dictionnaire si la clé fuit. En production, la Plateforme évoluera vers une intersection d'ensembles privée (PSI), qui permet de constater une correspondance sans partager les identifiants, ou vers un hub opéré par un tiers de confiance.
- Piste d'audit chaînée par hachage, qui permet de détecter une altération du journal.

## 11. Cookies

La Plateforme dépose **un seul cookie** :

| Cookie | Finalité | Durée | Consentement |
|---|---|---|---|
| Cookie de session | Maintenir l'utilisateur connecté | Durée de la session, au plus 8 heures | Non requis : strictement nécessaire |

Aucun cookie publicitaire, aucun traceur de mesure d'audience tiers, aucun partage avec des réseaux sociaux.

## 12. Modifications

La présente politique peut évoluer, notamment avant un pilote sur données réelles. La version en vigueur est publiée sur la Plateforme avec son numéro et sa date.

## 13. Contact

Questions générales : contact@reclamgraph.example
Protection des données : dpo@reclamgraph.example
