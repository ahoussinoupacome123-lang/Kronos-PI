import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar, { MobileNav } from "@/components/dashboard/Sidebar";
import { DecisionsProvider } from "@/components/dashboard/decisions";
import Nexus from "@/components/nexus/Nexus";
import { Wordmark } from "@/components/site/SiteChrome";
import { readSession } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { dueSoon, priorityAlerts } from "@/lib/derive";
import { dayHhmm, DEMO_NOW, engineTruth } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/connexion");
  const initials = session.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DecisionsProvider>
      <div className="min-h-dvh bg-sol p-2.5 font-texte text-encre md:p-4">
        <header className="z-30 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-blanc/80 px-4 py-3 ring-1 ring-encre/[0.06] backdrop-blur-xl shadow-[0_18px_40px_-30px_rgba(15,23,18,.45)] md:sticky md:top-4 md:px-6">
          <Link href="/" aria-label={`${BRAND.name}, accueil`} className="rounded-lg">
            <Wordmark />
          </Link>
          <p className="order-3 flex w-full items-center justify-center gap-2 rounded-full bg-brume px-4 py-1.5 text-center text-[12.5px] font-medium text-encre-2 md:order-none md:w-auto">
            <span aria-hidden className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-lime-vif opacity-70 motion-reduce:hidden" /><span className="relative h-2 w-2 rounded-full bg-lime-vif" /></span>
            Démo · données synthétiques · horloge figée au {dayHhmm(DEMO_NOW)}
            {!engineTruth.usedLlm && " · extraction par le moteur de repli"}
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-semibold text-encre">{session.name}</span>
              <span className="block text-xs text-gris">{session.org}</span>
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-lime font-titre text-sm font-bold text-encre ring-4 ring-lime/25" aria-hidden>
              {initials}
            </span>
          </div>
        </header>
        <MobileNav />
        <div className="mt-3 flex gap-4 md:mt-4">
          <Sidebar user={session} pendingPriority={priorityAlerts.map((a) => a.id)} dueSoon={dueSoon.length} />
          <main className="min-w-0 flex-1 pb-24">{children}</main>
        </div>
      </div>
      <Nexus userName={session.name.split(" ")[0]} />
    </DecisionsProvider>
  );
}

// Page dépendante de la session : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
