import Link from "next/link";
import ConvergenceArt from "@/components/dashboard/ConvergenceArt";
import NextActions, { type ActionItem } from "@/components/dashboard/NextActions";
import { FreezableChart, Kpi, OperatorDot, Panel, Pill } from "@/components/dashboard/ui";
import { IconArrowRight, IconClock } from "@/components/ui/icons";
import { readSession } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
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
  const incident = [...incidents].sort((a, b) => b.zscore - a.zscore)[0];
  const top = priorityAlerts[0];

  const actions: ActionItem[] = [
    {
      id: "prio",
      title: `Décider sur ${priorityAlerts.length} alertes « mule probable »`,
      detail: `Plus haut score ${num(top.score, 2)} · ${top.complainants} plaignants sur ${top.operators.length} réseaux. Chaque minute, l'argent part en espèces.`,
      href: `/tableau-de-bord/alertes/${top.id}`,
      cta: "Ouvrir la plus urgente",
      tone: "laterite",
      alertIds: priorityAlerts.map((a) => a.id),
    },
    {
      id: "due",
      title: `${dueSoon.length} échéances réglementaires dans les 48 h`,
      detail: dueSoon[0] ? `La plus proche : ${dueSoon[0].kind} du dossier ${dueSoon[0].dossier.id}, dans ${humanHours(dueSoon[0].hoursLeft)}.` : "Aucune échéance proche.",
      href: "/tableau-de-bord/dossiers?tri=echeance",
      cta: "Voir les dossiers",
      tone: "amber",
    },
    {
      id: "qualify",
      title: `Qualifier ${toQualifyAlerts.length} alertes sous le score`,
      detail: "La règle a déclenché mais le score est bas : souvent un facturier ou une tontine. Écartez-les en écrivant pourquoi.",
      href: "/tableau-de-bord/alertes?vue=a-qualifier",
      cta: "Qualifier",
      tone: "indigo",
      alertIds: toQualifyAlerts.map((a) => a.id),
    },
    {
      id: "incident",
      title: "Vérifier le pic d'incidents du radar",
      detail: `${incident.label}. ${incident.count} plaintes contre ${num(incident.baseline_mean, 0)} d'habitude.`,
      href: "/tableau-de-bord/incidents",
      cta: "Voir le radar",
      tone: "sage",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Rangée d'accueil, façon cockpit */}
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
        <section className="relative overflow-hidden rounded-[26px] bg-white p-6 shadow-[0_10px_34px_-24px_rgba(11,27,75,0.45)] md:p-7">
          <h1 className="font-display text-[2.3rem] font-extrabold leading-none tracking-[-0.035em] text-ink">Bonjour {first} !</h1>
          <Link href="/tableau-de-bord/alertes" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline">
            Votre consortium a croisé {num(volumes.n_reclamations)} réclamations <IconArrowRight size={14} />
          </Link>
          <ConvergenceArt className="mx-auto mt-2 w-full max-w-[26rem]" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper p-3.5">
            <div className="min-w-0">
              <p className="text-xs font-bold text-laterite-deep">Alerte la plus urgente</p>
              <p className="truncate font-mono text-sm text-ink">
                {top.alias.slice(0, 12)}… · {top.complainants} plaignants · {top.operators.length} réseaux
              </p>
            </div>
            <Link href={`/tableau-de-bord/alertes/${top.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-laterite px-4 py-2 text-sm font-bold text-white hover:bg-laterite-deep">
              Décider <IconArrowRight size={15} />
            </Link>
          </div>
        </section>

        <div className="grid gap-4">
          <Kpi
            label="FCFA encore gelables"
            value={fcfa(cons.fcfa_encore_gelables_total)}
            compare={`Opérateur seul : ${fcfa(solo.fcfa_encore_gelables_total)}`}
            help="Argent encore sur les comptes mules au moment de l'alerte, sur les 5 campagnes, d'après le modèle de retrait du scénario. Grandeur simulée, pas une mesure de terrain."
            tone="sage"
          />
          <Kpi
            label="Délai médian d'alerte"
            value={`${num(cons.delai_detection_median_minutes)} min`}
            compare={`Opérateur seul : ${num(solo.delai_detection_median_minutes)} min`}
            help="Minutes entre la première plainte d'une campagne et l'alerte. Plus il est court, plus il reste d'argent sur le compte."
          />
          <Kpi
            label="Campagnes repérées"
            value={`${cons.campagnes_detectees} / ${cons.campagnes_injectees}`}
            compare={`Opérateur seul : ${solo.campagnes_detectees} / ${solo.campagnes_injectees}`}
            help="Campagnes de mules injectées dans le corpus synthétique et retrouvées. Référence : le même opérateur, la même règle, sans voir les autres réseaux."
            tone="laterite"
          />
        </div>

        <Panel title="Échéances à tenir" aside={<Pill tone="amber">{dueSoon.length} sous 48 h</Pill>}>
          <ul className="-my-1 space-y-2.5">
            {dueSoon.slice(0, 4).map((d) => (
              <li key={d.dossier.id + d.kind}>
                <Link href="/tableau-de-bord/dossiers?tri=echeance" className="flex items-center gap-3 rounded-2xl bg-paper px-3.5 py-3 transition-colors hover:bg-sky/60">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-deep">
                    <IconClock size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{d.dossier.id}</span>
                    <span className="block truncate text-xs text-slate">
                      {d.kind} · {d.dossier.operator}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${d.hoursLeft <= 12 ? "bg-laterite text-white" : "bg-ink text-white"}`}>
                    {humanHours(d.hoursLeft)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate">
            {num(openDossiers.length)} dossiers ouverts. J+3 ouvrés : Instruction BCEAO 008-05-2015, art. 35.
          </p>
        </Panel>
      </div>

      <NextActions items={actions} />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Ce que le délai coûte : campagne ${narrative.id}`} aside={<span className="text-xs text-slate">{fcfa(narrative.totalFcfa)} détournés · {narrative.victims} victimes</span>}>
          <FreezableChart points={freezableCurves[narrative.id] ?? []} alertAt={demoCase.alerte.alert_at} soloAlertAt={soloNarr?.alertAt} />
          <p className="mt-3 text-sm text-slate">
            Retrait en espèces à partir de {hhmm(narrative.cashoutStartAt)}. {BRAND.name} alerte à {hhmm(demoCase.alerte.alert_at)}, avant le premier retrait.{" "}
            {soloNarr ? `L'opérateur seul alerte à ${hhmm(soloNarr.alertAt)}, et il n'héberge pas le compte : il ne peut rien suspendre.` : ""}
          </p>
        </Panel>

        <Panel title="Dernières alertes du consortium" aside={<Link href="/tableau-de-bord/alertes" className="text-xs font-bold text-blue hover:underline">Toutes</Link>}>
          <ul className="-my-1 space-y-2">
            {[...priorityAlerts].sort((a, b) => b.alertAt.localeCompare(a.alertAt)).slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link href={`/tableau-de-bord/alertes/${a.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-paper">
                  <span className="flex gap-1">
                    {a.operators.map((o) => (
                      <OperatorDot key={o} op={o} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm text-ink">{a.alias.slice(0, 10)}…</span>
                    <span className="block text-xs text-slate">
                      {dayHhmm(a.alertAt)} · {a.complainants} plaignants
                    </span>
                  </span>
                  <Pill tone="laterite">{fcfa(a.freezableFcfa)}</Pill>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate">
            Alertes prioritaires justes : {headline.prioritized.alertes_vraies} sur {headline.prioritized.alertes_totales} (score réglé sur ce corpus) · règle brute {pct(cons.precision)}.
          </p>
        </Panel>
      </div>
    </div>
  );
}

// Page dépendante de la session : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
