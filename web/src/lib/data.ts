// Accès typé aux résultats du pipeline (src/data/demo.json, produit par `npm run sync`).
// Tout ce que la plateforme affiche vient d'ici : aucun chiffre n'est écrit en dur dans les pages.
import raw from "@/data/demo.json";

export type Alert = {
  id: string;
  alias: string;
  alertAt: string;
  firstComplaintAt: string;
  delayMin: number;
  complainants: number;
  operators: string[];
  totalFcfa: number;
  totalFcfaExact: number | null;
  freezableFcfa: number;
  score: number;
  rule: string;
  recommendation: string;
  priority: boolean;
  freezableAtLastUpdate: number | null;
  detectedBy: string | null;
  campaign: string | null;
  isTrue: boolean | null;
  complaintRefs: string[];
};

export type Timer = {
  opened_at: string;
  refund_due_at: string;
  client_answer_due_at: string;
  pi_reclam_due_at: string;
  refund_business_days: number;
  client_answer_calendar_days: number;
  pi_reclam_hours: number;
  pi_reclam_deadline_is_public: boolean;
  notes: string;
};

export type Dossier = {
  id: string;
  complaintId: string;
  operator: string;
  decision: "GELER" | "REMBOURSER" | "A_INSTRUIRE";
  typology: string;
  amountFcfa: number | null;
  beneficiary: string | null;
  destination: string | null;
  timer: Timer;
  text: string;
  channel: string;
  receivedAt: string;
  motivation: string;
  extraction: Record<string, unknown> | null;
  iso: unknown;
};

export type GraphNode = { id: string; kind: "beneficiaire" | "plaignant" | "operateur"; label: string; operator?: string; order?: number; ts?: string };
export type GraphEdge = { source: string; target: string; ts?: string; operator?: string; amount_rounded_fcfa?: number; typology?: string; order?: number; after_alert?: boolean };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; fires_at: string | null };

