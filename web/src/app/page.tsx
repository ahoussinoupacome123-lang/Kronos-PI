import Link from "next/link";
import { KronosLogo, KronosMark } from "@/components/brand/KronosLogo";
import HeroCity from "@/components/kronos/HeroCity";
import { BRAND } from "@/lib/brand";
import { demoCase, headline, hhmm, num } from "@/lib/data";

// Landing KronosPI : une keynote. Une idée par écran, une typographie, une palette
// (nuit, blanc, gris clair, un seul corail pour l'alerte).
const F = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} F`;

export default function Home() {
  const cons = headline.consortium;
  const solo = headline.solo;
  const alert = demoCase.alerte;

  return (
    <main className="font-keynote bg-[#0a0b0f] text-[#f5f5f7] antialiased">
      {/* HERO — la référence : moitié givrée, moitié nette, le nom découpé dans le givre */}
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <HeroCity word="KRONOSPI" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#070a14]/80 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#0a0b0f] to-transparent" />
        <h1 className="sr-only">{BRAND.name}</h1>

        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-6 md:px-12">
          <Link href="/" aria-label={`${BRAND.name}, accueil`} className="rounded-lg">
            <KronosLogo size={34} />
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-9 text-[13px] font-medium tracking-[0.08em] text-white/80 md:flex">
            <a href="#probleme" className="hover:text-white">
              LE PROBLÈME
            </a>
            <a href="#idee" className="hover:text-white">
              L&apos;IDÉE
            </a>
            <a href="#aicha" className="hover:text-white">
              UN CAS
            </a>
            <a href="#chiffres" className="hover:text-white">
              LES CHIFFRES
            </a>
            <Link href="/connexion?demo=1" className="rounded-full bg-white/12 px-4 py-2 text-white backdrop-blur-md hover:bg-white/20">
              DÉMO
            </Link>
          </nav>
        </header>

        <div className="absolute bottom-[12%] left-6 z-10 max-w-[30rem] md:left-12">
          <p className="text-[clamp(1.05rem,1.6vw,1.35rem)] font-light italic leading-snug text-white/90">
            L&apos;argent volé traverse les réseaux en quelques minutes. Nous le voyons passer, avant qu&apos;il ne sorte en espèces.
          </p>
          <a href="#probleme" className="mt-5 inline-block border-b border-white/60 pb-1 text-[13px] font-semibold tracking-[0.12em] text-white hover:border-white">
            DÉCOUVRIR KRONOSPI
          </a>
        </div>

        <div className="absolute bottom-[12%] right-6 z-10 hidden items-center gap-4 text-[12px] tracking-[0.14em] text-white/70 md:right-12 md:flex">
          <span>01 / 05</span>
          <span className="h-px w-16 bg-white/40" />
          <span>GPU CHALLENGE 2026</span>
        </div>
      </section>

      {/* 02 — LE PROBLÈME, en une phrase */}
      <section id="probleme" className="flex min-h-[100svh] scroll-mt-0 items-center px-6 py-32 md:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="kn-reveal text-[clamp(2.6rem,6.6vw,6.2rem)] font-bold leading-[1.02] tracking-[-0.045em] text-balance">
            Une arnaque traverse les réseaux. <span className="text-[#86868b]">Personne ne la voit en entier.</span>
          </h2>
          <p className="kn-reveal mx-auto mt-10 max-w-[38rem] text-[clamp(1.1rem,1.6vw,1.4rem)] leading-relaxed text-[#a1a1a6]">
            La victime est chez un opérateur, le compte mule chez un autre. Depuis PI-SPI, un transfert ne s&apos;annule plus. Et 88 % des dépôts repartent en
            espèces.
          </p>
        </div>
      </section>

      {/* 03 — L'IDÉE */}
      <section id="idee" className="px-6 py-32 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="kn-reveal text-center text-[clamp(2.6rem,6.6vw,6.2rem)] font-bold leading-[1.02] tracking-[-0.045em]">Chaque plainte est un capteur.</h2>
          <p className="kn-reveal mx-auto mt-8 max-w-[36rem] text-center text-[clamp(1.1rem,1.6vw,1.4rem)] leading-relaxed text-[#a1a1a6]">
            Seule, elle ne dit rien. Croisée entre réseaux, elle désigne le compte mule.
          </p>
          <div className="kn-reveal mx-auto mt-20 max-w-4xl">
            <ConvergenceDiagram />
          </div>
          <div className="mt-20 grid gap-14 text-center md:grid-cols-3">
            {[
              ["Lire", "Chaque opérateur lit ses propres plaintes. Le texte ne sort jamais de chez lui."],
              ["Masquer", "Seule une empreinte du numéro bénéficiaire part au hub. Ni nom, ni message."],
              ["Croiser", "Trois plaignants, deux réseaux, une heure : le compte mule apparaît."],
            ].map(([t, d]) => (
              <div key={t} className="kn-reveal">
                <h3 className="text-[clamp(1.6rem,2.4vw,2.2rem)] font-semibold tracking-[-0.03em]">{t}</h3>
                <p className="mx-auto mt-3 max-w-[20rem] text-[17px] leading-relaxed text-[#a1a1a6]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — UN CAS : Aïcha, sur fond clair */}
      <section id="aicha" className="bg-[#f5f5f7] px-6 py-32 text-[#1d1d1f] md:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="kn-reveal text-center text-[clamp(1.1rem,1.6vw,1.4rem)] font-medium text-[#6e6e73]">Un mardi à Cotonou.</p>
          <h2 className="kn-reveal mt-3 text-center text-[clamp(3rem,8vw,7.5rem)] font-bold leading-none tracking-[-0.05em]">14 h 02.</h2>
          <p className="kn-reveal mx-auto mt-8 max-w-[40rem] text-center text-[clamp(1.1rem,1.6vw,1.4rem)] leading-relaxed text-[#424245]">
            Aïcha reçoit un faux SMS de dépôt et renvoie {F(demoCase.extraction.amount_fcfa)} sur un compte d&apos;un autre réseau. Elle n&apos;est pas la seule.
          </p>

          <ol className="kn-reveal mt-20 grid gap-10 border-t border-[#d2d2d7] pt-10 md:grid-cols-5 md:gap-6">
            {[
              ["14:02", "Le faux SMS", false],
              [hhmm(demoCase.reclamation.received_at), "Aïcha se plaint", false],
              ["14:16", "D'autres victimes, d'autres réseaux", false],
              [hhmm(alert.alert_at), "Alerte : mule probable", true],
              ["14:40", "Le premier retrait arrive trop tard", false],
            ].map(([t, d, hot]) => (
              <li key={t as string}>
                <p className={`text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold tabular-nums tracking-[-0.03em] ${hot ? "text-[#e5481f]" : ""}`}>{t as string}</p>
                <p className="mt-2 text-[17px] leading-snug text-[#424245]">{d as string}</p>
              </li>
            ))}
          </ol>

          <div className="mt-24 grid gap-14 md:grid-cols-3">
            {[
              ["Le réseau du compte mule", "reçoit l'alerte et le montant encore gelable. Son équipe suspend les retraits, et signe sa décision."],
              ["Le réseau d'Aïcha", "ne bloque rien chez un concurrent. Il reçoit son dossier PI-SPI, prêt, minuté à trois jours ouvrés."],
              [BRAND.name, "ne voit ni noms ni messages, et ne gèle jamais seul. Il recommande ; l'humain décide."],
            ].map(([t, d]) => (
              <div key={t} className="kn-reveal">
                <h3 className="text-[22px] font-semibold tracking-[-0.02em]">{t}</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-[#424245]">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-16 text-center text-[13px] text-[#6e6e73]">Scénario tiré du corpus synthétique de la démonstration.</p>
        </div>
      </section>

      {/* 05 — LES CHIFFRES */}
      <section id="chiffres" className="px-6 py-32 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="kn-reveal text-center text-[clamp(2.6rem,6.6vw,6.2rem)] font-bold leading-[1.02] tracking-[-0.045em]">
            Plus tôt. <span className="text-[#86868b]">Donc plus d&apos;argent sauvé.</span>
          </h2>
          <div className="mt-24 grid gap-16 text-center md:grid-cols-3 md:gap-8">
            <Figure value={`${num(cons.delai_detection_median_minutes)} min`} label="pour donner l'alerte" vs={`${num(solo.delai_detection_median_minutes)} min pour un opérateur seul`} />
            <Figure value={`${cons.campagnes_detectees} sur ${cons.campagnes_injectees}`} label="campagnes de mules repérées" vs={`${solo.campagnes_detectees} sur ${solo.campagnes_injectees} pour un opérateur seul`} />
            <Figure value={F(cons.fcfa_encore_gelables_total)} label="encore gelables à l'alerte" vs={`${F(solo.fcfa_encore_gelables_total)} pour un opérateur seul`} accent />
          </div>
          <p className="mx-auto mt-20 max-w-[44rem] text-center text-[15px] leading-relaxed text-[#86868b]">
            Mesuré sur 20 000 réclamations synthétiques et 5 campagnes, contre l&apos;opérateur seul avec la même règle. Générateur et vérité terrain publiés.
          </p>
        </div>
      </section>

      {/* CLÔTURE */}
      <section className="flex min-h-[90svh] items-center px-6 py-32 md:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="kn-reveal flex justify-center">
            <KronosMark size={120} />
          </div>
          <h2 className="kn-reveal mt-12 text-[clamp(2.6rem,6.2vw,5.6rem)] font-bold leading-[1.02] tracking-[-0.045em]">
            Huit semaines. <span className="text-[#86868b]">Deux réseaux.</span>
          </h2>
          <p className="kn-reveal mx-auto mt-8 max-w-[34rem] text-[clamp(1.1rem,1.6vw,1.4rem)] leading-relaxed text-[#a1a1a6]">
            Un pilote sur vos réclamations anonymisées. Tout tourne chez vous.
          </p>
          <div className="kn-reveal mt-12 flex flex-wrap items-center justify-center gap-6">
            <Link href="/connexion?demo=1" className="rounded-full bg-[#f5f5f7] px-7 py-3.5 text-[17px] font-semibold text-[#0a0b0f] transition-colors hover:bg-white">
              Voir la démo
            </Link>
            <a href={`mailto:${BRAND.contact}`} className="text-[17px] font-medium text-[#2997ff] hover:underline">
              Proposer un pilote ›
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-[12px] text-[#86868b] md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <KronosLogo size={22} />
          <p>
            Équipe {BRAND.team} · GPU Challenge 2026 · Epitech Bénin · projet déposé sous le nom {BRAND.legacyName}
          </p>
          <p className="flex gap-5">
            <Link href="/cgu" className="hover:text-white">
              Conditions
            </Link>
            <Link href="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

function Figure({ value, label, vs, accent }: { value: string; label: string; vs: string; accent?: boolean }) {
  return (
    <div className="kn-reveal">
      <p className={`whitespace-nowrap text-[clamp(2.6rem,5vw,4.8rem)] font-bold leading-none tracking-[-0.05em] tabular-nums ${accent ? "text-[#ff6a3d]" : ""}`}>{value}</p>
      <p className="mt-4 text-[19px] font-medium">{label}</p>
      <p className="mt-1 text-[15px] text-[#86868b]">{vs}</p>
    </div>
  );
}

/** Trois réseaux, leurs plaintes, un seul compte : le schéma de l'idée, sans légende inutile. */
function ConvergenceDiagram() {
  const nets = [
    { x: 120, y: 80, label: "Réseau A" },
    { x: 120, y: 320, label: "Réseau B" },
    { x: 760, y: 200, label: "Réseau C" },
  ];
  const mule = { x: 470, y: 200 };
  return (
    <div className="relative">
      <svg viewBox="0 0 880 400" className="w-full" role="img" aria-label="Les plaintes de trois réseaux convergent vers un même compte">
        <defs>
          <radialGradient id="kn-glow">
            <stop offset="0" stopColor="#ff6a3d" stopOpacity=".55" />
            <stop offset="1" stopColor="#ff6a3d" stopOpacity="0" />
          </radialGradient>
        </defs>
        {nets.map((n, i) => (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r="54" fill="none" stroke="#f5f5f7" strokeOpacity=".18" />
            {[-16, 0, 16].map((d, k) => (
              <path
                key={k}
                d={`M${n.x + (i === 2 ? -30 : 30)} ${n.y + d} C ${(n.x + mule.x) / 2} ${n.y + d}, ${(n.x + mule.x) / 2} ${mule.y}, ${mule.x} ${mule.y}`}
                fill="none"
                stroke="#f5f5f7"
                strokeOpacity={0.55 - k * 0.12}
                strokeWidth="1.4"
              />
            ))}
            <circle cx={n.x} cy={n.y} r="8" fill="#f5f5f7" />
          </g>
        ))}
        <circle cx={mule.x} cy={mule.y} r="90" fill="url(#kn-glow)" />
        <circle cx={mule.x} cy={mule.y} r="16" fill="#ff6a3d" />
        <circle cx={mule.x} cy={mule.y} r="34" fill="none" stroke="#ff6a3d" strokeOpacity=".5" />
      </svg>
      {nets.map((n) => (
        <span
          key={n.label}
          className="absolute -translate-x-1/2 text-[13px] font-medium tracking-[0.1em] text-[#86868b]"
          style={{ left: `${(n.x / 880) * 100}%`, top: `${((n.y + 70) / 400) * 100}%` }}
        >
          {n.label.toUpperCase()}
        </span>
      ))}
      <span className="absolute -translate-x-1/2 text-[13px] font-semibold tracking-[0.1em] text-[#ff6a3d]" style={{ left: `${(mule.x / 880) * 100}%`, top: `${((mule.y + 46) / 400) * 100}%` }}>
        COMPTE MULE
      </span>
    </div>
  );
}
