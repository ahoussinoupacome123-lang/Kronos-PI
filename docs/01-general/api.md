# API — contrat cible

> Contrat de l'API FastAPI qui reliera le pipeline Python à la plateforme web et aux SI des opérateurs (exigences API-01 à API-04). **Non implémentée au 25/11/2026** : la plateforme web lit aujourd'hui `results/` directement (mode démo). Les schémas réutilisent ceux de `src/reclam_graph/schemas.py`.

## 1. Conventions

| Élément | Règle |
|---|---|
| Base URL | `https://api.<domaine>/v1` (local : `http://localhost:8080/v1`) |
| Versioning | Préfixe `/v1` |
| Format | JSON UTF-8, dates ISO 8601 avec fuseau (`+01:00`), montants en FCFA entiers |
| Authentification | `Authorization: Bearer <jeton>` ; OAuth2 *client credentials* pour les opérateurs, session pour la plateforme web |
| Cloisonnement | Un jeton d'opérateur ne voit que ses réclamations, ses dossiers et les alertes qui le concernent |
| Pagination | `?limit=50&cursor=<opaque>` ; réponse `{ "items": [...], "next_cursor": "..." }` |
| Erreurs | `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }` |
| Codes | 200, 201, 400, 401, 403, 404, 409, 422, 429, 500 |
| Traçabilité | Toute écriture produit une entrée d'audit ; l'identifiant est renvoyé (`audit_entry_id`) |

## 2. Endpoints

### Réclamations

| Méthode | Route | Rôle | Corps / paramètres | Réponse |
|---|---|---|---|---|
| POST | `/complaints` | Soumettre une réclamation brute (côté opérateur) | `Complaint` : `complaint_id`, `operator`, `channel`, `received_at`, `text`, `complainant_msisdn` | 201 `{ extraction, decision, shared_record_sent, dossier_id? }` |
| GET | `/complaints/{id}` | Détail (opérateur propriétaire seulement) | — | `Complaint` + `Extraction` |
| POST | `/complaints/extract` | Extraction seule, sans partage (essai) | `{ text }` | `Extraction` + `engine` |

### Alertes mules

| Méthode | Route | Rôle | Paramètres | Réponse |
|---|---|---|---|---|
| GET | `/alerts` | Liste des alertes concernant l'appelant | `status` (`prioritaire`, `a_qualifier`), `since`, `limit` | `MuleAlert[]` |
| GET | `/alerts/{id}` | Détail, preuves, graphe local | — | `MuleAlert` + `graph { nodes, edges }` |
| POST | `/alerts/{id}/decision` | Décision humaine | `{ decision: "GEL_RECOMMANDE" \| "REJETEE" \| "A_SUIVRE", validator, comment }` | 200 + `audit_entry_id` |

Exemple de `MuleAlert` :

```json
{
  "alert_id": "ALERT-consortium-28f7c19455",
  "alias_hmac": "28f7c19455c7c685",
  "first_complaint_at": "2026-11-17T14:09:00+01:00",
  "alert_at": "2026-11-17T14:21:00+01:00",
  "detection_delay_minutes": 12.0,
  "n_complainants": 7,
  "n_operators": 3,
  "operators": ["ALPHAMONEY", "BETACASH", "GAMMAPAY"],
  "total_fcfa": 160000,
  "freezable_fcfa": 162000,
  "score": 0.8437,
  "rule": "3 plaignants distincts, 2 opérateurs distincts, fenêtre de 60 min",
  "evidence_complaint_refs": ["RC-000001"]
}
```

### Dossiers de litige

| Méthode | Route | Rôle | Paramètres | Réponse |
|---|---|---|---|---|
| GET | `/dossiers` | Liste avec urgence du minuteur | `decision`, `urgency`, `limit` | `DisputeFile[]` |
| GET | `/dossiers/{id}` | Détail : message inspiré camt.056, minuteur, preuves | — | `DisputeFile` |
| POST | `/dossiers/{id}/validate` | Validation par un agent avant envoi | `{ validator }` | 200 + `audit_entry_id` |
| POST | `/dossiers/{id}/send` | Envoi vers PI-Reclam (P2) | — | 202 |

### Incidents

| Méthode | Route | Rôle | Réponse |
|---|---|---|---|
| GET | `/incidents` | Alertes du radar | `IncidentAlert[]` |

### Métriques

| Méthode | Route | Rôle | Réponse |
|---|---|---|---|
| GET | `/metrics` | Synthèse référence contre consortium (contenu de `benchmark.json`) avec l'étiquette d'exécution et les moteurs | `{ mules, extraction, typologie, cout, gpu, meta }` |
| GET | `/metrics/gpu` | Journal `nvidia-smi` agrégé | `{ samples, mean_util, max_util, max_mem_mib }` |

### Audit

| Méthode | Route | Rôle | Réponse |
|---|---|---|---|
| GET | `/audit` | Entrées du journal (filtrables) | `AuditEntry[]` |
| GET | `/audit/verify` | Vérifie le chaînage | `{ integre: bool, anomalies: [] }` |

### Assistant Nexus

| Méthode | Route | Rôle | Corps | Réponse |
|---|---|---|---|---|
| POST | `/assistant` | Question en langage naturel | `{ message, context: { page, selection? } }` | `{ answer, sources: [{ type, id }], suggested_actions: [{ label, href }] }` |

Règles : Nexus ne répond qu'à partir des données accessibles à l'appelant, cite ses sources, et ne déclenche jamais d'action irréversible (il propose un lien vers l'action, que l'utilisateur valide).

## 3. Webhooks (P2)

| Événement | Charge utile | Destinataire |
|---|---|---|
| `alert.created` | `MuleAlert` | Opérateurs listés dans `operators` |
| `dossier.deadline_soon` | `{ dossier_id, due_at, kind }` | Opérateur propriétaire |
| `incident.created` | `IncidentAlert` | Participants concernés |

Signature : en-tête `X-ReclamGraph-Signature` (HMAC-SHA256 du corps avec le secret du webhook).
