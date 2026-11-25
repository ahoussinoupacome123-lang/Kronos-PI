import Link from "next/link";
import CountUp from "@/components/landing/CountUp";
import HeroOrb, { type HeroEvent } from "@/components/landing/HeroOrb";
import IssuerMarquee from "@/components/landing/IssuerMarquee";
import { AnnouncementBar, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import {
  IconAlert,
  IconArrowRight,
  IconChart,
  IconCheck,
  IconClock,
  IconFile,
  IconGraph,
  IconHash,
  IconLock,
  IconMessage,
  IconRadar,
  IconRefund,
  IconShield,
  IconSnow,
} from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { bench, demoCase, dossiers, fcfa, graphs, headline, hhmm, meta, num, pct, tokenCost, volumes } from "@/lib/data";

const demoGraph = graphs[demoCase.alerte.alert_id];
const heroEvents: HeroEvent[] = demoGraph.edges
  .filter((e) => e.ts && e.operator)
  .map((e) => ({ ts: e.ts!, operator: e.operator!, amount: e.amount_rounded_fcfa ?? 0, order: e.order ?? 0 }))
  .sort((a, b) => a.ts.localeCompare(b.ts));
const sincere = dossiers.find((d) => d.decision === "REMBOURSER" && d.text.toLowerCase().includes("erreur"))!;
const F = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} F`;

export default function Home() {
  const solo = headline.solo;
  const cons = headline.consortium;
  const prio = headline.prioritized;
  const ambiguous = bench.typology.sous_corpus_ambigu as { n: number; part_du_corpus: number };

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute -left-40 top-20 h-[30rem] w-[30rem] rounded-full bg-sky/60 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
            <div>
              <h1 className="rise font-display text-[clamp(2.7rem,6.2vw,5rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink text-balance">
                Gelez l&apos;argent volé <span className="mark">avant</span> le retrait.
              </h1>
              <p className="rise mt-6 max-w-[36rem] text-lg leading-relaxed text-slate [animation-delay:100ms] md:text-[1.2rem]">
                La victime est chez un opérateur, le compte mule chez un autre, et un transfert PI-SPI ne s&apos;annule pas. Chacun ne voit
                que la moitié de l&apos;arnaque. <strong className="font-bold text-ink">{BRAND.name}</strong> croise les plaintes de tous les
                réseaux et donne l&apos;alerte pendant que l&apos;argent est encore sur le compte.
              </p>
              <div className="rise mt-9 flex flex-wrap items-center gap-3 [animation-delay:200ms]">
                <Link
                  href="/connexion?demo=1"
                  className="inline-flex items-center gap-2 rounded-full bg-blue px-7 py-4 text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(35,71,232,0.95)] transition-[background-color,transform] duration-300 hover:bg-blue-deep active:scale-[0.98]"
                >
                  Essayer la démo <IconArrowRight size={18} />
                </Link>
                <Link href="#calcul" className="inline-flex items-center gap-2 rounded-full border-2 border-paper-line px-7 py-[14px] text-[17px] font-bold text-ink transition-colors hover:border-ink">
                  Voir le calcul
                </Link>
              </div>
              <p className="rise mt-7 flex items-center gap-2 text-sm font-semibold text-slate [animation-delay:300ms]">
                <IconCheck size={17} className="text-sage-deep" /> Rien à installer · données synthétiques · la décision reste humaine
              </p>
            </div>
            <div className="lg:pl-6">
              <HeroOrb
                events={heroEvents}
                firesAt={demoGraph.fires_at ?? demoCase.alerte.alert_at}
                freezable={demoCase.alerte.freezable_fcfa}
                delayMin={demoCase.alerte.detection_delay_minutes}
                sms={demoCase.reclamation.text}
                smsWho={`${demoCase.reclamation.complainant_name} · ${hhmm(demoCase.reclamation.received_at)}`}
              />
            </div>
          </div>
        </section>

        <IssuerMarquee />

        {/* LE CALCUL */}
        <section id="calcul" className="scroll-mt-20 px-3">
          <div className="rounded-[36px] bg-ink px-5 py-20 text-cream md:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="mx-auto max-w-3xl text-center font-display text-[clamp(2.1rem,4.6vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white text-balance">
                Chaque minute de retard part en espèces.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-mist">
                Même corpus, même règle de croisement. Seule différence : voir les autres réseaux. Mesuré sur les {num(volumes.n_reclamations)}{" "}
                réclamations synthétiques du banc.
              </p>
              <div className="mt-14 grid gap-5 md:grid-cols-3">
                <CalcCard
                  tone="dim"
                  label="Opérateur seul"
                  value={F(solo.fcfa_encore_gelables_total)}
                  lines={[`${solo.campagnes_detectees} campagnes sur ${solo.campagnes_injectees} repérées`, `alerte après ${num(solo.delai_detection_median_minutes)} min en médiane`]}
                />
                <CalcCard
                  tone="hero"
                  label={`Avec ${BRAND.name}`}
                  value={F(cons.fcfa_encore_gelables_total)}
                  lines={[`${cons.campagnes_detectees} campagnes sur ${cons.campagnes_injectees} repérées`, `alerte après ${num(cons.delai_detection_median_minutes)} min en médiane`]}
                />
                <CalcCard tone="loss" label="Sans alerte" value="0 F" lines={["un paiement PI-SPI confirmé est irrévocable", "88 % des dépôts repartent en espèces (BCEAO)"]} />
              </div>
              <p className="mt-6 text-center text-xs text-mist">
                FCFA encore sur les comptes mules au moment de l&apos;alerte, d&apos;après le modèle de retrait du scénario : grandeur simulée, pas une mesure de terrain.
              </p>
            </div>
          </div>
        </section>

        {/* FONCTIONS */}
        <section id="fonctions" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
              Ce que {BRAND.name} fait pour votre équipe
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate">Choisissez une fonction : vous arrivez directement au bon écran de la démo.</p>
            <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <li key={f.label}>
                  <Link
                    href={f.href}
                    className="group flex h-full items-center gap-3.5 rounded-2xl border border-transparent px-4 py-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-current/20"
                    style={{ background: f.bg, color: f.fg }}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/80">{f.icon}</span>
                    <span className="min-w-0">
                      <span className="block font-display text-[15px] font-bold text-ink">{f.label}</span>
                      <span className="block text-[13px] leading-snug text-slate">{f.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* LE PROBLÈME */}
        <section className="bg-paper py-24">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
                Deux récits. Les mêmes mots.
              </h2>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate">
                <p>
                  « J&apos;ai envoyé au mauvais numéro » : c&apos;est la réclamation la plus fréquente de l&apos;UEMOA. « Je me suis trompé, renvoyez-moi
                  l&apos;argent » : c&apos;est l&apos;arnaque la plus fréquente. Elles s&apos;écrivent pareil.
                </p>
                <p className="rounded-2xl bg-white p-5 text-base text-ink shadow-[0_10px_30px_-20px_rgba(11,27,75,0.4)]">
                  Mesuré sur nos <strong className="font-bold">{num(ambiguous.n)}</strong> plaintes ambiguës ({pct(ambiguous.part_du_corpus, 1)} du corpus) :
                  aucun moteur de lecture ne fait mieux qu&apos;une réponse unique. Le signal n&apos;est pas dans une plainte. Il est dans le croisement de plusieurs.
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              <Bubble
                tone="coral"
                who={`${demoCase.reclamation.complainant_name} · ${demoCase.reclamation.operator} · ${hhmm(demoCase.reclamation.received_at)}`}
                verdict="Victime d'une campagne : 7 plaignants, 3 réseaux, 1 bénéficiaire"
                text={demoCase.reclamation.text}
              />
              <Bubble tone="green" who={`Client ${sincere.operator} · ${hhmm(sincere.receivedAt)}`} verdict="Erreur sincère : rien ne converge, dossier de remboursement" text={sincere.text} />
              <p className="text-sm text-slate">Deux plaintes du corpus synthétique, telles qu&apos;écrites : fautes, abréviations, montants en lettres.</p>
            </div>
          </div>
        </section>

        {/* LES TROIS SORTIES */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="max-w-3xl font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
              Une plainte entre. Une décision claire sort.
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <OutcomeCard
                head="#ffe1d8"
                color="#c63a17"
                icon={<IconSnow size={30} />}
                tag="Mule probable"
                title="Geler avant le retrait"
                text="Les réseaux concernés sont prévenus avec le montant encore gelable. Celui qui héberge le compte décide, motif à l'appui."
                meta={`${fcfa(demoCase.alerte.freezable_fcfa)} gelables sur le cas de démo`}
                href={`/tableau-de-bord/alertes/${demoCase.alerte.alert_id}`}
              />
              <OutcomeCard
                head="#d6f5e8"
                color="#0d7a54"
                icon={<IconRefund size={30} />}
                tag="Erreur sincère"
                title="Rembourser dans les délais"
                text="La demande d'annulation PI-SPI est pré-remplie, avec ses échéances : J+3 ouvrés pour rembourser, J+30 pour répondre."
                meta="Instruction BCEAO 008-05-2015, art. 35"
                href="/tableau-de-bord/dossiers?tri=echeance"
              />
              <OutcomeCard
                head="#dce7ff"
                color="#1e40d8"
                icon={<IconRadar size={30} />}
                tag="Panne"
                title="Repérer l'incident"
                text="Des centaines de clients écrivent la même chose à la même heure : ce n'est pas une fraude, c'est une panne. Le radar la signale."
                meta="1 incident injecté, 1 retrouvé"
                href="/tableau-de-bord/incidents"
              />
            </div>
          </div>
        </section>

        {/* COMPTEURS */}
        <section className="px-3">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-[32px] bg-blue/20 md:grid-cols-4">
            {[
              [volumes.n_reclamations, "", "réclamations analysées"],
              [3, "", "réseaux croisés"],
              [cons.campagnes_detectees, ` / ${cons.campagnes_injectees}`, "campagnes de mules repérées"],
              [cons.delai_detection_median_minutes ?? 0, " min", "délai médian d'alerte"],
            ].map(([v, s, l]) => (
              <div key={l as string} className="bg-blue px-6 py-10 text-center text-white">
                <p className="font-display text-[clamp(2.2rem,4vw,3.2rem)] font-extrabold leading-none tracking-[-0.03em]">
                  <CountUp value={v as number} suffix={s as string} />
                </p>
                <p className="mt-3 text-sm font-semibold text-white/80">{l as string}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">Comment ça marche</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate">Le texte du client ne quitte jamais son opérateur. Seule une empreinte part au hub.</p>
            <ol className="mt-14 grid gap-6 md:grid-cols-4">
              <Step n={1} icon={<IconMessage />} title="Lire" place="chez l'opérateur">
                Le SMS bruité devient une fiche : typologie, montant, heure, bénéficiaire.
              </Step>
              <Step n={2} icon={<IconHash />} title="Masquer" place="chez l'opérateur">
                L&apos;alias est haché ({demoCase.alerte.alias_hmac.slice(0, 8)}…), le montant arrondi. Le reste ne sort pas.
              </Step>
              <Step n={3} icon={<IconGraph />} title="Croiser" place="au hub">
                3 plaignants indépendants, sur 2 réseaux, en 60 minutes : l&apos;alerte part.
              </Step>
              <Step n={4} icon={<IconShield />} title="Décider" place="votre équipe">
                Vous suspendez ou vous écartez, avec un motif. Tout est inscrit dans l&apos;audit.
              </Step>
            </ol>
          </div>
        </section>

        {/* PREUVES */}
        <section id="preuves" className="scroll-mt-20 bg-paper py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
                Mesuré contre la situation actuelle.
              </h2>
              <p className="text-lg text-slate">
                La référence n&apos;est pas un homme de paille : c&apos;est l&apos;opérateur seul, avec la même règle, privé des autres réseaux. Le générateur et la vérité
                terrain sont publiés.
              </p>
            </div>
            <div className="mt-12 overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-35px_rgba(11,27,75,0.45)]">
              <div className="grid grid-cols-[1.3fr_1fr_1fr] bg-ink px-6 py-3.5 text-sm font-semibold text-mist md:px-8">
                <span>Comptes mules</span>
                <span>Opérateur seul</span>
                <span className="text-white">{BRAND.name}</span>
              </div>
              <Ledger label="Campagnes repérées" a={`${solo.campagnes_detectees} sur ${solo.campagnes_injectees}`} b={`${cons.campagnes_detectees} sur ${cons.campagnes_injectees}`} ra={solo.rappel} rb={cons.rappel} />
              <Ledger label="Délai médian d'alerte" a={`${num(solo.delai_detection_median_minutes)} min`} b={`${num(cons.delai_detection_median_minutes)} min`} ra={(solo.delai_detection_median_minutes ?? 0) / 60} rb={(cons.delai_detection_median_minutes ?? 0) / 60} note="plus court est meilleur" />
              <Ledger label="FCFA encore gelables" a={fcfa(solo.fcfa_encore_gelables_total)} b={fcfa(cons.fcfa_encore_gelables_total)} ra={solo.fcfa_encore_gelables_total / cons.fcfa_encore_gelables_total} rb={1} />
              <Ledger
                label="Alertes prioritaires justes"
                a={pct(solo.precision)}
                b={`${prio.alertes_vraies} sur ${prio.alertes_totales}`}
                ra={solo.precision}
                rb={prio.precision}
                note={`règle brute ${pct(cons.precision)} ; score réglé sur ce corpus, à confirmer en pilote`}
              />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Honest icon={<IconChart size={20} />} title="Ce que nous ne gagnons pas">
                Sur la typologie seule, la référence supervisée TF-IDF fait mieux (F1 {num(bench.typology.reference_tfidf_logreg.f1_macro, 2)}) que notre extracteur sans étiquettes (
                {num(bench.typology.heuristique_locale.f1_macro, 2)}). Nous le publions.
              </Honest>
              <Honest icon={<IconClock size={20} />} title="Ce qui coûte peu">
                1 000 réclamations par une API cloud : {num(tokenCost.cout_api_cloud_pour_1000_fcfa, 0)} FCFA, d&apos;après les tokens mesurés. Le verrou n&apos;est pas le prix : c&apos;est la
                confidentialité et le croisement.
              </Honest>
              <Honest icon={<IconAlert size={20} />} title="Ce qui reste à prouver">
                {meta.extractionEngines.includes("llm")
                  ? "Extraction par LLM local mesurée sur GPU."
                  : "Le run publié utilise l'extracteur local de repli : la mesure du LLM sur GPU est en cours."}{" "}
                5 campagnes synthétiques : le pilote tranchera.
              </Honest>
            </div>
          </div>
        </section>

        {/* NEXUS */}
        <section id="nexus" className="scroll-mt-20 py-24">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
                {BRAND.assistant} vous dit quoi faire ensuite.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate">
                {BRAND.assistant} est l&apos;assistant du tableau de bord. Il relie les réseaux à travers le graphe et cite l&apos;alerte, le dossier ou la mesure d&apos;où vient chaque
                réponse. Il propose ; vous décidez.
              </p>
              <p className="mt-4 text-slate">
                Aujourd&apos;hui, il répond à partir des seuls résultats mesurés. Il est prévu pour tourner sur le modèle open-weight du pipeline, sur le GPU de
                l&apos;établissement.
              </p>
            </div>
            <div className="rounded-[28px] bg-paper p-5 md:p-7">
              <ChatLine who="vous">Par quoi je commence ce matin ?</ChatLine>
              <ChatLine who="nexus">
                Une alerte prioritaire attend votre décision : {demoCase.alerte.n_complainants} plaignants sur {demoCase.alerte.n_operators} réseaux visent le même
                bénéficiaire. {fcfa(demoCase.alerte.freezable_fcfa)} étaient encore gelables à l&apos;alerte. Le compte est chez {demoCase.extraction.destination_operator} :
                c&apos;est à eux de suspendre.
              </ChatLine>
              <ChatLine who="vous">Et si c&apos;était un innocent ?</ChatLine>
              <ChatLine who="nexus">
                La règle exige 3 plaignants sur 2 réseaux ; ici, {demoCase.alerte.n_complainants} sur {demoCase.alerte.n_operators} décrivent le même faux dépôt. Je recommande
                une suspension temporaire et réversible, pas un blocage. Votre décision et son motif vont dans l&apos;audit.
              </ChatLine>
            </div>
          </div>
        </section>

        {/* CONFIANCE */}
        <section id="confiance" className="scroll-mt-20 bg-paper py-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="max-w-3xl font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
              Ce qui quitte votre établissement tient en une ligne.
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <TrustList title="Ne sort jamais" icon={<IconLock size={20} />} items={meta.privacy.ne_sort_jamais} color="#0d7a54" bg="#d6f5e8" />
              <TrustList title="Part au hub" icon={<IconHash size={20} />} items={meta.privacy.sort} color="#1e40d8" bg="#dce7ff" />
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate">
              Limite connue, dite avant qu&apos;on nous la dise : {meta.privacy.limite_connue} En production : {meta.privacy.production}
            </p>
          </div>
        </section>

        {/* MODÈLE */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">Travailler avec nous</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate">On commence petit, on mesure, puis on élargit le réseau.</p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <PlanCard
                name="Pilote"
                price="8 semaines"
                lines={["Un émetteur, ou deux d'un même pays", "Vos réclamations anonymisées", "Rappel, délai et FCFA mesurés sur le réel"]}
                cta="Proposer un pilote"
                href={`mailto:${BRAND.contact}`}
              />
              <PlanCard
                featured
                name="Émetteur"
                price="5 F / réclamation"
                lines={["Ou 3 à 5 M FCFA par mois, par grand opérateur et par pays", "Alertes, dossiers, minuteur, audit", "Inférence locale, chez vous"]}
                cta="Voir la démo"
                href="/connexion?demo=1"
              />
              <PlanCard
                name="Consortium"
                price="Licence du hub"
                lines={["Opéré par un tiers de confiance", "Vue consolidée des campagnes", "Branchement sur PI-Reclam"]}
                cta="En parler"
                href={`mailto:${BRAND.contact}`}
              />
            </div>
            <p className="mt-5 text-center text-xs text-slate">Prix indicatifs : hypothèses de modèle économique, à valider pendant le pilote.</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-paper py-24">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-center font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">Questions fréquentes</h2>
            <p className="mt-4 text-center text-lg text-slate">Celles qu&apos;on nous pose à chaque démonstration.</p>
            <div className="mt-10 space-y-3">
              {FAQ.map(([q, a], i) => (
                <details key={q} open={i === 0} className="group rounded-2xl bg-white px-6 py-1 shadow-[0_8px_24px_-18px_rgba(11,27,75,0.45)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[17px] font-bold text-ink">
                    {q}
                    <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper text-blue transition-transform duration-300 group-open:rotate-45">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M7 1v12M1 7h12" />
                      </svg>
                    </span>
                  </summary>
                  <p className="pb-5 leading-relaxed text-slate">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <h2 className="font-display text-[clamp(2.3rem,5vw,4rem)] font-extrabold leading-[1.03] tracking-[-0.035em] text-ink text-balance">
              Ne laissez pas l&apos;argent partir en <span className="mark">espèces</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate">Trois minutes suffisent pour voir une alerte partir, une décision se signer, un dossier se minuter.</p>
            <Link
              href="/connexion?demo=1"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-blue px-8 py-4 text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(35,71,232,0.95)] transition-colors hover:bg-blue-deep"
            >
              Essayer la démo <IconArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

const FEATURES = [
  { label: "Lire la plainte", detail: "SMS bruité → fiche structurée", href: "/tableau-de-bord/dossiers", bg: "#eae9ff", fg: "#4b3fd1", icon: <IconMessage size={20} /> },
  { label: "Masquer les données", detail: "alias haché, montant arrondi", href: "/tableau-de-bord/audit", bg: "#ffe9e2", fg: "#c63a17", icon: <IconHash size={20} /> },
  { label: "Croiser les réseaux", detail: "graphe plaignants, comptes", href: "/tableau-de-bord/alertes", bg: "#dce7ff", fg: "#1e40d8", icon: <IconGraph size={20} /> },
  { label: "Geler à temps", detail: "montant encore gelable", href: "/tableau-de-bord/alertes?vue=prioritaires", bg: "#fff3cf", fg: "#8a6000", icon: <IconSnow size={20} /> },
  { label: "Dossier PI-SPI", detail: "annulation pré-remplie", href: "/tableau-de-bord/dossiers", bg: "#d6f5e8", fg: "#0d7a54", icon: <IconFile size={20} /> },
  { label: "Tenir les délais", detail: "J+3 ouvrés, J+30, PI-Reclam", href: "/tableau-de-bord/dossiers?tri=echeance", bg: "#ffe6f1", fg: "#b0306a", icon: <IconClock size={20} /> },
  { label: "Radar d'incidents", detail: "une panne, pas une fraude", href: "/tableau-de-bord/incidents", bg: "#e2f4ff", fg: "#0a6fa8", icon: <IconRadar size={20} /> },
  { label: "Piste d'audit", detail: "chaque décision signée", href: "/tableau-de-bord/audit", bg: "#efe9e2", fg: "#6b4f2a", icon: <IconShield size={20} /> },
];

const FAQ: [string, string][] = [
  [
    "Les opérateurs concurrents vont-ils vraiment partager leurs données ?",
    "Rien de brut ne quitte l'opérateur : seulement une empreinte du bénéficiaire et quelques métadonnées (heure, typologie, montant arrondi). En production, l'intersection se fait par PSI, ou le hub est opéré par un tiers de confiance comme la BCEAO, PI-Reclam ou l'Alliance Fintech UEMOA.",
  ],
  [
    "Et si l'on gèle un innocent ?",
    `${BRAND.name} ne gèle rien. Il recommande une suspension temporaire quand au moins 3 plaignants indépendants de 2 réseaux visent le même compte en 60 minutes. La décision reste humaine, chez l'opérateur qui héberge le compte, avec un motif écrit et inscrit dans l'audit.`,
  ],
  [
    "La BCEAO ne va-t-elle pas le faire elle-même dans PI-Reclam ?",
    "PI-Reclam transporte les réclamations entre participants ; rien de public n'indique qu'il les analyse et les corrèle. Nous sommes la couche d'intelligence qui s'y branche : un scénario d'intégration, pas de concurrence.",
  ],
  [
    "Vos données sont synthétiques : que valent vos chiffres ?",
    "Nous l'annonçons d'entrée. Le générateur et la vérité terrain sont publiés, la référence reçoit la même règle que nous, et chaque chiffre affiché vient d'une mesure. Le pilote de 8 semaines sur données réelles anonymisées est la prochaine étape.",
  ],
  [
    "Pourquoi un GPU, si une API cloud coûte peu ?",
    "Parce que le texte des clients ne doit pas quitter l'établissement ni la zone. Le modèle open-weight tourne chez l'opérateur ; seul le résultat pseudonymisé part au hub.",
  ],
  [
    "Comprenez-vous le fon, le wolof ou le mina ?",
    "Pas encore, et nous ne le prétendons pas : les taux d'erreur publiés en reconnaissance vocale ne le permettent pas. Le français local bruité, avec ses abréviations et ses montants en lettres, est déjà traité.",
  ],
];

function CalcCard({ tone, label, value, lines }: { tone: "dim" | "hero" | "loss"; label: string; value: string; lines: string[] }) {
  const cls = {
    dim: "bg-ink-2 text-white",
    hero: "bg-blue text-white shadow-[0_30px_60px_-25px_rgba(35,71,232,0.9)] md:-translate-y-3",
    loss: "bg-ink-2 text-white",
  }[tone];
  return (
    <div className={`rounded-3xl p-7 ${cls}`}>
      <p className={`text-sm font-bold ${tone === "hero" ? "text-amber" : "text-mist"}`}>{label}</p>
      <p className={`mt-3 font-display text-[2.6rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums ${tone === "loss" ? "text-laterite line-through decoration-2" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-white/70">encore gelables au moment de l&apos;alerte</p>
      <ul className="mt-5 space-y-2 border-t border-white/15 pt-5 text-sm">
        {lines.map((l) => (
          <li key={l} className="flex gap-2">
            <IconCheck size={16} className={`mt-0.5 shrink-0 ${tone === "hero" ? "text-amber" : "text-mist"}`} />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bubble({ tone, who, verdict, text }: { tone: "coral" | "green"; who: string; verdict: string; text: string }) {
  const accent = tone === "coral" ? "bg-[#ffe1d8] text-laterite-deep" : "bg-[#d6f5e8] text-sage-deep";
  return (
    <blockquote className="rounded-3xl bg-white p-5 shadow-[0_14px_40px_-24px_rgba(11,27,75,0.45)]">
      <p className="text-xs font-semibold text-slate">{who}</p>
      <p className="mt-2 font-mono text-[13.5px] leading-relaxed text-ink">« {text} »</p>
      <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${accent}`}>{verdict}</p>
    </blockquote>
  );
}

function OutcomeCard({ head, color, icon, tag, title, text, meta, href }: { head: string; color: string; icon: React.ReactNode; tag: string; title: string; text: string; meta: string; href: string }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_-30px_rgba(11,27,75,0.5)]">
      <div className="relative flex h-36 items-end p-5" style={{ background: head, color }}>
        <span className="absolute left-5 top-5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold">{tag}</span>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/80">{icon}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
        <p className="mt-2 flex-1 leading-relaxed text-slate">{text}</p>
        <div className="mt-5 flex items-center justify-between border-t border-paper-line pt-4 text-sm">
          <span className="font-semibold" style={{ color }}>
            {meta}
          </span>
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 font-bold text-ink hover:text-blue">
            Voir <IconArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Step({ n, icon, title, place, children }: { n: number; icon: React.ReactNode; title: string; place: string; children: React.ReactNode }) {
  return (
    <li className="relative rounded-3xl bg-paper p-6">
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue text-white">{icon}</span>
        <span className="font-display text-4xl font-extrabold text-blue/15">{n}</span>
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-ink">{title}</h3>
      <p className="text-xs font-semibold text-blue">{place}</p>
      <p className="mt-2 leading-relaxed text-slate">{children}</p>
    </li>
  );
}

function Ledger({ label, a, b, ra, rb, note }: { label: string; a: string; b: string; ra: number; rb: number; note?: string }) {
  const bar = (r: number, c: string) => (
    <span className="mt-2 block h-2 w-full max-w-[12rem] rounded-full bg-paper">
      <span className="block h-full rounded-full" style={{ width: `${Math.max(4, Math.min(1, r) * 100)}%`, background: c }} />
    </span>
  );
  return (
    <div className="grid grid-cols-[1.3fr_1fr_1fr] items-start gap-4 border-b border-paper-line px-6 py-5 last:border-b-0 md:px-8">
      <div>
        <p className="font-bold text-ink">{label}</p>
        {note && <p className="mt-0.5 text-xs text-slate">{note}</p>}
      </div>
      <div>
        <p className="font-mono text-[15px] tabular-nums text-slate">{a}</p>
        {bar(ra, "#b3c0de")}
      </div>
      <div>
        <p className="font-mono text-[15px] font-semibold tabular-nums text-ink">{b}</p>
        {bar(rb, "#2347e8")}
      </div>
    </div>
  );
}

function Honest({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <p className="flex items-center gap-2 font-bold text-ink">
        <span className="text-blue">{icon}</span>
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate">{children}</p>
    </div>
  );
}

function ChatLine({ who, children }: { who: "vous" | "nexus"; children: React.ReactNode }) {
  const nexus = who === "nexus";
  return (
    <div className={`flex gap-3 py-2 ${nexus ? "" : "justify-end"}`}>
      {nexus && (
        <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue text-white">
          <IconGraph size={17} />
        </span>
      )}
      <p className={`max-w-[86%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${nexus ? "bg-white text-ink" : "bg-ink text-white"}`}>{children}</p>
    </div>
  );
}

function TrustList({ title, icon, items, color, bg }: { title: string; icon: React.ReactNode; items: string[]; color: string; bg: string }) {
  return (
    <div className="rounded-3xl bg-white p-7">
      <h3 className="flex items-center gap-2.5 font-display text-lg font-bold text-ink">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: bg, color }}>
          {icon}
        </span>
        {title}
      </h3>
      <ul className="mt-5 space-y-3">
        {items.map((x) => (
          <li key={x} className="flex gap-2.5 text-slate">
            <IconCheck size={17} className="mt-0.5 shrink-0" style={{ color }} />
            <span className="first-letter:uppercase">{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanCard({ name, price, lines, cta, href, featured }: { name: string; price: string; lines: string[]; cta: string; href: string; featured?: boolean }) {
  return (
    <div className={`relative flex flex-col rounded-3xl p-7 ${featured ? "bg-blue text-white shadow-[0_30px_60px_-28px_rgba(35,71,232,0.9)]" : "bg-paper text-ink"}`}>
      {featured && <span className="absolute -top-3 left-7 rounded-full bg-amber px-3 py-1 text-xs font-bold text-ink">Le cœur du modèle</span>}
      <p className={`font-display text-lg font-bold ${featured ? "text-white" : "text-ink"}`}>{name}</p>
      <p className="mt-2 font-display text-[2rem] font-extrabold leading-tight tracking-[-0.02em]">{price}</p>
      <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
        {lines.map((l) => (
          <li key={l} className="flex gap-2">
            <IconCheck size={17} className={`mt-0.5 shrink-0 ${featured ? "text-amber" : "text-blue"}`} />
            <span className={featured ? "text-white/90" : "text-slate"}>{l}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-bold transition-colors ${
          featured ? "bg-white text-blue hover:bg-amber hover:text-ink" : "bg-ink text-white hover:bg-blue"
        }`}
      >
        {cta} <IconArrowRight size={16} />
      </Link>
    </div>
  );
}