type MuleSide = {
  campagnes_injectees: number;
  campagnes_detectees: number;
  rappel: number;
  alertes_totales: number;
  alertes_vraies: number;
  faux_positifs: number;
  precision: number;
  delai_detection_median_minutes: number | null;
  fcfa_encore_gelables_total: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const d = raw as any;

export const meta = d.meta as {
  generatedAt: string;
  executionLabel: string;
  data: string;
  extractionEngines: string[];
  extractionEngineDetail: string[];
  embeddings: { engine: string; engine_detail: string; device: string; texts_per_second: number };
  llm: { model: string; requests: number; mesure: string; requests_per_second: number | null; tokens_per_second: number | null };
  timings: { total_s: number; reclamations_par_seconde_extraction: number };
  privacy: { algorithme: string; ne_sort_jamais: string[]; sort: string[]; limite_connue: string; production: string };
};

export const volumes = d.volumes as {
  n_reclamations: number;
  n_enregistrements_partages: number;
  part_partagee: number;
  decisions_corpus_complet: Record<string, number>;
};

export const alerts = d.alerts as Alert[];
export const soloAlerts = d.soloAlerts as Alert[];
export const graphs = d.graphs as Record<string, Graph>;
export const freezableCurves = d.freezableCurves as Record<string, [string, number][]>;
export const dossiers = d.dossiers as Dossier[];
export const dossierSummary = d.dossierSummary as {
  n_dossiers: number;
  par_decision: Record<string, number>;
  principe: string;
  seuils_affiches: { operateurs_distincts_minimum: number; plaignants_independants_minimum: number; fenetre_minutes: number };
};
export const audit = d.audit as { n_entrees: number; par_action: Record<string, number>; chaine_integre: boolean; entrees_en_attente_de_validation: number; base_reglementaire: string; portee_du_chainage: string };
export const campaigns = d.campaigns as { id: string; label: string; muleOperator: string; totalFcfa: number; victims: number; operators: string[]; firstCreditAt: string; firstComplaintAt: string; cashoutStartAt: string; narrative: boolean }[];
export const incidents = d.incidents as { incident_id: string; detected_at: string; window_start: string; window_end: string; operator: string | null; typology: string; count: number; baseline_mean: number; zscore: number; sample_texts: string[]; label: string }[];
export const incidentEval = d.incidentEval as { incidents_injectes: number; incidents_detectes: number; rappel: number; faux_positifs: number; precision: number; note_precision: string };
export const demoCase = d.demoCase as {
  campagne: string;
  reclamation: { complaint_id: string; operator: string; channel: string; received_at: string; complainant_name: string; text: string };
  extraction: { typology: string; amount_fcfa: number; event_at: string; beneficiary_alias: string; destination_operator: string; engine: string; confidence: number };
  alerte: Alert & Record<string, any>;
};
export const bench = d.bench as {
  meta: Record<string, any>;
  typology: Record<string, { f1_macro: number }> & Record<string, any>;
  fields: Record<string, any>;
  mules: { avec_extraction_regex: { consortium: MuleSide; operateur_seul: MuleSide; consortium_prioritaires: MuleSide }; avec_extraction_heuristique: { consortium: MuleSide; operateur_seul: MuleSide; consortium_prioritaires: MuleSide }; regle: string; lecture: string };
  throughput: Record<string, { reclamations_par_seconde?: number; mesure?: string; etiquette?: string }>;
  cost: Record<string, any>;
  gpu: { disponible: boolean; n_echantillons: number; utilisation_moyenne_pct: number; utilisation_max_pct: number; memoire_max_mib: number; memoire_totale_mib: number };
};
export const tokenCost = d.tokenCost as { cout_api_cloud_pour_1000_fcfa: number; tokens_entree_par_reclamation: number; tokens_sortie_par_reclamation: number };
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Chiffres phares : extraction heuristique, celle du run publié dans le README. */
export const headline = (() => {
  const m = bench.mules.avec_extraction_heuristique;
  return {
    solo: m.operateur_seul,
    consortium: m.consortium,
    prioritized: m.consortium_prioritaires,
    rule: bench.mules.regle,
  };
})();

/** Le run est-il vraiment passé par le LLM et bge-m3 ? Affiché partout où l'étiquette GPU apparaît. */
export const engineTruth = {
  usedLlm: meta.extractionEngines.includes("llm"),
  usedBgeM3: meta.embeddings.engine === "bge-m3",
  gpuAvgPct: bench.gpu.utilisation_moyenne_pct,
};

export const OPERATORS = ["ALPHAMONEY", "BETACASH", "GAMMAPAY"] as const;
export const operatorColor: Record<string, string> = {
  ALPHAMONEY: "var(--color-indigo)",
  BETACASH: "var(--color-sage)",
  GAMMAPAY: "var(--color-amber)",
};

const nf = new Intl.NumberFormat("fr-FR");
export const fcfa = (n: number | null | undefined) => (n == null ? "—" : `${nf.format(Math.round(n))} FCFA`);
export const num = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
export const pct = (n: number | null | undefined, digits = 0) => (n == null ? "—" : `${num(n * 100, digits)} %`);

export const hhmm = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" }).format(new Date(iso));
export const dayHhmm = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" }).format(new Date(iso));

export const typologyLabel: Record<string, string> = {
  ARNAQUE_ERREUR_DEPOT: "Arnaque « erreur de dépôt »",
  ERREUR_DESTINATAIRE_SINCERE: "Erreur de destinataire sincère",
  RETARD_TIMEOUT: "Transfert bloqué / délai",
  FRAIS_CONTESTES: "Frais contestés",
  CHANGEMENT_NUMERO: "Changement de numéro",
  AGENT_DISTRIBUTEUR: "Litige avec un agent",
  AUTRE: "Autre",
};

export const decisionLabel: Record<string, string> = {
  GELER: "Geler (recommandé)",
  REMBOURSER: "Rembourser",
  A_INSTRUIRE: "À instruire",
};

/** Heure de référence de la démo : une heure après la dernière alerte du corpus, pour que tout ce qui est affiché soit déjà arrivé. */
export const DEMO_NOW = (() => {
  const last = Math.max(...(d.alerts as Alert[]).map((a) => new Date(a.alertAt).getTime()));
  const t = new Date(last + 3_600_000);
  t.setUTCMinutes(0, 0, 0);
  return t.toISOString();
})();
