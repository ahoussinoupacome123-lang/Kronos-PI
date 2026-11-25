import Link from "next/link";
import AlertStatus from "@/components/dashboard/AlertStatus";
import { OperatorDot, PageHead } from "@/components/dashboard/ui";
import { alerts, dayHhmm, fcfa, headline, num } from "@/lib/data";

export const metadata = { title: "Alertes mules" };

const VIEWS = [
  ["toutes", "Toutes"],
  ["prioritaires", "Prioritaires"],
  ["a-qualifier", "À qualifier"],
] as const;

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue = "toutes" } = await searchParams;
  const list = alerts
    .filter((a) => (vue === "prioritaires" ? a.priority : vue === "a-qualifier" ? !a.priority : true))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || b.score - a.score);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="Alertes du consortium"
        lead={
          <>
            Une alerte part quand la règle est franchie : {headline.rule}. Le score classe ensuite ce qui est prioritaire. Rien
            n&apos;est supprimé en silence.
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer les alertes">
        {VIEWS.map(([k, label]) => {
          const count = alerts.filter((a) => (k === "prioritaires" ? a.priority : k === "a-qualifier" ? !a.priority : true)).length;
          const active = vue === k;
          return (
            <Link
              key={k}
              role="tab"
              aria-selected={active}
              href={`/tableau-de-bord/alertes?vue=${k}`}
              className={`rounded-full px-4 py-2 text-sm ${active ? "bg-ink text-cream" : "border border-paper-line text-ink hover:border-ink"}`}
            >
              {label} <span className="ml-1 font-mono text-xs opacity-70">{count}</span>
            </Link>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-paper-line p-10 text-center text-slate">Aucune alerte dans cette vue.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-paper-line bg-paper-2">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-paper-3/60 text-left text-slate">
              <tr>
                <th className="px-5 py-3 font-medium">Bénéficiaire (haché)</th>
                <th className="px-3 py-3 font-medium">Alerte</th>
                <th className="px-3 py-3 font-medium">Plaignants</th>
                <th className="px-3 py-3 font-medium">Réseaux</th>
                <th className="px-3 py-3 text-right font-medium">Score</th>
                <th className="px-3 py-3 text-right font-medium">Gelable à l&apos;alerte</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {list.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-paper-3/40">
                  <td className="px-5 py-3.5">
                    <Link href={`/tableau-de-bord/alertes/${a.id}`} className="font-mono text-ink underline-offset-4 hover:underline">
                      {a.alias}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-slate">
                    {dayHhmm(a.alertAt)} <span className="text-xs">· +{num(a.delayMin)} min</span>
                  </td>
                  <td className="px-3 py-3.5 font-mono tabular-nums">{a.complainants}</td>
                  <td className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5">
                      {a.operators.map((o) => (
                        <OperatorDot key={o} op={o} />
                      ))}
                      <span className="ml-1 text-slate">{a.operators.length}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono tabular-nums">{num(a.score, 2)}</td>
                  <td className="px-3 py-3.5 text-right font-mono tabular-nums">{fcfa(a.freezableFcfa)}</td>
                  <td className="px-5 py-3.5">
                    <AlertStatus alertId={a.id} priority={a.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-slate">Opérateurs fictifs : ALPHAMONEY, BETACASH, GAMMAPAY. Les alias sont des empreintes HMAC : le hub ne connaît pas le numéro.</p>
    </div>
  );
}

// Page dépendante de la session ou de l'URL : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
