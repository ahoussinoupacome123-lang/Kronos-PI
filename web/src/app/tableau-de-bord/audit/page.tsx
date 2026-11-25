import AuditSession from "@/components/dashboard/AuditSession";
import { PageHead, Panel } from "@/components/dashboard/ui";
import { audit, num } from "@/lib/data";

export const metadata = { title: "Piste d'audit" };

const actionLabel: Record<string, string> = {
  ALERTE_MULE_RECOMMANDEE: "Alertes « mule probable » recommandées",
  DOSSIER_CONSTRUIT: "Dossiers de litige construits",
  EXECUTION_PIPELINE: "Exécutions du pipeline",
};

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHead objet="cle" title="Piste d'audit" lead={audit.base_reglementaire} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Journal du pipeline" aside={<span className={`text-xs ${audit.chaine_integre ? "text-sage-deep" : "text-laterite-deep"}`}>{audit.chaine_integre ? "Chaîne intègre" : "Chaîne altérée"}</span>}>
          <ul className="divide-y divide-paper-line text-sm">
            {Object.entries(audit.par_action).map(([k, v]) => (
              <li key={k} className="flex justify-between py-2.5">
                <span className="text-ink">{actionLabel[k] ?? k}</span>
                <span className="font-mono tabular-nums">{num(v)}</span>
              </li>
            ))}
            <li className="flex justify-between py-2.5">
              <span className="text-ink">Entrées en attente d&apos;un validateur humain</span>
              <span className="font-mono tabular-nums">{num(audit.entrees_en_attente_de_validation)}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate">Portée du chaînage : {audit.portee_du_chainage}</p>
        </Panel>
        <AuditSession />
      </div>
    </div>
  );
}
