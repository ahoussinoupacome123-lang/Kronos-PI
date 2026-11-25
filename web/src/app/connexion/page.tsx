import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { loginAsDemo } from "./actions";
import { Wordmark } from "@/components/site/SiteChrome";
import { readSession } from "@/lib/auth";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { IconArrowRight } from "@/components/ui/icons";
import { alerts, fcfa } from "@/lib/data";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ suite?: string; demo?: string }> }) {
  const sp = await searchParams;
  const suite = sp.suite?.startsWith("/tableau-de-bord") ? sp.suite : "/tableau-de-bord";
  if (await readSession()) redirect(suite);
  const highlightDemo = sp.demo === "1";
  const top = alerts.filter((a) => a.priority).sort((a, b) => b.score - a.score)[0];

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col px-6 py-8 md:px-14">
        <Link href="/" aria-label="Retour à l'accueil" className="self-start rounded-lg">
          <Wordmark />
        </Link>
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em]">Espace établissement</h1>
          <p className="mt-3 text-slate">Alertes du consortium, dossiers de litige et échéances de votre réseau.</p>

          <div className="mt-9">
            <LoginForm suite={suite} />
          </div>

          <div className={`mt-10 rounded-2xl border p-5 transition-colors ${highlightDemo ? "border-laterite/40 bg-laterite/[0.06]" : "border-paper-line bg-paper-2"}`}>
            <h2 className="font-medium text-ink">Entrer avec un compte de démonstration</h2>
            <p className="mt-1 text-sm text-slate">Opérateurs fictifs, données synthétiques. Aucun mot de passe à saisir.</p>
            <ul className="mt-4 divide-y divide-paper-line">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email}>
                  <form action={loginAsDemo} className="flex items-center justify-between gap-3 py-2.5">
                    <input type="hidden" name="email" value={a.email} />
                    <input type="hidden" name="suite" value={suite} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{a.name}</span>
                      <span className="block truncate text-xs text-slate">
                        {a.role} · {a.org}
                      </span>
                    </span>
                    <button
                      type="submit"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-paper-line bg-paper px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
                    >
                      Entrer <IconArrowRight size={14} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-xs text-slate">
          En vous connectant, vous acceptez les{" "}
          <Link href="/cgu" className="underline hover:text-ink">
            conditions d&apos;utilisation
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" className="underline hover:text-ink">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <aside className="on-ink relative hidden overflow-hidden bg-ink p-3 lg:block">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-ink-2">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_55%_at_60%_40%,rgba(61,75,196,0.35),transparent_70%)]" />
          <LoginIllustration />
          <div className="absolute inset-x-10 bottom-10">
            <div className="max-w-md rounded-2xl border border-white/10 bg-ink/75 p-5 text-cream backdrop-blur-md">
              <p className="text-xs text-mist">Alerte prioritaire du consortium</p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em]">Mule probable</p>
              <p className="mt-1 text-sm text-cream/80">
                {top.complainants} plaignants · {top.operators.length} réseaux · alerte {top.delayMin} min après la 1re plainte
              </p>
              <p className="mt-3 font-mono text-sm text-[#ffb59a]">{fcfa(top.freezableFcfa)} encore gelables</p>
            </div>
            <p className="mt-6 max-w-md text-sm text-mist">
              {BRAND.name} recommande. Votre équipe décide, et chaque décision est inscrite dans l&apos;audit.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}

function LoginIllustration() {
  // Trois réseaux, leurs plaignants, un bénéficiaire commun : le graphe que chaque opérateur ne voit qu'en partie.
  const ops = [
    { x: 150, y: 170, c: "#7d8cff", label: "ALPHAMONEY" },
    { x: 560, y: 140, c: "#7cc4a4", label: "BETACASH" },
    { x: 360, y: 470, c: "#e8b04b", label: "GAMMAPAY" },
  ];
  const center = { x: 380, y: 270 };
  const people = [
    { x: 215, y: 120, o: 0 },
    { x: 105, y: 245, o: 0 },
    { x: 240, y: 215, o: 0 },
    { x: 505, y: 85, o: 1 },
    { x: 620, y: 215, o: 1 },
    { x: 290, y: 430, o: 2 },
    { x: 440, y: 440, o: 2 },
  ];
  return (
    <svg viewBox="0 0 740 560" className="absolute inset-x-0 top-10 mx-auto w-[92%]" role="img" aria-label="Sept plaignants de trois réseaux reliés au même bénéficiaire">
      <defs>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#e0643a" stopOpacity=".9" />
          <stop offset="1" stopColor="#e0643a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {ops.map((o) => (
        <g key={o.label}>
          <circle cx={o.x} cy={o.y} r="92" fill={o.c} fillOpacity=".06" stroke={o.c} strokeOpacity=".28" strokeDasharray="2 6" />
          <text x={o.x} y={o.y - 104} textAnchor="middle" fill={o.c} fontSize="12" style={{ fontFamily: "var(--font-plex-mono)", letterSpacing: "0.08em" }}>
            {o.label}
          </text>
        </g>
      ))}
      {people.map((p, i) => {
        const o = ops[p.o];
        const mx = (p.x + center.x) / 2;
        const my = Math.min(p.y, center.y) - 50;
        return (
          <g key={i}>
            <path d={`M${p.x} ${p.y} Q${mx} ${my} ${center.x} ${center.y}`} stroke={o.c} strokeOpacity=".75" strokeWidth="1.4" fill="none" />
            <circle cx={p.x} cy={p.y} r="6" fill={o.c} />
            <circle cx={p.x} cy={p.y} r="12" fill={o.c} fillOpacity=".18" />
          </g>
        );
      })}
      <circle cx={center.x} cy={center.y} r="70" fill="url(#core)" />
      <circle cx={center.x} cy={center.y} r="40" fill="none" stroke="#e0643a" strokeOpacity=".5" />
      <circle cx={center.x} cy={center.y} r="14" fill="#e0643a" />
      <text x={center.x + 24} y={center.y + 4} fill="#ece5d6" fontSize="12" style={{ fontFamily: "var(--font-plex-mono)" }}>
        28f7c194…
      </text>
    </svg>
  );
}

// Page dépendante de la session ou de l'URL : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
