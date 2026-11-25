// Chiffres de la page d'accueil, dérivés des résultats mesurés (src/data/demo.json).
// Un seul endroit : si `npm run sync` change une mesure, la page suit sans retouche.
import { bench, demoCase, graphs, headline, volumes } from "@/lib/data";

/* eslint-disable @typescript-eslint/no-explicit-any */
const alerte = demoCase.alerte as Record<string, any>;
const graphe = graphs[alerte.alert_id ?? alerte.id];
const llmChamps = (bench.fields as any).llm?.extraction?.champs ?? {};
const coutLocal = (bench.cost as any).cout_inference_locale_pour_1000_fcfa;
const llm = (bench.throughput as any).llm ?? {};
/* eslint-enable @typescript-eslint/no-explicit-any */

/** La campagne racontée : la première victime, l'alerte, ce qui reste sur le compte. */
export const casDemo = {
  campagne: demoCase.campagne,
  plaignants: alerte.n_complainants as number,
  reseaux: (alerte.operators as string[]).length,
  delaiMin: alerte.detection_delay_minutes as number,
  heureAlerte: alerte.alert_at as string,
  totalFcfa: (alerte.total_fcfa_exact ?? alerte.total_fcfa) as number,
  encoreSurLeCompte: (alerte.freezable_at_last_update_fcfa ?? alerte.freezable_fcfa) as number,
  plaintes: (graphe?.edges ?? [])
    .filter((e) => e.ts && e.operator)
    .sort((a, b) => a.ts!.localeCompare(b.ts!))
    .map((e) => ({ heure: e.ts!, operateur: e.operator!, montant: e.amount_rounded_fcfa ?? 0 })),
};

/** Référence (opérateur seul) contre consortium, sur le même corpus. */
export const preuves = {
  corpus: volumes.n_reclamations,
  gelables: { seul: headline.solo.fcfa_encore_gelables_total, consortium: headline.consortium.fcfa_encore_gelables_total },
  delai: { seul: headline.solo.delai_detection_median_minutes, consortium: headline.consortium.delai_detection_median_minutes },
  campagnes: {
    seul: headline.solo.campagnes_detectees,
    consortium: headline.consortium.campagnes_detectees,
    injectees: headline.consortium.campagnes_injectees,
  },
  precision: { brute: headline.consortium.precision, apresScore: headline.prioritized.precision, seul: headline.solo.precision },
  ambigues: (bench.typology.sous_corpus_ambigu as { n: number }).n,
  ia: {
    mesure: llm.mesure === "mesuré sur cette machine",
    modele: String(llm.model ?? "").replace(/^.*\//, "").replace(/-Instruct-AWQ$/, ""),
    debit: llm.requests_per_second as number | undefined,
    f1Montant: llmChamps.montant_fcfa?.f1 as number | undefined,
    coutPour1000: typeof coutLocal === "number" ? coutLocal : undefined,
    gpu: String(bench.meta.config?.hardware?.gpu_name ?? ""),
  },
};

/** Nombre à la française. L'espace fine (U+202F) manque dans nos polices : espace insécable à la place. */
const nf = new Intl.NumberFormat("fr-FR");
export const nombre = (n: number) => nf.format(n).replace(/\u202f/g, "\u00a0");
