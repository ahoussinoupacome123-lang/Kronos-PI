import Link from "next/link";
import NextActions, { type ActionItem } from "@/components/dashboard/NextActions";
import { FreezableChart, Kpi, OperatorDot, PageHead, Panel, Pill } from "@/components/dashboard/ui";
import { readSession } from "@/lib/auth";
import { campaigns, dayHhmm, demoCase, fcfa, freezableCurves, headline, hhmm, incidents, num, pct, soloAlerts, volumes } from "@/lib/data";
import { dueSoon, humanHours, openDossiers, priorityAlerts, toQualifyAlerts } from "@/lib/derive";

export const metadata = { title: "Aujourd'hui" };

export default async function Today() {
  const session = await readSession();
  const first = session?.name.split(" ")[0] ?? "";
  const solo = headline.solo;
  const cons = headline.consortium;
  const narrative = campaigns.find((c) => c.narrative) ?? campaigns[0];
  const soloNarr = soloAlerts.find((a) => a.campaign === narrative.id);
  const incident = incidents.find((i) => i.zscore === Math.max(...incidents.map((x) => x.zscore)))!;

  const actions: ActionItem[] = [
    {
      id: "prio",
      title: `Décider sur ${priorityAlerts.length} alertes « mule probable »`,
      detail: `Plus haut score ${num(priorityAlerts[0].score, 2)} · ${priorityAlerts[0].complainants} plaignants sur ${priorityAlerts[0].operators.length} réseaux. Chaque minute, l'argent part en espèces.`,
      href: `/tableau-de-bord/alertes/${priorityAlerts[0].id}`,
      cta: "Ouvrir la plus urgente",
      tone: "laterite",
      alertIds: priorityAlerts.map((a) => a.id),
    },
    {
      id: "due",
      title: `${dueSoon.length} échéances réglementaires dans les 48 h`,
      detail: dueSoon[0]
        ? `La plus proche : ${dueSoon[0].kind} du dossier ${dueSoon[0].dossier.id}, dans ${humanHours(dueSoon[0].hoursLeft)}.`
        : "Aucune échéance proche.",
      href: "/tableau-de-bord/dossiers?tri=echeance",
      cta: "Voir les dossiers",
      tone: "amber",
    },
    {
      id: "qualify",
      title: `Qualifier ${toQualifyAlerts.length} alertes sous le score`,
      detail: "La règle 3 · 2 · 60 a déclenché, mais le score est bas : souvent un facturier ou une tontine. Écartez-les en écrivant pourquoi.",
      href: "/tableau-de-bord/alertes?vue=a-qualifier",
      cta: "Qualifier",
      tone: "indigo",
      alertIds: toQualifyAlerts.map((a) => a.id),
    },
    {
      id: "incident",
      title: "Vérifier le pic d'incidents détecté par le radar",
      detail: `${incident.label}. ${incident.count} plaintes contre ${num(incident.baseline_mean, 0)} d'habitude.`,
      href: "/tableau-de-bord/incidents",
      cta: "Voir le radar",
      tone: "sage",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title={`Bonjour ${first}.`}
        lead={
          <>
            Le consortium a croisé {num(volumes.n_reclamations)} réclamations de trois réseaux. Voici ce qui demande une
            décision humaine, par ordre d&apos;urgence.
          </>
        }
      >
        <Link href="/tableau-de-bord/alertes" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink-3">
          Toutes les alertes
        </Link>
      </PageHead>

      <NextActions items={actions} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Campagnes détectées"
          value={`${cons.campagnes_detectees} / ${cons.campagnes_injectees}`}
          compare={`Opérateur seul : ${solo.campagnes_detectees} / ${solo.campagnes_injectees}`}
          help="Rappel sur les campagnes de mules injectées dans le corpus synthétique. Référence : le même opérateur, la même règle, sans voir les autres réseaux."
          tone="laterite"
        />
        <Kpi
          label="Délai médian d'alerte"
          value={`${num(cons.delai_detection_median_minutes)} min`}
          compare={`Opérateur seul : ${num(solo.delai_detection_median_minutes)} min`}
          help="Minutes entre la première plainte d'une campagne et l'alerte. Plus il est court, plus il reste d'argent sur le compte mule."
        />
        <Kpi
          label="FCFA encore gelables"
          value={fcfa(cons.fcfa_encore_gelables_total)}
          compare={`Opérateur seul : ${fcfa(solo.fcfa_encore_gelables_total)}`}
          help="Somme, sur les campagnes, de l'argent encore sur le compte mule au moment de l'alerte, d'après le modèle de retrait du scénario. Grandeur simulée, pas une mesure de terrain."
          tone="sage"
        />
        <Kpi
          label="Dossiers ouverts"
          value={num(openDossiers.length)}
          compare={`${dueSoon.length} échéances sous 48 h`}
          help="Dossiers de litige pré-remplis, ouverts à l'heure de la démo. Chacun porte ses échéances : PI-Reclam, remboursement J+3 ouvrés, réponse J+30."
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title={`Ce que le délai coûte : campagne ${narrative.id}`}
          aside={<span className="text-xs text-slate">{fcfa(narrative.totalFcfa)} détournés · {narrative.victims} victimes</span>}
        >
          <FreezableChart points={freezableCurves[narrative.id] ?? []} alertAt={demoCase.alerte.alert_at} soloAlertAt={soloNarr?.alertAt} />
          <p className="mt-3 text-sm text-slate">
            Le retrait en espèces commence à {hhmm(narrative.cashoutStartAt)}. Le consortium alerte à {hhmm(demoCase.alerte.alert_at)}, avant
            le premier retrait. {soloNarr ? `L'opérateur seul alerte à ${hhmm(soloNarr.alertAt)}, et il n'héberge pas le compte : il ne peut rien suspendre.` : ""}
          </p>
        </Panel>

        <Panel title="Dernières alertes du consortium">
          <ul className="-my-2 divide-y divide-paper-line">
            {[...priorityAlerts].sort((a, b) => b.alertAt.localeCompare(a.alertAt)).slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link href={`/tableau-de-bord/alertes/${a.id}`} className="flex items-center gap-3 py-3 hover:bg-paper-3/40">
                  <span className="flex -space-x-0.5">
                    {a.operators.map((o) => (
                      <OperatorDot key={o} op={o} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm text-ink">{a.alias.slice(0, 10)}…</span>
                    <span className="block text-xs text-slate">{dayHhmm(a.alertAt)} · {a.complainants} plaignants</span>
                  </span>
                  <Pill tone="laterite">{fcfa(a.freezableFcfa)}</Pill>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate">
            Précision des alertes prioritaires : {pct(headline.prioritized.precision)} · règle brute {pct(cons.precision)}.
          </p>
        </Panel>
      </div>
    </div>
  );
}

// Page dépendante de la session ou de l'URL : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
