// Indicateurs dérivés des résultats, partagés par le tableau de bord et l'assistant Nexus.
import { alerts, dossiers, DEMO_NOW, type Dossier } from "./data";

export const now = new Date(DEMO_NOW).getTime();
const H = 3_600_000;

export const priorityAlerts = alerts.filter((a) => a.priority).sort((a, b) => b.score - a.score);
export const toQualifyAlerts = alerts.filter((a) => !a.priority).sort((a, b) => b.score - a.score);

export type Deadline = { dossier: Dossier; kind: "PI-Reclam" | "Remboursement J+3" | "Réponse J+30"; due: number; hoursLeft: number };

export function deadlinesOf(d: Dossier): Deadline[] {
  const list: Deadline[] = [
    { dossier: d, kind: "PI-Reclam", due: new Date(d.timer.pi_reclam_due_at).getTime(), hoursLeft: 0 },
    { dossier: d, kind: "Remboursement J+3", due: new Date(d.timer.refund_due_at).getTime(), hoursLeft: 0 },
    { dossier: d, kind: "Réponse J+30", due: new Date(d.timer.client_answer_due_at).getTime(), hoursLeft: 0 },
  ];
  return list.map((x) => ({ ...x, hoursLeft: (x.due - now) / H }));
}

/** Prochaine échéance encore ouverte d'un dossier, relative à l'heure de démo. */
export function nextDeadline(d: Dossier): Deadline | null {
  return deadlinesOf(d).filter((x) => x.hoursLeft > 0).sort((a, b) => a.due - b.due)[0] ?? null;
}

/** Dossiers ouverts à l'heure de démo, dont une échéance tombe dans les 48 h. */
export const dueSoon = dossiers
  .filter((d) => new Date(d.timer.opened_at).getTime() <= now)
  .map((d) => nextDeadline(d))
  .filter((x): x is Deadline => Boolean(x) && x!.hoursLeft <= 48)
  .sort((a, b) => a.due - b.due);

export const openDossiers = dossiers.filter((d) => new Date(d.timer.opened_at).getTime() <= now);

export function humanHours(h: number) {
  if (h < 0) return `dépassée de ${Math.ceil(-h)} h`;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
  return `${Math.round(h / 24)} jours`;
}
