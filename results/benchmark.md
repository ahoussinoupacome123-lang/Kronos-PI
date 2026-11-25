# Réclam'Graph — résultats face à la référence

> **Données synthétiques.** SYNTHÉTIQUES — opérateurs fictifs, générateur publié  
> **Exécution :** CPU run — aucun GPU détecté (ne pas présenter comme des chiffres GPU)  
> **Généré le :** 2026-11-25T10:26:09.143272+01:00  
> **Corpus :** 20 000 réclamations  
> Aucun chiffre de ce fichier n'est écrit en dur : tout provient d'une exécution de bench/benchmark.py sur les données du dépôt.

La référence est **l'opérateur seul avec son tri par mots-clés**, c'est-à-dire la situation actuelle.

## 1. Tableau de synthèse

| Tâche | Référence | Réclam'Graph | Métrique |
|---|---|---|---|
| Typologie | 0.98 (TF-IDF + logreg, supervisée) | 0.81 (extracteur, sans étiquettes) | F1 macro |
| Extraction de champs | 0.96 | 0.98 | F1 moyenne sur 5 champs |
| Détection de mules — rappel | 0.6 (3/5) | 1 (5/5) | campagnes détectées |
| Détection de mules — précision | 0.75 | 0.42 brute / 1 après score | alertes vraies / alertes émises |
| **Délai de détection (médiane)** | 29 min | **13 min** | minutes depuis la 1re plainte |
| **FCFA encore gelables** | 367 000 FCFA | **920 000 FCFA** | somme sur les 5 campagnes |
| Incidents | — | non mesuré | voir `results/incidents.json` |

### Comment lire la ligne « typologie »

Attendu et confirmé : la classification est « quasi ex aequo ». C'est pour cela que la démonstration ne repose PAS sur la classification mais sur la corrélation inter-opérateurs.

### Comment lire la ligne « détection de mules »

C'est l'écart principal de la démonstration : non pas la qualité du texte, mais le fait de voir les autres réseaux.

Règle appliquée : **3 plaignants indépendants, 2 opérateurs distincts, fenêtre de 60 minutes**. Réclam'Graph recommande et documente ; il ne gèle jamais de lui-même.

## 2. Détection de mules, campagne par campagne

| Campagne | Mule hébergée chez | Total | Consortium | Délai | FCFA gelables | Opérateur seul |
|---|---|---|---|---|---|---|
| CMP-01 | BETACASH | 162 000 FCFA | détectée | 12 min | 162 000 FCFA | 43 min / 0 FCFA |
| CMP-02 | ALPHAMONEY | 182 000 FCFA | détectée | 12 min | 182 000 FCFA | 26 min / 162 000 FCFA |
| CMP-03 | GAMMAPAY | 155 000 FCFA | détectée | 15 min | 155 000 FCFA | **non détectée** |
| CMP-04 | BETACASH | 241 000 FCFA | détectée | 13 min | 241 000 FCFA | 29 min / 205 000 FCFA |
| CMP-05 | ALPHAMONEY | 180 000 FCFA | détectée | 15 min | 180 000 FCFA | **non détectée** |

Les campagnes que l'opérateur seul ne voit pas sont celles dont les victimes sont réparties sur plusieurs réseaux : aucun opérateur n'atteint seul le seuil de trois plaignants. Quand il les voit, c'est plus tard — et s'il n'héberge pas le compte, il ne peut rien suspendre.

## 3. Extraction de champs, champ par champ

F1 sur les cas **récupérables** (la valeur est bien dans le texte), et entre parenthèses la F1 brute sur tous les cas de la vérité terrain.

| Champ | Référence regex | Extracteur local | Cas récupérables |
|---|---|---|---|
| montant_fcfa | 0.85 (0.85) | 0.97 (0.97) | 18851 / 18851 |
| alias_beneficiaire | 1 (0.82) | 1 (0.82) | 4937 / 7100 |
| msisdn_beneficiaire | 1 (0.43) | 1 (0.43) | 1940 / 7093 |
| reseau_destination | 1 (0.72) | 1 (0.72) | 7108 / 12769 |
| heure_operation | 0.94 (0.29) | 0.94 (0.29) | 3878 / 20000 |

