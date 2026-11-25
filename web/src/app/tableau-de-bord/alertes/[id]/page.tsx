import Link from "next/link";
import { notFound } from "next/navigation";
import AlertGraph from "@/components/dashboard/AlertGraph";
import AlertStatus from "@/components/dashboard/AlertStatus";
import DecisionPanel from "@/components/dashboard/DecisionPanel";
import { FreezableChart, OperatorDot, Panel, Pill } from "@/components/dashboard/ui";
import { IconCheck } from "@/components/ui/icons";
import { readSession } from "@/lib/auth";
import { alerts, campaigns, dayHhmm, dossierSummary, dossiers, fcfa, freezableCurves, graphs, hhmm, num, soloAlerts, typologyLabel } from "@/lib/data";

export const metadata = { title: "Alerte" };

export default async function AlertDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = alerts.find((x) => x.id === id);
  if (!a) notFound();
  const session = await readSession();
  const campaign = campaigns.find((c) => c.id === a.campaign);
  const host = campaign?.muleOperator ?? "l'opérateur hôte du compte";
  const graph = graphs[a.id];
  const solo = soloAlerts.find((s) => s.alias === a.alias);
  const linked = dossiers.filter((d) => a.complaintRefs.includes(d.complaintId));
  const seuils = dossierSummary.seuils_affiches;
  const checks = [
    [`${a.complainants} plaignants indépendants`, `au moins ${seuils.plaignants_independants_minimum}`, a.complainants >= seuils.plaignants_independants_minimum],
    [`${a.operators.length} réseaux distincts`, `au moins ${seuils.operateurs_distincts_minimum}`, a.operators.length >= seuils.operateurs_distincts_minimum],
    [`Alerte ${num(a.delayMin)} min après la 1re plainte`, `fenêtre de ${seuils.fenetre_minutes} min`, a.delayMin <= seuils.fenetre_minutes],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-slate">
        <Link href="/tableau-de-bord/alertes" className="underline-offset-4 hover:underline">
          Alertes
        </Link>{" "}
        / <span className="font-mono">{a.alias.slice(0, 10)}…</span>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.03em]">
              {a.priority ? "Mule probable" : "Convergence à qualifier"}
            </h1>
            <AlertStatus alertId={a.id} priority={a.priority} />
          </div>
          <p className="mt-2 max-w-2xl text-slate">
            Bénéficiaire <span className="font-mono text-ink">{a.alias}</span> · alerte du {dayHhmm(a.alertAt)} · score {num(a.score, 2)}
          </p>
        </div>
        <div className="rounded-2xl border border-laterite/30 bg-laterite/[0.07] px-5 py-4 text-right">
          <p className="text-xs text-laterite-deep">Encore gelable à l&apos;alerte</p>
          <p className="font-display text-3xl font-semibold tabular-nums text-laterite-deep">{fcfa(a.freezableFcfa)}</p>
          {a.freezableAtLastUpdate != null && <p className="text-xs text-slate">{fcfa(a.freezableAtLastUpdate)} à la dernière plainte</p>}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Panel title="Comment les plaintes ont convergé" aside={<span className="text-xs text-slate">rejouable</span>}>
            {graph ? (
              <AlertGraph graph={graph} minComplainants={seuils.plaignants_independants_minimum} minOperators={seuils.operateurs_distincts_minimum} />
            ) : (
              <p className="text-sm text-slate">
                Le graphe détaillé n&apos;est exporté que pour les alertes de la vérité terrain. {a.complainants} plaignants, réseaux :{" "}
                {a.operators.join(", ")}.
              </p>
            )}
          </Panel>

          {campaign && freezableCurves[campaign.id] && (
            <Panel title="L'argent qui reste à sauver" aside={<span className="text-xs text-slate">modèle de retrait du scénario</span>}>
              <FreezableChart points={freezableCurves[campaign.id]} alertAt={a.alertAt} soloAlertAt={solo?.alertAt} />
              <p className="mt-3 text-sm text-slate">
                Premier retrait en espèces à {hhmm(campaign.cashoutStartAt)}.{" "}
                {solo
                  ? `L'opérateur seul n'aurait alerté qu'à ${hhmm(solo.alertAt)}.`
                  : "Aucun opérateur seul n'atteignait le seuil : sans le consortium, cette campagne passait inaperçue."}
              </p>
            </Panel>
          )}

          <Panel title={`Plaintes à l'origine (${a.complaintRefs.length})`}>
            {linked.length ? (
              <ul className="-my-2 divide-y divide-paper-line">
                {linked.map((d) => (
                  <li key={d.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate">
                      <OperatorDot op={d.operator} /> {d.operator} · {d.channel} · {hhmm(d.receivedAt)} · {typologyLabel[d.typology] ?? d.typology}
                    </div>
                    <p className="mt-1 font-mono text-[13px] text-ink">« {d.text} »</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate">
                Références : {a.complaintRefs.join(", ")}. Le texte reste chez chaque opérateur ; seul le vôtre vous est lisible.
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Pourquoi cette alerte est partie">
            <ul className="space-y-3">
              {checks.map(([label, rule, ok]) => (
                <li key={label} className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${ok ? "bg-sage/25 text-sage-deep" : "bg-paper-3 text-slate"}`}>
                    <IconCheck size={14} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{label}</span>
                    <span className="block text-xs text-slate">{rule}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl bg-paper-3/70 p-3 text-sm text-ink">{a.recommendation}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {a.operators.map((o) => (
                <Pill key={o} tone="slate">
                  <OperatorDot op={o} /> {o} {o === campaign?.muleOperator ? "· héberge le compte" : "· à prévenir"}
                </Pill>
              ))}
            </div>
          </Panel>

          <DecisionPanel alertId={a.id} user={session?.name ?? "Utilisateur"} hostOperator={host} freezable={fcfa(a.freezableFcfa)} />

          {campaign && (
            <p className="rounded-2xl border border-dashed border-paper-line p-4 text-xs leading-relaxed text-slate">
              Vérité terrain du scénario synthétique : campagne {campaign.id}, « {campaign.label} », {campaign.victims} victimes,{" "}
              {fcfa(campaign.totalFcfa)}. Affichée pour l&apos;évaluation, jamais connue du système en production.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Page dépendante de la session ou de l'URL : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
