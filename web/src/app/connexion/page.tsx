import Image from "next/image";
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
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col px-6 py-8 md:px-14">
        <Link href="/" aria-label="Retour à l'accueil" className="self-start rounded-lg">
          <Wordmark />
        </Link>
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-[clamp(2rem,8.4vw,2.6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-balance">Espace établissement</h1>
          <p className="mt-3 text-slate">Alertes du consortium, dossiers de litige et échéances de votre réseau.</p>

          <div className="mt-9">
            <LoginForm suite={suite} />
          </div>

          <div className={`mt-10 rounded-2xl border p-5 transition-colors ${highlightDemo ? "border-sage/50 bg-sky" : "border-paper-line bg-paper-2"}`}>
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

      <aside className="relative hidden p-3 lg:sticky lg:top-0 lg:block lg:h-dvh">
        <div className="relative h-full overflow-hidden rounded-[32px] bg-paper-3">
          <Image src="/visuels/responsable-fraude.jpg" alt="Une responsable litiges et fraude au travail." fill sizes="50vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
          <Image src="/visuels/objet-bouclier.png" alt="" width={900} height={900} sizes="140px" className="flotte-css absolute right-8 top-8 w-[140px] drop-shadow-[0_24px_24px_rgba(15,23,18,.3)]" />
          <div className="absolute inset-x-8 bottom-8">
            <div className="rise max-w-md rounded-[22px] bg-paper-2 p-5 text-ink shadow-[0_30px_60px_-30px_rgba(15,23,18,.6)]">
              <p className="flex items-center gap-2 text-xs font-semibold text-laterite-deep">
                <span className="h-2 w-2 rounded-full bg-laterite" /> Alerte prioritaire du consortium
              </p>
              <p className="mt-2 font-display text-2xl font-bold tracking-[-0.03em]">Mule probable</p>
              <p className="mt-1 text-sm text-slate">
                {top.complainants} plaignants · {top.operators.length} réseaux · alerte {top.delayMin} min après la 1re plainte
              </p>
              <p className="mt-3 inline-flex rounded-full bg-sky px-3 py-1 font-mono text-sm font-medium text-sage-deep">{fcfa(top.freezableFcfa)} encore gelables</p>
            </div>
            <p className="rise mt-5 max-w-md text-sm text-cream [animation-delay:150ms]">
              {BRAND.name} recommande. Votre équipe décide, et chaque décision est inscrite dans l&apos;audit.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}

// Page dépendante de la session ou de l'URL : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
