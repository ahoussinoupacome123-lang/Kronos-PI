import DossiersBoard from "@/components/dashboard/DossiersBoard";
import { PageHead } from "@/components/dashboard/ui";
import { dossierSummary, dossiers, num, typologyLabel } from "@/lib/data";
import { nextDeadline, now } from "@/lib/derive";

export const metadata = { title: "Dossiers et délais" };

export default async function DossiersPage({ searchParams }: { searchParams: Promise<{ tri?: string }> }) {
  const { tri = "echeance" } = await searchParams;
  const rows = dossiers.map((d) => {
    const n = nextDeadline(d);
    return { d, next: n ? { kind: n.kind, hoursLeft: n.hoursLeft } : null, opened: new Date(d.timer.opened_at).getTime() <= now };
  });
  return (
    <div className="mx-auto max-w-7xl">
      <PageHead
        title="Dossiers de litige et délais"
        lead={
          <>
            Chaque plainte devient un dossier pré-rempli, avec ses échéances réglementaires. Le pipeline en a construit{" "}
            {num(dossierSummary.n_dossiers)} ; les {num(dossiers.length)} plus parlants sont chargés ici.
          </>
        }
      />
      <DossiersBoard rows={rows} labels={typologyLabel} initialSort={tri} />
    </div>
  );
}

// Page dépendante de la session ou de l'URL : rendu à la demande, hors validation de navigation instantanée.
export const instant = false;
