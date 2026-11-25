import Link from "next/link";
import ConsortiumHub from "@/components/dashboard/ConsortiumHub";
import NextActions, { type ActionItem } from "@/components/dashboard/NextActions";
import { FreezableChart, Kpi, OperatorDot, Panel, Pill } from "@/components/dashboard/ui";
import { IconArrowRight, IconClock } from "@/components/ui/icons";
import { readSession } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { alerts, campaigns, dayHhmm, demoCase, fcfa, freezableCurves, headline, hhmm, incidents, num, OPERATORS, operatorColor, pct, soloAlerts, volumes } from "@/lib/data";
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
  const stations = OPERATORS.map((op) => ({ op, alertes: alerts.filter((a) => a.operators.includes(op)).length }));

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
      {/* Rangée d'accueil : le réacteur du consortium */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="relative overflow-hidden rounded-[30px] bg-nuit text-white shadow-[0_40px_80px_-40px_rgba(15,23,18,.7)]">
          <span aria-hidden className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-lime/15 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4 px-6 pt-6 md:px-8 md:pt-7">
            <div>
              <p className="font-donnee text-[11px] tracking-[0.2em] text-lime/80">VUE DU CONSORTIUM</p>
              <h1 className="mt-2 font-titre text-[clamp(2rem,3.6vw,2.8rem)] font-bold leading-none tracking-[-0.04em]">Bonjour {first}.</h1>
              <Link href="/tableau-de-bord/alertes" className="mt-3 inline-block text-sm text-white/65 transition-colors hover:text-lime">
                Votre consortium a croisé <span className="font-semibold text-white">{num(volumes.n_reclamations)}</span> réclamations <IconArrowRight size={14} className="inline align-[-2px]" />
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-white/60" aria-label="Légende">
              {OPERATORS.map((op) => (
                <li key={op} className="flex items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: operatorColor[op] }} /> Plaintes {op}
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2 w-2 rounded-full bg-lime shadow-[0_0_10px_var(--color-lime)]" /> Alerte renvoyée
              </li>
            </ul>
          </div>
          <ConsortiumHub stations={stations} className="relative -mt-4 w-full" />
          <div className="relative mx-3 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur md:mx-4 md:mb-4">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inset-0 animate-ping rounded-full bg-alerte opacity-70 motion-reduce:hidden" />
                <span className="relative h-3 w-3 rounded-full bg-alerte" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#ff8a8e]">Alerte la plus urgente</p>
                <p className="truncate font-donnee text-sm text-white/85">
                  {top.alias.slice(0, 12)}… · {top.complainants} plaignants · {top.operators.length} réseaux · {fcfa(top.freezableFcfa)} gelables
                </p>
              </div>
            </div>
            <Link href={`/tableau-de-bord/alertes/${top.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-encre transition-transform hover:scale-[1.03]">
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

      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <NextActions items={actions} />
        <Panel title="Échéances à tenir" aside={<Pill tone="amber">{dueSoon.length} sous 48 h</Pill>}>
          <ul className="-my-1 space-y-2.5">
            {dueSoon.slice(0, 4).map((d) => (
              <li key={d.dossier.id + d.kind}>
                <Link href="/tableau-de-bord/dossiers?tri=echeance" className="flex items-center gap-3 rounded-2xl bg-brume px-3.5 py-3 transition-colors hover:bg-sky">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-deep">
                    <IconClock size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{d.dossier.id}</span>
                    <span className="block truncate text-xs text-slate">
                      {d.kind} · {d.dossier.operator}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${d.hoursLeft <= 12 ? "bg-alerte text-white" : "bg-encre text-lime"}`}>
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Ce que le délai coûte : campagne ${narrative.id}`} aside={<span className="text-xs text-slate">{fcfa(narrative.totalFcfa)} détournés · {narrative.victims} victimes</span>}>
          <FreezableChart points={freezableCurves[narrative.id] ?? []} alertAt={demoCase.alerte.alert_at} soloAlertAt={soloNarr?.alertAt} />
          <p className="mt-3 text-sm text-slate">
            Retrait en espèces à partir de {hhmm(narrative.cashoutStartAt)}. {BRAND.name} alerte à {hhmm(demoCase.alerte.alert_at)}, avant le premier retrait.{" "}
            {soloNarr ? `L'opérateur seul alerte à ${hhmm(soloNarr.alertAt)}, et il n'héberge pas le compte : il ne peut rien suspendre.` : ""}
          </p>
        </Panel>

        <Panel title="Dernières alertes du consortium" aside={<Link href="/tableau-de-bord/alertes" className="text-xs font-bold text-lime-texte hover:underline">Toutes</Link>}>
          <ul className="-my-1 space-y-2">
            {[...priorityAlerts].sort((a, b) => b.alertAt.localeCompare(a.alertAt)).slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link href={`/tableau-de-bord/alertes/${a.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-brume">
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
