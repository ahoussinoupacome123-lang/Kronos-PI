import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";

/** Logo : trois réseaux qui se croisent en X sur le compte mule. */
export function BrandMark({ size = 34, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="12" fill={onDark ? "#ffffff" : "#2347e8"} />
      <path d="M11 11 29 29M29 11 11 29" stroke={onDark ? "#2347e8" : "#ffffff"} strokeWidth="4.2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="4.6" fill="#ffc531" stroke={onDark ? "#ffffff" : "#2347e8"} strokeWidth="2" />
    </svg>
  );
}

export function Wordmark({ onDark = false, className = "" }: { onDark?: boolean; className?: string }) {
  const [a, b] = [BRAND.name.replace(/X$/, ""), BRAND.name.endsWith("X") ? "X" : ""];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark onDark={onDark} />
      <span className={`font-display text-[1.35rem] font-bold tracking-[-0.03em] ${onDark ? "text-white" : "text-ink"}`}>
        {a}
        {b && <span className={onDark ? "text-amber" : "text-blue"}>{b}</span>}
      </span>
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
          {[
            ["/#calcul", "Le calcul"],
            ["/#fonctions", "Ce que fait " + BRAND.name],
            ["/#preuves", "Preuves"],
            ["/#faq", "Questions"],
          ].map(([href, label]) => (
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
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(35,71,232,0.9)] transition-[background-color,transform] duration-300 hover:bg-blue-deep active:scale-[0.98]"
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
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
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
              ["/#fonctions", "Fonctionnalités"],
              ["/#preuves", "Résultats mesurés"],
              ["/#nexus", `Assistant ${BRAND.assistant}`],
              ["/connexion?demo=1", "Démo en ligne"],
            ]}
          />
          <FooterCol
            title="Confiance"
            links={[
              ["/#confiance", "Ce qui quitte l'opérateur"],
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
