// Copie dans web/src/data/demo.json la partie de ../results dont la plateforme a besoin.
// Aucun chiffre n'est saisi à la main : tout vient du pipeline Python (make all).
// Usage : npm run sync  (à relancer après chaque `make all` ou `make bench-llm`)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const results = join(here, "..", "..", "results");
const out = join(here, "..", "src", "data", "demo.json");
const read = (f) => JSON.parse(readFileSync(join(results, f), "utf-8"));

const bundle = read("demo_bundle.json");
const bench = read("benchmark.json");
const tokenCost = read("token_cost.json");

const slimAlert = (a) => ({
  id: a.alert_id,
  alias: a.alias_hmac,
  alertAt: a.alert_at,
  firstComplaintAt: a.first_complaint_at,
  delayMin: a.detection_delay_minutes,
  complainants: a.n_complainants,
  operators: a.operators,
  totalFcfa: a.total_fcfa,
  totalFcfaExact: a.total_fcfa_exact ?? null,
  freezableFcfa: a.freezable_fcfa,
  score: a.score,
  rule: a.rule,
  recommendation: a.recommendation,
  priority: Boolean(a.is_priority),
  freezableAtLastUpdate: a.freezable_at_last_update_fcfa ?? null,
  detectedBy: a.detected_by ?? null,
  campaign: a.gt_campaign_id ?? null,
  isTrue: a.gt_campaign_id ? true : a.gt_is_mule ?? null,
  complaintRefs: a.evidence_complaint_refs ?? [],
});

const slimDossier = (d) => ({
  id: d.dossier_id,
  complaintId: d.complaint_id,
  operator: d.operator,
  decision: d.decision,
  typology: d.typology,
  amountFcfa: d.amount_fcfa,
  beneficiary: d.beneficiary_alias,
  destination: d.destination_operator,
  timer: d.timer,
  text: d.evidence?.texte_brut ?? "",
  channel: d.evidence?.canal ?? "",
  receivedAt: d.evidence?.recue_le ?? "",
  motivation: d.evidence?.motivation ?? "",
  extraction: d.evidence?.extraction ?? null,
  iso: d.iso20022_inspired,
});

// Garde les dossiers les plus parlants : tous les GELER, puis REMBOURSER, puis A_INSTRUIRE.
const order = { GELER: 0, REMBOURSER: 1, A_INSTRUIRE: 2 };
const dossiers = [...bundle.dossiers]
  .sort((a, b) => (order[a.decision] ?? 9) - (order[b.decision] ?? 9))
  .slice(0, 60)
  .map(slimDossier);

const data = {
  meta: {
    generatedAt: bundle.meta.genere_le,
    executionLabel: bundle.meta.etiquette_execution,
    data: bundle.meta.donnees,
    extractionEngines: bundle.meta.moteurs_extraction,
    extractionEngineDetail: bundle.meta.moteur_extraction_detail,
    embeddings: bundle.meta.moteur_embeddings,
    llm: bundle.meta.llm,
    timings: bundle.meta.temps,
    privacy: bundle.meta.confidentialite,
    rule: bundle.meta.config?.mule_rule ?? null,
    deadlines: bundle.meta.config?.deadlines ?? null,
  },
  volumes: bundle.volumes,
  alerts: bundle.alertes_consortium.map(slimAlert),
  soloAlerts: bundle.alertes_operateur_seul.map(slimAlert),
  incidents: bundle.incidents,
  incidentEval: bundle.evaluation_incidents,
  graphs: bundle.graphes,
  freezableCurves: bundle.courbes_gelables,
  demoCase: bundle.cas_demo,
  dossiers,
  dossierSummary: bundle.resume_dossiers,
  audit: bundle.audit,
  campaigns: bundle.verite_terrain.campagnes.map((c) => ({
    id: c.campaign_id,
    label: c.label,
    muleOperator: c.mule_operator,
    totalFcfa: c.total_fcfa,
    victims: c.n_victims,
    operators: c.operators,
    firstCreditAt: c.first_credit_at,
    firstComplaintAt: c.first_complaint_at,
    cashoutStartAt: c.cashout_start_at,
    narrative: Boolean(c.narrative_demo_case),
  })),
  bench: {
    meta: bench.meta,
    typology: bench.typologie,
    fields: bench.extraction_champs,
    mules: bench.detection_mules,
    throughput: bench.debit,
    cost: bench.cout,
    gpu: bench.gpu,
  },
  tokenCost,
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data));
console.log(`demo.json écrit (${(JSON.stringify(data).length / 1024).toFixed(0)} Ko)`);
