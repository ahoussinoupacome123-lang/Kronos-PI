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
      <div className="min-h-dvh bg-paper p-2.5 md:p-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-white px-4 py-3 shadow-[0_8px_30px_-22px_rgba(30,43,37,0.5)] md:px-6">
          <Link href="/" aria-label={`${BRAND.name}, accueil`} className="rounded-lg">
            <Wordmark />
          </Link>
          <p className="order-3 w-full rounded-full bg-amber/25 px-4 py-1.5 text-center text-[12.5px] font-semibold text-amber-deep md:order-none md:w-auto">
            Démo · données synthétiques · horloge figée au {dayHhmm(DEMO_NOW)}
            {!engineTruth.usedLlm && " · extraction par le moteur de repli"}
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-bold text-ink">{session.name}</span>
              <span className="block text-xs text-slate">{session.org}</span>
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blue font-display text-sm font-bold text-white" aria-hidden>
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
