import { redirect } from "next/navigation";
import Sidebar, { MobileNav } from "@/components/dashboard/Sidebar";
import { DecisionsProvider } from "@/components/dashboard/decisions";
import Nexus from "@/components/nexus/Nexus";
import { readSession } from "@/lib/auth";
import { dueSoon, priorityAlerts } from "@/lib/derive";
import { dayHhmm, DEMO_NOW, engineTruth } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/connexion");

  return (
    <DecisionsProvider>
      <div className="flex min-h-dvh bg-paper">
        <Sidebar user={session} pendingPriority={priorityAlerts.map((a) => a.id)} dueSoon={dueSoon.length} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber/30 bg-amber/10 px-6 py-2 text-[13px] text-amber-deep">
            <span>
              <strong className="font-semibold">Mode démonstration.</strong> Données synthétiques, opérateurs fictifs. Horloge
              figée au {dayHhmm(DEMO_NOW)}.
            </span>
            {!engineTruth.usedLlm && <span>Extraction : moteur local de repli (LLM non mesuré dans ce run).</span>}
          </div>
          <MobileNav />
          <main className="flex-1 px-5 py-8 md:px-10">{children}</main>
        </div>
      </div>
      <Nexus userName={session.name.split(" ")[0]} />
    </DecisionsProvider>
  );
}

// Page dépendante de la session ou de l'URL : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
