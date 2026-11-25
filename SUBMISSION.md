# Réclam'Graph — texte de soumission

**Équipe :** Token Titans (équipe 12) — GPU Challenge 2026
**Thème imposé :** analyse intelligente des réclamations clients
**Dépôt :** ce répertoire (`README.md`, `PITCH.md`, `DECISIONS.md`)

---

## Résumé en une phrase

Réclam'Graph croise les réclamations clients de plusieurs opérateurs de mobile money
pour démasquer les comptes mules **avant le retrait**, et transforme chaque plainte
légitime en **dossier de litige PI-SPI pré-rempli et minuté**.

## Le problème

La réclamation la plus fréquente de l'UEMOA (« j'ai envoyé au mauvais numéro ») et la
fraude la plus fréquente (« je me suis trompé de numéro, renvoyez-moi l'argent »)
emploient **les mêmes mots**. PI-SPI, en rendant les transferts irrévocables et
interopérables, place la victime chez un opérateur et le compte mule chez un autre :
**chaque opérateur ne voit que la moitié du dossier**. PI-Reclam transporte les
réclamations entre participants, mais rien de public n'indique qu'il les analyse.

Nous l'avons mesuré plutôt que supposé : sur les **1 330 plaintes** de notre corpus dont
le texte sert indifféremment aux deux récits, **aucun moteur de lecture de texte ne
dépasse le taux de la classe majoritaire**. Le signal n'est pas dans une plainte ; il
est dans le croisement de plusieurs.

## La solution

**Une entrée — la plainte. Deux sorties — geler ou rembourser.**

1. **Lire** : extraction JSON guidée (Qwen2.5 sur vLLM) d'un texte bruité.
2. **Pseudonymiser** : HMAC-SHA256 de l'alias du bénéficiaire avec une clé de
   consortium, chez l'opérateur. Le texte et l'identité ne sortent jamais ; le montant
   sort arrondi.
3. **Croiser** : hub networkx ; **3 plaignants indépendants, 2 réseaux, 60 minutes**
   → alerte « mule probable ».
4. **Agir** : alerte inter-opérateurs avec le montant encore gelable, ou demande
   d'annulation PI-SPI pré-remplie (ossature ISO 20022 camt.056), minuteur J+3 ouvrés /
   J+30 et piste d'audit chaînée par hachage.

**Réclam'Graph recommande et documente ; il ne gèle jamais de lui-même.** La décision
reste humaine, chez l'opérateur, et elle est tracée avec ses preuves et son validateur.

## Architecture

Six blocs — les trois premiers sur GPU : ① générateur synthétique (Qwen2.5-7B-AWQ +
Faker), ② extraction JSON (vLLM *guided decoding*), ③ embeddings bge-m3 (déduplication,
radar d'incidents), ④ pseudonymisation HMAC-SHA256, ⑤ hub graphe networkx avec règle et
score sur fenêtre glissante, ⑥ sorties : dossier de litige, minuteur, audit JSON,
interface Streamlit avec graphe animé. Schéma Mermaid complet dans le README.

Tous les appels LLM passent par un **unique client compatible OpenAI**
(`LLM_BASE_URL`, `LLM_MODEL`) : vLLM et Ollama sont interchangeables. Le modèle est
choisi d'après la VRAM détectée : Qwen2.5-7B-Instruct-AWQ au-delà de 12 Go (fp16 sur
T4, qui n'a pas de bf16), Qwen2.5-3B-Instruct en dessous.

## Trois commandes pour reproduire

```bash
make setup          # environnement virtuel + dépendances CPU épinglées
make all            # données (20 000 plaintes) + pipeline + banc de mesure + tests
make demo           # interface Streamlit, mode démo (aucun GPU requis)
```

Sur machine GPU, en plus : `make setup-gpu && make serve-llm`, puis
`make pipeline-llm && make bench-llm`, avec `bash scripts/record_gpu_evidence.sh` en
parallèle pour la preuve `nvidia-smi`.

## Résultats mesurés

Référence = **l'opérateur seul avec tri par mots-clés**, c'est-à-dire la situation
actuelle. Corpus : **20 000 réclamations synthétiques**, 7 jours, 3 opérateurs fictifs,
5 campagnes de mules, 1 incident PI-SPI, 2 leurres légitimes, 600 arnaques isolées.

| Métrique | Opérateur seul | Réclam'Graph |
|---|---|---|
| Rappel des campagnes de mules | **60 %** (3/5) | **100 %** (5/5) |
| Délai médian de détection | **29 min** | **13 min** |
| FCFA encore gelables (5 campagnes) | **367 000 FCFA** | **920 000 FCFA** |
| Précision des alertes | 75 % | 42 % règle brute → **100 %** après score |
| Radar d'incidents | — | rappel **100%** (1/1), pic à 29 σ, précision **50%** (1 faux positif) |
| F1 extraction des montants (cas récupérables) | **0,854** | **0,969** |
| F1 macro typologie | **0,978** (TF-IDF + logreg, supervisée) | 0,807 (sans étiquettes) |
| Part des données transmise au hub | — | **34 %** du corpus |
| Piste d'audit | — | **213 entrées**, chaîne intègre |

Fichiers de résultats : `results/benchmark.json`, `results/benchmark.md`,
`results/demo_bundle.json`, `results/mule_alerts.json`,
`results/baseline_alerts.json`, `results/incidents.json`, `results/dossiers.json`,
`results/audit.jsonl`, `results/gpu_log.txt`.

**125 tests** (`make test`) vérifient notamment : les 5 campagnes sont détectées, les
erreurs sincères produisent un dossier de remboursement **et aucune alerte**, le HMAC est
déterministe par clé, les minuteurs calculent J+3 ouvrés et J+30, l'audit contient les
preuves et le champ validateur, rien de nominatif ne quitte l'opérateur, et aucun
chiffre LLM non mesuré n'est publié.

## Ce qui a réellement tourné sur GPU

Mesuré le 25/11/2026 sur **Tesla T4 16 Go**, journal `nvidia-smi` dans
[`results/gpu_log.txt`](results/gpu_log.txt) :

| Étape | Mesure | Moteur |
|---|---|---|
| Extraction LLM | **3,087 requêtes/s** (400 appels) | Qwen2.5-7B-Instruct-AWQ, fp16 (le T4 n'a pas de bf16) |
| Embeddings | **25,65 textes/s**, 1024 dimensions | bge-m3 |
| Coût d'inférence locale | **28,31 FCFA / 1 000 réclamations** | 314,56 FCFA/h ÷ 3,087 req/s |
| Coût API cloud comparé | **70,68 FCFA / 1 000 réclamations** | dérivé de 642 tokens d'entrée + 108 de sortie comptés sur le corpus |

L'auto-hébergement revient donc à **environ 2,5 fois moins cher** que l'API cloud à ce
débit. Les deux restent marginaux face au **coût agent estimé à 270 000 FCFA pour
1 000 réclamations** : l'argument du projet n'est pas le coût unitaire du modèle, c'est
le croisement inter-opérateurs, que personne ne vend.

## Deux choses que nous disons nous-mêmes

1. **Sur la classification de typologie, la référence supervisée nous bat** (0,978 contre
   0,807). C'est attendu — la littérature le dit — et c'est publié tel quel. La valeur du
   projet n'est pas là : elle est dans le croisement inter-opérateurs.
2. **Les données sont synthétiques**, et les 5 campagnes rendent l'incertitude large sur
   le rappel et la précision. Le générateur et la vérité terrain sont publiés et la
   génération est déterministe, pour que tout soit rejouable.

## Hypothèses et limites

- Données **synthétiques**, opérateurs **fictifs**. Générateur et vérité terrain publiés.
- Les **FCFA gelables** viennent d'un modèle de retrait simulé, décrit dans le dépôt.
- Les mesures GPU viennent d'une **Tesla T4 16 Go** (session cloud), pas du poste de
  développement, qui est sans GPU. Chaque fichier de résultats nomme le moteur qui a
  réellement calculé : « GPU run — Tesla T4 — calculé sur GPU : LLM », ou
  « repli CPU sur machine équipée d'une T4 » quand rien n'a tourné sur la carte. Deux
  tests échouent si une étiquette annonce « GPU run » sans moteur GPU.
- Le **prix horaire du GPU** et le **tarif API cloud** sont des **prix publics affichés**
  relevés le 25/11/2026, pas des mesures de notre part : ils bougent, et le taux
  USD/FCFA avec eux (le FCFA est arrimé à l'euro, pas au dollar). Sources dans le README.
- Le **coût d'inférence locale** n'est calculé que si le débit a été mesuré sur un GPU :
  diviser un prix horaire de T4 par un débit CPU donnerait un chiffre flatteur et faux.
- Les **coûts agent** (270 / 700 FCFA par réclamation) sont des **estimations** issues
  d'offres d'emploi ; les prix proposés, TAM, SAM et SOM sont des **hypothèses**.
- Le chiffre de **~10 M réclamations par an** dans l'Union est une **extrapolation non
  sourcée** (aucune donnée publique UEMOA après 2021 n'a été trouvée).
- Les **délais et pénalités PI-Reclam ne sont pas publics** ; l'échéance utilisée est un
  paramètre configurable.
- Les règles du **2 novembre 2026** viennent de **sources secondaires**, à vérifier sur
  le communiqué BCEAO.
- Un **HMAC sur des numéros de téléphone reste attaquable par dictionnaire si la clé
  fuite**. En production : *private set intersection* ou hub opéré par un tiers de
  confiance (BCEAO, PI-Reclam, Alliance Fintech UEMOA).
- Nous ne prétendons pas comprendre les langues locales : le nouchi et le fon sont
  injectés comme **bruit lexical**, pas comme compréhension.

Liste complète : section « Hypothèses et limites » du README.

## Nouveauté — formulation exacte

Les briques existent (Proto, PI-Reclam, registres de fraude mutualisés ailleurs). Nous
n'avons trouvé aucune preuve publique d'un système qui tire le signal « compte mule » du
**texte des réclamations clients entre émetteurs de l'UEMOA**.

Formulation retenue : **« nouveau dans la zone et par la source du signal »** — jamais
« inédit au monde ».

## Demande

Un **pilote de 8 semaines** avec un opérateur du forum, sur un historique de litiges
anonymisé.

## Outils

Python, vLLM, Qwen2.5-7B-Instruct-AWQ, bge-m3, networkx, scikit-learn, Faker, pydantic,
Streamlit, Plotly, pytest. **Libres et ouverts uniquement. Aucun secret dans le dépôt.**
