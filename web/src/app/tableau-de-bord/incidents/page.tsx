import { PageHead, Panel, Pill } from "@/components/dashboard/ui";
import { dayHhmm, hhmm, incidentEval, incidents, num, pct, typologyLabel } from "@/lib/data";

export const metadata = { title: "Radar d'incidents" };

export default function IncidentsPage() {
  const list = [...incidents].sort((a, b) => b.zscore - a.zscore);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHead objet="telephone-alerte"
        title="Radar d'incidents"
        lead="Quand des centaines de clients écrivent la même chose à la même heure, ce n'est pas une fraude : c'est une panne. Le radar la repère avant l'avalanche de tickets, pour que vos agents répondent d'une seule voix."
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Incidents injectés retrouvés", `${incidentEval.incidents_detectes} / ${incidentEval.incidents_injectes}`],
          ["Précision du radar", pct(incidentEval.precision)],
          ["Faux positifs laissés visibles", String(incidentEval.faux_positifs)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-paper-line bg-paper-2 p-5">
            <p className="text-sm text-slate">{k}</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <div className="space-y-6">
        {list.map((inc) => {
          const major = inc.zscore >= 20;
          const ratio = inc.count / Math.max(inc.baseline_mean, 1);
          return (
            <Panel
              key={inc.incident_id}
              title={inc.label}
              aside={major ? <Pill tone="laterite">Incident probable</Pill> : <Pill tone="slate">Fluctuation, à vérifier</Pill>}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-slate">Fenêtre</dt>
                    <dd className="text-ink">
                      {dayHhmm(inc.window_start)} → {hhmm(inc.window_end)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate">Volume</dt>
                    <dd className="font-mono tabular-nums text-ink">
                      {inc.count} plaintes · {num(ratio, 1)} × l&apos;habitude
                    </dd>
                    <dd className="mt-2 h-2 w-full rounded-full bg-paper-3">
                      <span className="block h-full rounded-full bg-laterite" style={{ width: `${Math.min(100, (inc.count / Math.max(...list.map((x) => x.count))) * 100)}%` }} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate">Écart à la normale (même heure, jours précédents)</dt>
                    <dd className="font-mono tabular-nums text-ink">{num(inc.zscore, 1)} σ</dd>
                  </div>
                  <div>
                    <dt className="text-slate">Typologie</dt>
                    <dd className="text-ink">{typologyLabel[inc.typology] ?? inc.typology}</dd>
                  </div>
                </dl>
                <div>
                  <p className="text-sm font-medium text-ink">Ce que les clients écrivent</p>
                  <ul className="mt-2 space-y-2">
                    {inc.sample_texts.slice(0, 3).map((t, i) => (
                      <li key={i} className="rounded-xl bg-paper-3/60 p-3 font-mono text-[12.5px] leading-relaxed text-ink">
                        « {t} »
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate">{incidentEval.note_precision}</p>
    </div>
  );
}
