import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { SECTIONS_ACCUEIL } from "@/lib/sections";

/** Marque provisoire (le logo définitif viendra plus tard) : nom + X sur pastille lime, comme sur l'accueil. */
export function Wordmark({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  const base = BRAND.name.replace(/X$/, "");
  return (
    <span className={`inline-flex items-center font-display text-[1.45rem] font-extrabold tracking-[-0.04em] ${onDark ? "text-white" : "text-ink"} ${className}`}>
      {base}
      <span className="ml-[3px] inline-grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-lime text-[1.3rem] text-ink">X</span>
    </span>
  );
}

export function AnnouncementBar() {
  return (
    <div className="bg-amber px-4 py-2 text-center text-[13px] font-semibold text-ink">
      GPU Challenge 2026 · démonstration en ligne sur données synthétiques.{" "}
      <Link href="/connexion?demo=1" className="underline underline-offset-4">
        Ouvrir le tableau de bord
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-paper-line/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5 md:px-8">
        <Link href="/" aria-label={`${BRAND.name}, accueil`} className="rounded-lg">
          <Wordmark />
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {SECTIONS_ACCUEIL.map(({ id, label }) => [`/#${id}`, label]).map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full px-4 py-2 text-[15px] font-semibold text-slate transition-colors hover:bg-paper hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/connexion" className="hidden rounded-full px-4 py-2 text-[15px] font-bold text-ink hover:bg-paper sm:inline-flex">
            Se connecter
          </Link>
          <Link
            href="/connexion?demo=1"
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(30,43,37,0.9)] transition-[background-color,transform] duration-300 hover:bg-blue-deep active:scale-[0.98]"
          >
            Essayer la démo <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="p-3">
      <div className="rounded-[32px] bg-ink px-6 pb-8 pt-16 text-cream md:px-14">
        <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          <div>
            <Wordmark onDark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist">
              {BRAND.meaning} {BRAND.tagline}
            </p>
            <p className="mt-6 max-w-xs text-xs leading-relaxed text-mist/80">
              Équipe {BRAND.team}, GPU Challenge 2026, Epitech Bénin, Cotonou. Projet déposé sous le nom {BRAND.legacyName}. Données de
              démonstration synthétiques, opérateurs fictifs.
            </p>
          </div>
          <FooterCol
            title="Produit"
            links={[
              ["/#fonctionnement", "Comment ça marche"],
              ["/#preuves", "Résultats mesurés"],
              ["/connexion?demo=1", `Assistant ${BRAND.assistant} (dans la démo)`],
              ["/connexion?demo=1", "Démo en ligne"],
            ]}
          />
          <FooterCol
            title="Confiance"
            links={[
              ["/#confidentialite", "Ce qui quitte l'opérateur"],
              ["/confidentialite", "Confidentialité"],
              ["/cgu", "Conditions d'utilisation"],
              ["/mentions-legales", "Mentions légales"],
            ]}
          />
          <div>
            <h3 className="text-sm font-bold text-white">Un pilote de 8 semaines</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">Deux réseaux, vos réclamations anonymisées, tout tourne chez vous.</p>
            <a
              href={`mailto:${BRAND.contact}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-amber"
            >
              Nous écrire <IconArrowRight size={15} />
            </a>
          </div>
        </div>
        <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-ink-line pt-6 text-xs text-mist md:flex-row md:items-center md:justify-between">
          <p>© 2026 {BRAND.name} · {BRAND.team}. Nous recommandons et documentons ; nous ne gelons jamais seuls.</p>
          <p>Conçu à Cotonou pour l&apos;UEMOA.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map(([href, label]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-mist transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
