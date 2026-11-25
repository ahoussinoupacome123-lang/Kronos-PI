"use client";

import { useMemo, useState } from "react";
import type { Dossier } from "@/lib/data";
import { IconClose, IconFile } from "@/components/ui/icons";
import { Pill } from "./ui";

type Row = { d: Dossier; next: { kind: string; hoursLeft: number } | null; opened: boolean };

const decisionTone = { GELER: "laterite", REMBOURSER: "sage", A_INSTRUIRE: "slate" } as const;
const decisionText = { GELER: "Mule probable", REMBOURSER: "Rembourser", A_INSTRUIRE: "À instruire" };

function humanHours(h: number) {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.floor(h)} h`;
  return `${Math.round(h / 24)} j`;
}
const fcfa = (n: number | null) => (n == null ? "—" : `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`);
const when = (iso: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" }).format(new Date(iso));

export default function DossiersBoard({ rows, labels, initialSort }: { rows: Row[]; labels: Record<string, string>; initialSort: string }) {
  const [filter, setFilter] = useState<"TOUS" | "GELER" | "REMBOURSER" | "A_INSTRUIRE">("TOUS");
  const [sort, setSort] = useState(initialSort === "echeance" ? "echeance" : "montant");
  const [selected, setSelected] = useState<Row | null>(null);
  const [showIso, setShowIso] = useState(false);

  const list = useMemo(() => {
    const l = rows.filter((r) => r.opened && (filter === "TOUS" || r.d.decision === filter));
    return l.sort((a, b) =>
      sort === "echeance" ? (a.next?.hoursLeft ?? 1e9) - (b.next?.hoursLeft ?? 1e9) : (b.d.amountFcfa ?? 0) - (a.d.amountFcfa ?? 0),
    );
  }, [rows, filter, sort]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_24rem]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par décision">
            {(["TOUS", "GELER", "REMBOURSER", "A_INSTRUIRE"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={filter === k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-4 py-2 text-sm ${filter === k ? "bg-ink text-cream" : "border border-paper-line text-ink hover:border-ink"}`}
              >
                {k === "TOUS" ? "Tous" : decisionText[k]}
                <span className="ml-1 font-mono text-xs opacity-70">{rows.filter((r) => r.opened && (k === "TOUS" || r.d.decision === k)).length}</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate">
            Trier par
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-paper-line bg-paper-2 px-2 py-1.5 text-ink">
              <option value="echeance">échéance la plus proche</option>
              <option value="montant">montant</option>
            </select>
          </label>
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-paper-line p-10 text-center text-slate">Aucun dossier ouvert dans cette vue à l&apos;heure de la démo.</p>
        ) : (
          <ul className="overflow-hidden rounded-[22px] bg-white shadow-[0_10px_34px_-24px_rgba(30,43,37,0.45)]">
            {list.map((r) => {
              const urgent = r.next && r.next.hoursLeft <= 24;
              const isSel = selected?.d.id === r.d.id;
              return (
                <li key={r.d.id} className="border-b border-paper-line last:border-b-0">
                  <button
                    onClick={() => {
                      setSelected(r);
                      setShowIso(false);
                    }}
                    aria-pressed={isSel}
                    className={`flex w-full flex-wrap items-center gap-4 px-5 py-3.5 text-left transition-colors ${isSel ? "bg-paper-3/70" : "hover:bg-paper-3/40"}`}
                  >
                    <IconFile size={18} className="shrink-0 text-slate" />
                    <span className="min-w-[10rem] flex-1">
                      <span className="block font-mono text-sm text-ink">{r.d.id}</span>
                      <span className="block truncate text-xs text-slate">
                        {r.d.operator} → {r.d.destination ?? "?"} · {labels[r.d.typology] ?? r.d.typology}
                      </span>
                    </span>
                    <span className="font-mono text-sm tabular-nums text-ink">{fcfa(r.d.amountFcfa)}</span>
                    <Pill tone={decisionTone[r.d.decision]}>{decisionText[r.d.decision]}</Pill>
                    <span className={`w-36 text-right text-xs ${urgent ? "font-medium text-laterite-deep" : "text-slate"}`}>
                      {r.next ? `${r.next.kind} dans ${humanHours(r.next.hoursLeft)}` : "échéances passées"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        {!selected ? (
          <div className="rounded-2xl border border-dashed border-paper-line p-8 text-center text-sm text-slate">
            Sélectionnez un dossier pour voir la plainte, ce qui en a été extrait, et ses échéances.
          </div>
        ) : (
          <div className="rounded-[22px] bg-white shadow-[0_10px_34px_-24px_rgba(30,43,37,0.45)]">
            <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5">
              <p className="font-mono text-sm">{selected.d.id}</p>
              <button onClick={() => setSelected(null)} aria-label="Fermer le dossier" className="rounded-full p-1.5 text-slate hover:bg-paper-3 hover:text-ink">
                <IconClose size={16} />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <p className="text-xs text-slate">
                  Plainte reçue par {selected.d.channel.toLowerCase()} · {when(selected.d.receivedAt)}
                </p>
                <p className="mt-1.5 rounded-xl bg-paper-3/60 p-3 font-mono text-[13px] leading-relaxed text-ink">« {selected.d.text} »</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Typologie", labels[selected.d.typology] ?? selected.d.typology],
                  ["Montant", fcfa(selected.d.amountFcfa)],
                  ["Bénéficiaire", selected.d.beneficiary ?? "non cité"],
                  ["Réseau destinataire", selected.d.destination ?? "non cité"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate">{k}</dt>
                    <dd className="mt-0.5 break-words text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              {selected.d.motivation && <p className="text-sm text-ink">{selected.d.motivation}</p>}
              <div>
                <p className="text-sm font-medium text-ink">Échéances</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {[
                    ["PI-Reclam (paramètre)", selected.d.timer.pi_reclam_due_at],
                    ["Remboursement, J+3 ouvrés", selected.d.timer.refund_due_at],
                    ["Réponse au client, J+30", selected.d.timer.client_answer_due_at],
                  ].map(([k, v]) => (
                    <li key={k} className="flex justify-between gap-3">
                      <span className="text-slate">{k}</span>
                      <span className="font-mono tabular-nums text-ink">{when(v)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-slate">{selected.d.timer.notes}</p>
              </div>
              <div>
                <button onClick={() => setShowIso((s) => !s)} className="text-sm font-medium text-indigo-deep underline underline-offset-4" aria-expanded={showIso}>
                  {showIso ? "Masquer" : "Voir"} la demande d&apos;annulation pré-remplie
                </button>
                {showIso && (
                  <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-ink p-3 font-mono text-[11px] leading-relaxed text-cream/90">
                    {JSON.stringify(selected.d.iso, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