f1_recuperable : seulement les plaintes dont le texte contient réellement la valeur attendue — c'est la mesure d'une capacité. f1_brut : tous les cas où la vérité terrain a une valeur, y compris ceux que le texte ne mentionne pas et qu'aucun extracteur ne peut donc deviner. Les deux sont publiés.

L'écart se creuse sur les montants mal écrits (« 25mil », « vingt cinq mille ») que la regex ne sait pas lire. Les alias et numéros, eux, sont copiés tels quels et la regex les attrape.

## 4. Débit et coût

| Grandeur | Valeur | Étiquette |
|---|---|---|
| Débit référence regex | 17 523.08 réclamations/s | CPU run — aucun GPU détecté (ne pas présenter comme des chiffres GPU) |
| Débit extracteur local | 11 448.16 réclamations/s | CPU run — aucun GPU détecté (ne pas présenter comme des chiffres GPU) |
| Débit LLM | non mesuré requêtes/s | non mesuré |
| Prix horaire GPU | 314.56 | paramètre `config.py` |
| Inférence locale / 1 000 réclamations | non calculé | calculé si le prix horaire est rempli |
| API cloud / 1 000 | 70.68 | paramètre `config.py` |
| Agent humain / 1 000 (simple) | 270 000 FCFA | estimation (offres d'emploi, section 12) |
| Agent humain / 1 000 (investiguée) | 700 000 FCFA | estimation (offres d'emploi, section 12) |
| Repère — Intercom Fin (par résolution) / 1 000 | 590 000 FCFA | prix public affiché |
| Repère — Thematic (par commentaire) / 1 000 | 600 000 FCFA | prix public affiché |
| Prix proposé / 1 000 | 5 000 FCFA | **hypothèse** de modèle économique |

### Avertissements de lecture

- Le prix horaire du GPU et le tarif API cloud sont des PRIX PUBLICS AFFICHÉS relevés le 25/11/2026, pas des mesures de notre part. Ils bougent, et le taux USD/FCFA avec eux.
- Le coût d'inférence locale n'est calculé que si le débit a été mesuré sur un GPU : diviser un prix horaire de GPU par un débit CPU donnerait un chiffre flatteur et faux.
- Les coûts humains (270 / 700 FCFA par réclamation) sont des ESTIMATIONS issues d'offres d'emploi, pas des mesures.
- Les repères éditeurs (Intercom Fin, Thematic) sont des prix publics affichés, pas des mesures de notre part.
- Le prix proposé de 5 FCFA par réclamation est une HYPOTHÈSE de modèle économique.
- AUCUN GPU DÉTECTÉ : le débit ci-dessus est un débit CPU. Il ne doit pas être présenté comme un débit GPU.

## 5. Preuve d'utilisation du GPU

- results/gpu_log.txt absent. Lancer `scripts/record_gpu_evidence.sh` pendant un traitement sur la machine GPU.

## 6. Ce que ce tableau ne dit pas

- Les données sont **synthétiques**. Le générateur et la vérité terrain sont dans ce dépôt (`src/reclam_graph/datagen/`, `data/ground_truth.json`) : les chiffres sont reproductibles, mais ils décrivent un scénario simulé, pas un trafic réel.
- Les **FCFA gelables** reposent sur un modèle de retrait simulé, décrit dans `datagen/scenarios.py`. C'est une grandeur du scénario, pas une mesure de terrain.
- L'**extracteur local** a été écrit en connaissant les formulations du générateur : sa F1 est optimiste par construction et ne remplace pas une mesure du LLM sur la machine GPU.
- Les campagnes synthétiques sont au nombre de **5** : un rappel exprimé sur 5 cas a une incertitude large.
