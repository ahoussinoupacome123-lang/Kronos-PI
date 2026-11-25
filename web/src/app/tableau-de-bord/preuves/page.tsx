import { Kpi, PageHead, Panel } from "@/components/dashboard/ui";
import { IconChip } from "@/components/ui/icons";
import { bench, engineTruth, fcfa, headline, meta, num, pct, tokenCost, volumes } from "@/lib/data";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Preuves mesurées" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProofsPage() {
  const solo = headline.solo;
  const cons = headline.consortium;
  const prio = headline.prioritized;
  const typo = bench.typology as any;
  const fields = (bench.fields as any)?.reference_regex?.champs ?? null;
  const fieldsLocal = (bench.fields as any)?.heuristique_locale?.champs ?? (bench.fields as any)?.extracteur?.champs ?? null;
  const cost = bench.cost as any;
  const thr = bench.throughput as any;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="Preuves mesurées"
        lead={
          <>
            Tout ce qui est affiché ici sort de <code className="font-mono text-[0.9em]">bench/benchmark.py</code>, exécuté le{" "}
            {new Date(meta.generatedAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })} sur {num(volumes.n_reclamations)} réclamations
            synthétiques. Ce qui n&apos;est pas mesuré est écrit « non mesuré ».
          </>
        }
      />

      {!engineTruth.usedLlm && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-5 text-sm text-ink">
          <IconChip size={22} className="shrink-0 text-amber-deep" />
          <p>
            <strong className="font-semibold">Ce que le GPU a fait dans ce run, honnêtement.</strong> L&apos;étiquette d&apos;exécution est « {meta.executionLabel} »,
            mais l&apos;extraction a tourné avec le moteur local de repli ({meta.extractionEngines.join(", ")}) et les embeddings avec{" "}
            {meta.embeddings.engine}. Utilisation moyenne du GPU : {num(bench.gpu.utilisation_moyenne_pct, 1)} % sur {bench.gpu.n_echantillons} relevés. Prochaine
            mesure : <code className="font-mono">make serve-llm &amp;&amp; make pipeline-llm &amp;&amp; make bench-llm</code>.
          </p>
        </div>
      )}

      <h2 className="mb-3 font-medium">Comptes mules : opérateur seul contre consortium</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Rappel des campagnes" value={pct(cons.rappel)} compare={`Opérateur seul : ${pct(solo.rappel)}`} help="Campagnes détectées sur campagnes injectées. 5 campagnes : l'incertitude est large." tone="laterite" />
        <Kpi label="Délai médian" value={`${num(cons.delai_detection_median_minutes)} min`} compare={`Opérateur seul : ${num(solo.delai_detection_median_minutes)} min`} help="Depuis la première plainte de la campagne." />
        <Kpi label="FCFA gelables" value={fcfa(cons.fcfa_encore_gelables_total)} compare={`Opérateur seul : ${fcfa(solo.fcfa_encore_gelables_total)}`} help="Modèle de retrait du scénario synthétique : grandeur simulée." tone="sage" />
        <Kpi label="Précision après score" value={`${prio.alertes_vraies} sur ${prio.alertes_totales}`} compare={`Règle brute ${pct(cons.precision)} · opérateur seul ${pct(solo.precision)}`} help="Alertes vraies sur alertes prioritaires. Le score a été réglé sur ce même corpus synthétique : chiffre à confirmer sur données réelles. Les autres alertes restent « à qualifier »." tone="amber" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="Typologie : la référence supervisée gagne, nous le disons">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-paper-line">
              {[
                ["Mots-clés + regex (référence)", typo.reference_mots_cles_regex?.f1_macro],
                ["TF-IDF + régression logistique (supervisée)", typo.reference_tfidf_logreg?.f1_macro],
                [`Extracteur ${BRAND.name} (sans étiquettes)`, typo.heuristique_locale?.f1_macro],
                ["LLM local", typo.llm?.f1_macro ?? null],
              ].map(([k, v]) => (
                <tr key={k as string}>
                  <td className="py-2.5 text-ink">{k as string}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{v == null ? "non mesuré" : num(v as number, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-slate">
            Sur les {num(typo.sous_corpus_ambigu?.n)} plaintes ambiguës ({pct(typo.sous_corpus_ambigu?.part_du_corpus, 1)} du corpus), aucun moteur ne dépasse le
            taux de la classe majoritaire. C&apos;est la mesure qui justifie le croisement.
          </p>
        </Panel>

        <Panel title="Extraction des champs (F1 sur les cas récupérables)">
          {fields ? (
            <table className="w-full text-sm">
              <thead className="text-left text-slate">
                <tr>
                  <th className="pb-2 font-medium">Champ</th>
                  <th className="pb-2 text-right font-medium">Regex</th>
                  <th className="pb-2 text-right font-medium">Local (repli)*</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {Object.keys(fields).map((k) => (
                  <tr key={k}>
                    <td className="py-2 font-mono text-[13px] text-ink">{k}</td>
                    <td className="py-2 text-right font-mono tabular-nums">{num(fields[k]?.f1_recuperable ?? fields[k]?.f1, 3)}</td>
                    <td className="py-2 text-right font-mono tabular-nums">{fieldsLocal ? num(fieldsLocal[k]?.f1_recuperable ?? fieldsLocal[k]?.f1, 3) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate">Détail par champ : voir results/benchmark.md, section 3.</p>
          )}
          <p className="mt-4 text-sm text-slate">Le montant sépare les moteurs : la regex ne lit pas « 25mil » ni « vingt cinq mille ».</p>
          <p className="mt-2 text-xs text-slate">
            * Extracteur local de repli, écrit en connaissant les gabarits du générateur : F1 optimiste par construction. Il ne remplace pas la mesure du LLM sur GPU.
          </p>
        </Panel>

        <Panel title="Débit et coût pour 1 000 réclamations">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-paper-line">
              <tr>
                <td className="py-2.5">Débit, extracteur local</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{num(thr.heuristique_locale?.reclamations_par_seconde, 0)} réclam./s</td>
              </tr>
              <tr>
                <td className="py-2.5">Débit, LLM sur GPU</td>
                <td className="py-2.5 text-right font-mono">{thr.llm?.reclamations_par_seconde ? `${num(thr.llm.reclamations_par_seconde, 1)} réclam./s` : "non mesuré"}</td>
              </tr>
              <tr>
                <td className="py-2.5">Inférence locale sur T4</td>
                <td className="py-2.5 text-right font-mono">{typeof cost.cout_inference_locale_pour_1000_fcfa === "number" ? fcfa(cost.cout_inference_locale_pour_1000_fcfa) : "non calculé"}</td>
              </tr>
              <tr>
                <td className="py-2.5">API cloud (tokens mesurés × prix affiché)</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{fcfa(tokenCost.cout_api_cloud_pour_1000_fcfa)}</td>
              </tr>
              <tr>
                <td className="py-2.5">Agent humain, réclamation simple (estimation)</td>
                <td className="py-2.5 text-right font-mono tabular-nums">{fcfa(cost.cout_humain_pour_1000_fcfa?.reclamation_simple)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-sm text-slate">
            Le coût du modèle n&apos;est pas le verrou. L&apos;argument du GPU local est ailleurs : le texte des clients ne quitte jamais l&apos;opérateur.
          </p>
        </Panel>

        <Panel title="Preuve d'utilisation du GPU">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Matériel", meta.executionLabel],
              ["Relevés nvidia-smi", num(bench.gpu.n_echantillons)],
              ["Utilisation moyenne", `${num(bench.gpu.utilisation_moyenne_pct, 1)} %`],
              ["Utilisation maximale", `${num(bench.gpu.utilisation_max_pct, 0)} %`],
              ["Mémoire maximale", `${num(bench.gpu.memoire_max_mib)} / ${num(bench.gpu.memoire_totale_mib)} Mio`],
              ["Moteur d'embeddings", meta.embeddings.engine],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate">{k}</dt>
                <dd className="mt-0.5 font-mono text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
