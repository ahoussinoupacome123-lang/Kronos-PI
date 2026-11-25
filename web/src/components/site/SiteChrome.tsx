import Link from "next/link";
import { LogoMark, IconArrowRight } from "@/components/ui/icons";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]">Réclam&apos;Graph</span>
    </span>
  );
}

export function SiteHeader({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const onInk = tone === "ink";
  return (
    <header className={`relative z-20 ${onInk ? "on-ink text-cream" : "text-ink"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 md:px-10">
        <Link href="/" aria-label="Réclam'Graph, accueil" className="rounded-lg">
          <Wordmark />
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {[
            ["#probleme", "Le problème"],
            ["#fonctionnement", "Fonctionnement"],
            ["#preuves", "Preuves mesurées"],
            ["#confiance", "Confidentialité"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={`/${href}`}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${onInk ? "text-cream/80 hover:bg-white/10 hover:text-cream" : "text-slate hover:bg-paper-3 hover:text-ink"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/connexion"
            className={`hidden rounded-full px-4 py-2 text-sm font-medium sm:inline-flex ${onInk ? "text-cream hover:bg-white/10" : "text-ink hover:bg-paper-3"}`}
          >
            Se connecter
          </Link>
          <Link
            href="/connexion?demo=1"
            className="inline-flex items-center gap-2 rounded-full bg-laterite px-4 py-2 text-sm font-medium text-paper-2 shadow-[0_6px_20px_-8px_rgba(224,100,58,0.8)] transition-[background-color,transform] duration-300 hover:bg-laterite-deep active:scale-[0.98]"
          >
            Ouvrir la démo <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = 2026;
  return (
    <footer className="on-ink bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-20 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-mist">
              Chaque plainte est un capteur. Seule, elle ne dit rien. Croisée entre opérateurs, elle révèle le compte mule
              avant le retrait.
            </p>
            <p className="mt-6 max-w-sm text-xs leading-relaxed text-mist/80">
              Prototype de l&apos;équipe Token Titans, GPU Challenge 2026, Epitech Bénin, Cotonou. Données de démonstration
              entièrement synthétiques, opérateurs fictifs.
            </p>
          </div>
          <FooterCol
            title="Produit"
            links={[
              ["/#fonctionnement", "Fonctionnement"],
              ["/#preuves", "Résultats mesurés"],
              ["/#nexus", "Assistant Nexus"],
              ["/connexion?demo=1", "Démo en ligne"],
            ]}
          />
          <FooterCol
            title="Confiance"
            links={[
              ["/#confiance", "Ce qui quitte l'opérateur"],
              ["/confidentialite", "Politique de confidentialité"],
              ["/cgu", "Conditions d'utilisation"],
              ["/mentions-legales", "Mentions légales"],
            ]}
          />
          <FooterCol
            title="Cadre"
            links={[
              ["/#probleme", "PI-SPI et irrévocabilité"],
              ["/#preuves", "Délais J+3 et J+30"],
              ["/connexion", "Espace établissement"],
            ]}
          />
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-ink-line pt-6 text-xs text-mist md:flex-row md:items-center md:justify-between">
          <p>© {year} Réclam&apos;Graph · Token Titans. Réclam&apos;Graph recommande et documente ; il ne gèle jamais seul.</p>
          <p>Conçu à Cotonou pour l&apos;UEMOA.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-cream">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map(([href, label]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-mist transition-colors hover:text-cream">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
