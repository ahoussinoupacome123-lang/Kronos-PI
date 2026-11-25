import Link from "next/link";
import HeroGraph, { type HeroEvent } from "@/components/landing/HeroGraph";
import IssuerMarquee from "@/components/landing/IssuerMarquee";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import {
  IconArrowRight,
  IconClock,
  IconFile,
  IconGraph,
  IconHash,
  IconLock,
  IconMessage,
  IconRefund,
  IconShield,
  IconSnow,
} from "@/components/ui/icons";
import { bench, dossiers, demoCase, fcfa, graphs, headline, hhmm, meta, num, pct, tokenCost, volumes } from "@/lib/data";

const demoGraph = graphs[demoCase.alerte.alert_id];

const heroEvents: HeroEvent[] = demoGraph.edges
  .filter((e) => e.ts && e.operator)
  .map((e) => ({ ts: e.ts!, operator: e.operator!, amount: e.amount_rounded_fcfa ?? 0, order: e.order ?? 0 }))
  .sort((a, b) => a.ts.localeCompare(b.ts));

const sincere = dossiers.find((d) => d.decision === "REMBOURSER" && d.text.toLowerCase().includes("erreur"))!;

export default function Home() {
  const solo = headline.solo;
  const cons = headline.consortium;
  const prio = headline.prioritized;
  const ambiguous = bench.typology.sous_corpus_ambigu as { n: number; part_du_corpus: number };

  return (
    <main>
      {/* HERO */}
      <section className="p-2 md:p-3">
        <div className="on-ink relative isolate min-h-[min(940px,100svh)] overflow-hidden rounded-[28px] bg-ink text-cream md:rounded-[36px]">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_70%_35%,rgba(61,75,196,0.35),transparent_70%),radial-gradient(50%_45%_at_15%_85%,rgba(224,100,58,0.16),transparent_70%)]"
          />
          {/* Le mot géant, derrière le graphe */}
          <p
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-[-0.18em] -z-10 select-none text-center font-display text-[20vw] font-bold leading-none tracking-[-0.05em] text-cream/[0.06]"
          >
            graphe
          </p>
          <HeroGraph
            events={heroEvents}
            firesAt={demoGraph.fires_at ?? demoCase.alerte.alert_at}
            totalFcfa={demoCase.alerte.freezable_fcfa}
            delayMin={demoCase.alerte.detection_delay_minutes}
          />
          <SiteHeader tone="ink" />

          <div className="pointer-events-none relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-[9vh] md:px-10">
            <h1 className="rise max-w-[13ch] font-display text-[clamp(3rem,7.4vw,6rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-balance">
              Chaque plainte est un capteur.
            </h1>
            <p className="rise mt-7 max-w-[34rem] text-lg leading-relaxed text-cream/80 [animation-delay:120ms] md:text-xl">
              Seule, elle ne dit rien. Croisée entre opérateurs, elle démasque le compte mule{" "}
              <span className="text-cream">avant le retrait</span>, et devient d&apos;elle-même un dossier de litige PI-SPI
              dans les délais.
            </p>
            <div className="rise pointer-events-auto mt-9 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
              <Link
                href="/connexion?demo=1"
                className="inline-flex items-center gap-2 rounded-full bg-laterite px-6 py-3.5 font-medium text-paper-2 shadow-[0_10px_30px_-10px_rgba(224,100,58,0.9)] transition-[background-color,transform] duration-300 hover:bg-laterite-deep active:scale-[0.98]"
              >
                Ouvrir la démo <IconArrowRight size={18} />
              </Link>
              <Link
                href="#preuves"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 font-medium text-cream transition-colors hover:bg-white/10"
              >
                Voir les résultats mesurés
              </Link>
            </div>
            <p className="rise mt-10 max-w-md text-sm text-mist [animation-delay:360ms]">
              Ci-contre : sept victimes, trois réseaux, un seul compte bénéficiaire. Rejoué depuis le pipeline, sur données
              synthétiques.
            </p>
          </div>
        </div>
      </section>

      <IssuerMarquee />

      {/* PROBLÈME */}
      <section id="probleme" className="scroll-mt-10 py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
              Deux récits. Les mêmes mots.
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-[#2a2f3d]">
              <p>
                La réclamation la plus fréquente de l&apos;UEMOA, « j&apos;ai envoyé au mauvais numéro », et la fraude la plus
                fréquente, « je me suis trompé, renvoyez-moi l&apos;argent », s&apos;écrivent de la même façon.
              </p>
              <p>
                Depuis PI-SPI, un transfert confirmé est <strong className="font-semibold">irrévocable</strong> : seule la
                personne qui a reçu l&apos;argent peut le rendre. La victime est chez un opérateur, le compte mule chez un autre.
                Chacun ne voit que la moitié du dossier, et 88 % des dépôts repartent en espèces.
              </p>
              <p className="rounded-2xl border border-paper-line bg-paper-2 p-5 text-base">
                Nous l&apos;avons mesuré : sur les <strong className="font-semibold tabular">{num(ambiguous.n)}</strong> plaintes
                ambiguës de notre corpus ({pct(ambiguous.part_du_corpus, 1)}), aucun moteur de lecture de texte ne dépasse le
                score d&apos;une réponse unique. Le signal n&apos;est pas dans une plainte. Il est dans le croisement de plusieurs.
              </p>
            </div>
          </div>

          <figure className="relative">
            <div className="grid gap-4">
              <Bubble
                tone="laterite"
                who={`${demoCase.reclamation.complainant_name} · ${demoCase.reclamation.operator} · ${hhmm(demoCase.reclamation.received_at)}`}
                verdict="Victime d'une campagne : 7 plaignants, 3 réseaux, 1 bénéficiaire"
                text={demoCase.reclamation.text}
              />
              <Bubble
                tone="sage"
                who={`Client ${sincere.operator} · ${hhmm(sincere.receivedAt)}`}
                verdict="Erreur sincère : aucun autre signalement, dossier de remboursement"
                text={sincere.text}
              />
            </div>
            <figcaption className="mt-4 text-sm text-slate">
              Deux plaintes réelles du corpus synthétique, telles qu&apos;écrites : fautes, abréviations, montants en toutes
              lettres. Lues une par une, elles se ressemblent.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section id="fonctionnement" className="scroll-mt-10 bg-paper-3/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="max-w-3xl font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
            Une entrée, la plainte. Deux sorties : geler ou rembourser.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-[#2a2f3d]">
            Le texte du client ne quitte jamais son opérateur. Seule une empreinte du bénéficiaire part au hub, et c&apos;est
            assez pour compter les victimes.
          </p>

          <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-paper-line bg-paper-line md:grid-cols-4">
            <Step icon={<IconMessage />} title="Lire" place="chez l'opérateur">
              <p>Le SMS bruité devient une fiche : typologie, montant, heure, bénéficiaire, réseau.</p>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-3 font-mono text-[11.5px] leading-relaxed text-cream/90">
{`{ "typologie": "ARNAQUE_ERREUR_DEPOT",
  "montant": ${demoCase.extraction.amount_fcfa},
  "heure": "${hhmm(demoCase.extraction.event_at)}",
  "beneficiaire": "koffi.s…" }`}
              </pre>
            </Step>
            <Step icon={<IconHash />} title="Pseudonymiser" place="chez l'opérateur">
              <p>L&apos;alias est haché avec une clé de consortium. Le montant part arrondi au pas de 5 000 FCFA.</p>
              <p className="mt-4 rounded-xl bg-paper-3 px-3 py-2 font-mono text-[12px] text-ink">
                koffi.s… → <span className="text-laterite-deep">{demoCase.alerte.alias_hmac}</span>
              </p>
            </Step>
            <Step icon={<IconGraph />} title="Croiser" place="au hub">
              <p>
                Le hub relie plaignants, bénéficiaires et réseaux. La règle est visible et ne bouge pas :
              </p>
              <p className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em]">3 · 2 · 60</p>
              <p className="text-sm text-slate">plaignants indépendants · réseaux distincts · minutes</p>
            </Step>
            <Step icon={<IconShield />} title="Agir" place="décision humaine">
              <p className="flex items-start gap-2">
                <IconSnow size={18} className="mt-0.5 shrink-0 text-laterite-deep" />
                <span>Mule probable : les réseaux concernés sont prévenus, avec le montant encore gelable.</span>
              </p>
              <p className="mt-3 flex items-start gap-2">
                <IconRefund size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                <span>Erreur sincère : demande d&apos;annulation pré-remplie, minuteur J+3 et J+30.</span>
              </p>
            </Step>
          </ol>

          <p className="mt-6 flex items-center gap-2 text-sm text-slate">
            <IconLock size={16} /> Réclam&apos;Graph recommande et documente. Il ne gèle jamais seul : la décision reste chez
            l&apos;opérateur, tracée dans l&apos;audit.
          </p>
        </div>
      </section>

      {/* PREUVES */}
      <section id="preuves" className="scroll-mt-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
              Mesuré contre la situation actuelle.
            </h2>
            <p className="text-lg text-[#2a2f3d]">
              La référence n&apos;est pas un homme de paille : c&apos;est l&apos;opérateur seul, avec la même règle de croisement,
              privé des autres réseaux. Même corpus, {num(volumes.n_reclamations)} réclamations, vérité terrain publiée.
            </p>
          </div>

          <div className="mt-14 overflow-hidden rounded-3xl border border-paper-line bg-paper-2">
            <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-paper-line bg-paper-3/70 px-6 py-3 text-sm text-slate md:px-8">
              <span>Détection des comptes mules</span>
              <span>Opérateur seul</span>
              <span className="font-medium text-ink">Réclam&apos;Graph</span>
            </div>
            <Ledger
              label="Campagnes détectées"
              soloText={`${solo.campagnes_detectees} sur ${solo.campagnes_injectees}`}
              consText={`${cons.campagnes_detectees} sur ${cons.campagnes_injectees}`}
              soloRatio={solo.rappel}
              consRatio={cons.rappel}
            />
            <Ledger
              label="Délai médian depuis la 1re plainte"
              soloText={`${num(solo.delai_detection_median_minutes)} min`}
              consText={`${num(cons.delai_detection_median_minutes)} min`}
              soloRatio={(solo.delai_detection_median_minutes ?? 0) / 60}
              consRatio={(cons.delai_detection_median_minutes ?? 0) / 60}
              lowerIsBetter
            />
            <Ledger
              label="FCFA encore gelables au moment de l'alerte"
              soloText={fcfa(solo.fcfa_encore_gelables_total)}
              consText={fcfa(cons.fcfa_encore_gelables_total)}
              soloRatio={solo.fcfa_encore_gelables_total / cons.fcfa_encore_gelables_total}
              consRatio={1}
            />
            <Ledger
              label="Précision des alertes prioritaires"
              soloText={pct(solo.precision)}
              consText={`${prio.alertes_vraies} sur ${prio.alertes_totales} après score`}
              soloRatio={solo.precision}
              consRatio={prio.precision}
              note={`Règle brute : ${pct(cons.precision)}. Score réglé sur ce même corpus : à confirmer sur données réelles. Les alertes sous le score restent visibles « à qualifier ».`}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Honest title="Ce que nous ne gagnons pas">
              Sur la typologie seule, la référence supervisée TF-IDF fait mieux (F1{" "}
              {num(bench.typology.reference_tfidf_logreg.f1_macro, 2)}) que notre extracteur sans étiquettes (
              {num(bench.typology.heuristique_locale.f1_macro, 2)}). Nous le publions : la valeur n&apos;est pas là.
            </Honest>
            <Honest title="Ce qui coûte peu">
              Analyser 1 000 réclamations par une API cloud revient à {num(tokenCost.cout_api_cloud_pour_1000_fcfa, 0)} FCFA,
              d&apos;après les tokens mesurés. Un agent humain : 270 000 FCFA (estimation). Le coût n&apos;est pas le verrou ;
              la confidentialité et le croisement le sont.
            </Honest>
            <Honest title="Ce qui reste à prouver">
              {meta.extractionEngines.includes("llm")
                ? "Extraction par LLM local mesurée sur GPU."
                : "Le run publié utilise l'extracteur local de repli, pas encore le LLM : la mesure sur GPU est la prochaine étape."}{" "}
              Données synthétiques, 5 campagnes : l&apos;incertitude est large. Le pilote sur données réelles tranchera.
            </Honest>
          </div>
        </div>
      </section>

      {/* DOSSIER */}
      <section className="on-ink bg-ink py-24 text-cream">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
              La vraie erreur repart avec son dossier, déjà minuté.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-cream/80">
              Quand rien ne converge, la plainte n&apos;est pas suspecte : elle mérite d&apos;être remboursée vite. Réclam&apos;Graph
              pré-remplit la demande d&apos;annulation PI-SPI, sur une ossature inspirée d&apos;ISO 20022, et pose les échéances
              réglementaires.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                ["J+3 jours ouvrés", "remboursement, Instruction BCEAO n° 008-05-2015, art. 35"],
                ["J+30 jours", "réponse au client, Circulaire n° 002-2020/CB/C"],
                ["Échéance PI-Reclam", "paramétrable : les délais des conventions ne sont pas publics"],
              ].map(([k, v]) => (
                <li key={k} className="flex gap-4">
                  <IconClock className="mt-1 shrink-0 text-amber" />
                  <span>
                    <span className="font-medium text-cream">{k}</span>
                    <span className="block text-sm text-mist">{v}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <DossierPreview />
        </div>
      </section>

      {/* NEXUS */}
      <section id="nexus" className="scroll-mt-10 py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
              Nexus vous dit quoi faire ensuite.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#2a2f3d]">
              Nexus est l&apos;assistant du tableau de bord. Il lit le graphe et les échéances, pas internet : chaque réponse
              cite l&apos;alerte, le dossier ou la mesure d&apos;où elle vient. Il propose ; vous décidez.
            </p>
            <p className="mt-4 text-[#2a2f3d]">
              Aujourd&apos;hui, il répond à partir des seuls résultats mesurés. Il est prévu pour se brancher sur le même modèle
              open-weight que le pipeline, sur le GPU de l&apos;établissement, sans que le texte d&apos;un client sorte de chez vous.
            </p>
          </div>
          <div className="rounded-3xl border border-paper-line bg-paper-2 p-6 shadow-[0_2px_4px_rgba(10,14,26,0.04),0_30px_60px_-30px_rgba(10,14,26,0.25)]">
            <ChatLine who="vous">Par quoi je commence ce matin ?</ChatLine>
            <ChatLine who="nexus">
              Une alerte prioritaire attend une décision : le bénéficiaire <code className="font-mono text-[12px]">{demoCase.alerte.alias_hmac.slice(0, 8)}…</code>,
              signalé par {demoCase.alerte.n_complainants} plaignants sur {demoCase.alerte.n_operators} réseaux.{" "}
              {fcfa(demoCase.alerte.freezable_fcfa)} étaient encore gelables à l&apos;alerte. Le compte est hébergé chez{" "}
              {demoCase.extraction.destination_operator} : c&apos;est à eux de suspendre.
            </ChatLine>
            <ChatLine who="vous">Et si c&apos;était un innocent ?</ChatLine>
            <ChatLine who="nexus">
              La règle exige au moins 3 plaignants sur 2 réseaux ; ici, {demoCase.alerte.n_complainants} plaignants sur{" "}
              {demoCase.alerte.n_operators} réseaux décrivent le même faux dépôt. Je recommande une suspension temporaire et
              réversible des retraits, pas un blocage. Votre décision, son motif et son auteur sont inscrits dans l&apos;audit.
            </ChatLine>
          </div>
        </div>
      </section>

      {/* CONFIANCE */}
      <section id="confiance" className="scroll-mt-10 bg-paper-3/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="max-w-3xl font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
            Ce qui quitte l&apos;opérateur tient en une ligne.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-paper-line bg-paper-2 p-7">
              <h3 className="flex items-center gap-2 font-medium">
                <IconLock size={18} className="text-sage-deep" /> Ne sort jamais
              </h3>
              <ul className="mt-4 space-y-2.5 text-[#2a2f3d]">
                {meta.privacy.ne_sort_jamais.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-deep" />
                    <span className="first-letter:uppercase">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-paper-line bg-paper-2 p-7">
              <h3 className="flex items-center gap-2 font-medium">
                <IconHash size={18} className="text-indigo-deep" /> Part au hub
              </h3>
              <ul className="mt-4 space-y-2.5 text-[#2a2f3d]">
                {meta.privacy.sort.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-deep" />
                    <span className="first-letter:uppercase">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate">
            Limite connue, dite avant qu&apos;on nous la dise : {meta.privacy.limite_connue} En production :{" "}
            {meta.privacy.production}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="on-ink relative overflow-hidden rounded-[32px] bg-ink px-8 py-16 text-cream md:px-16">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgba(224,100,58,0.28),transparent_70%)]" />
            <div className="relative grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
              <div>
                <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
                  Huit semaines, deux réseaux, vos réclamations anonymisées.
                </h2>
                <p className="mt-5 max-w-xl text-lg text-cream/80">
                  Le pilote mesure ce que la démo ne peut pas : le rappel sur de vraies campagnes, le délai réel, les FCFA
                  rendus aux victimes. Tout tourne chez vous.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  href="/connexion?demo=1"
                  className="inline-flex items-center gap-2 rounded-full bg-laterite px-6 py-3.5 font-medium text-paper-2 transition-colors hover:bg-laterite-deep"
                >
                  Explorer le tableau de bord <IconArrowRight size={18} />
                </Link>
                <a href="mailto:contact@reclamgraph.example" className="text-sm text-mist underline hover:text-cream">
                  contact@reclamgraph.example
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Bubble({ tone, who, verdict, text }: { tone: "laterite" | "sage"; who: string; verdict: string; text: string }) {
  const accent = tone === "laterite" ? "text-laterite-deep bg-laterite/10" : "text-sage-deep bg-sage/15";
  return (
    <blockquote className="rounded-3xl border border-paper-line bg-paper-2 p-5 shadow-[0_1px_2px_rgba(10,14,26,0.04),0_16px_40px_-24px_rgba(10,14,26,0.3)]">
      <p className="text-xs text-slate">{who}</p>
      <p className="mt-2 font-mono text-[13.5px] leading-relaxed text-ink">« {text} »</p>
      <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${accent}`}>{verdict}</p>
    </blockquote>
  );
}

function Step({ icon, title, place, children }: { icon: React.ReactNode; title: string; place: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col bg-paper-2 p-6 text-[#2a2f3d]">
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-cream">{icon}</span>
        <span className="text-xs text-slate">{place}</span>
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-[-0.02em] text-ink">{title}</h3>
      <div className="mt-2 text-[15px] leading-relaxed">{children}</div>
    </li>
  );
}

function Ledger({
  label,
  soloText,
  consText,
  soloRatio,
  consRatio,
  lowerIsBetter,
  note,
}: {
  label: string;
  soloText: string;
  consText: string;
  soloRatio: number;
  consRatio: number;
  lowerIsBetter?: boolean;
  note?: string;
}) {
  const bar = (r: number, color: string) => (
    <span className="mt-2 block h-1.5 w-full max-w-[12rem] rounded-full bg-paper-3">
      <span className="block h-full rounded-full" style={{ width: `${Math.max(4, Math.min(1, r) * 100)}%`, background: color }} />
    </span>
  );
  return (
    <div className="grid grid-cols-[1.3fr_1fr_1fr] items-start gap-4 border-b border-paper-line px-6 py-5 last:border-b-0 md:px-8">
      <div>
        <p className="font-medium text-ink">{label}</p>
        {lowerIsBetter && <p className="text-xs text-slate">plus court est meilleur</p>}
        {note && <p className="mt-1 text-xs text-slate">{note}</p>}
      </div>
      <div>
        <p className="font-mono text-[15px] tabular-nums text-slate">{soloText}</p>
        {bar(soloRatio, "var(--color-slate)")}
      </div>
      <div>
        <p className="font-mono text-[15px] font-medium tabular-nums text-ink">{consText}</p>
        {bar(consRatio, "var(--color-laterite)")}
      </div>
    </div>
  );
}

function Honest({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-paper-line p-5">
      <h3 className="font-medium text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#2a2f3d]">{children}</p>
    </div>
  );
}

function ChatLine({ who, children }: { who: "vous" | "nexus"; children: React.ReactNode }) {
  const isNexus = who === "nexus";
  return (
    <div className={`flex gap-3 py-2.5 ${isNexus ? "" : "justify-end"}`}>
      {isNexus && (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-cream">
          <IconGraph size={16} />
        </span>
      )}
      <p
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isNexus ? "bg-paper-3 text-ink" : "bg-ink text-cream"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function DossierPreview() {
  const d = dossiers.find((x) => x.decision === "REMBOURSER") ?? dossiers[0];
  return (
    <div className="rounded-3xl border border-ink-line bg-ink-2 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-sm text-cream">
          <IconFile size={18} className="text-sage" /> {d.id}
        </p>
        <span className="rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage">Rembourser</span>
      </div>
      <p className="mt-4 rounded-xl bg-white/5 p-3 font-mono text-[12.5px] leading-relaxed text-cream/85">« {d.text} »</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Field k="Montant" v={fcfa(d.amountFcfa)} />
        <Field k="Réseau du bénéficiaire" v={d.destination ?? "—"} />
        <Field k="Remboursement dû" v={new Date(d.timer.refund_due_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} />
        <Field k="Réponse au client" v={new Date(d.timer.client_answer_due_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} />
      </dl>
      <p className="mt-5 font-mono text-[11.5px] text-mist">FIToFIPmtCxlReq · inspiré d&apos;ISO 20022 camt.056 · non certifié</p>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2.5">
      <dt className="text-xs text-mist">{k}</dt>
      <dd className="mt-0.5 font-mono tabular-nums text-cream">{v}</dd>
    </div>
  );
}
