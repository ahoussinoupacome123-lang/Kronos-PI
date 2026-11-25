"use client";

import Link from "next/link";
import { useDecisions } from "./decisions";

export default function AuditSession() {
  const { decisions, reset } = useDecisions();
  const list = Object.values(decisions).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <section className="rounded-[22px] bg-white shadow-[0_10px_34px_-24px_rgba(11,27,75,0.45)]">
      <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5">
        <h2 className="font-medium">Décisions humaines de cette session</h2>
        {list.length > 0 && (
          <button onClick={reset} className="text-xs text-slate underline hover:text-ink">
            Réinitialiser la démo
          </button>
        )}
      </div>
      <div className="p-5">
        {list.length === 0 ? (
          <p className="text-sm text-slate">
            Aucune décision pour l&apos;instant. Ouvrez une{" "}
            <Link href="/tableau-de-bord/alertes?vue=prioritaires" className="underline">
              alerte prioritaire
            </Link>{" "}
            : votre décision, son motif et votre nom apparaîtront ici.
          </p>
        ) : (
          <ol className="space-y-3">
            {list.map((d) => (
              <li key={d.alertId} className="rounded-xl border border-paper-line p-3 text-sm">
                <p className="flex justify-between gap-3">
                  <Link href={`/tableau-de-bord/alertes/${d.alertId}`} className="font-mono text-ink underline-offset-4 hover:underline">
                    {d.alertId.replace("ALERT-consortium-", "")}
                  </Link>
                  <span className="text-xs text-slate">{new Date(d.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                </p>
                <p className="mt-1 text-ink">
                  {d.verdict === "SUSPENDRE" ? "Suspension recommandée" : "Alerte écartée"} · {d.by}
                </p>
                <p className="mt-0.5 text-slate">« {d.motive} »</p>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-xs text-slate">Prototype : décisions conservées dans ce navigateur. En production, elles rejoignent le journal chaîné côté serveur.</p>
      </div>
    </section>
  );
}
