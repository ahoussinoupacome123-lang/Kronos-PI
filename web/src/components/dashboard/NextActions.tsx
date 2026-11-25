"use client";

import Link from "next/link";
import { useDecisions } from "./decisions";
import { IconArrowRight, IconCheck } from "@/components/ui/icons";

export type ActionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
  tone: "laterite" | "amber" | "indigo" | "sage";
  /** Alertes dont la décision clôt cette action. */
  alertIds?: string[];
};

const toneDot = { laterite: "bg-laterite", amber: "bg-amber", indigo: "bg-indigo", sage: "bg-sage" };

export default function NextActions({ items }: { items: ActionItem[] }) {
  const { decisions } = useDecisions();
  const enriched = items.map((it) => {
    const ids = it.alertIds ?? [];
    const done = ids.length > 0 && ids.every((id) => decisions[id]);
    const left = ids.filter((id) => !decisions[id]).length;
    return { ...it, done, left };
  });
  const remaining = enriched.filter((x) => !x.done).length;

  return (
    <section aria-labelledby="next-title" className="carte rounded-[26px] bg-blanc ring-1 ring-encre/[0.06] shadow-[0_1px_2px_rgba(15,23,18,.04),0_24px_48px_-32px_rgba(15,23,18,.35)]">
      <div className="flex items-center justify-between px-6 pb-2 pt-5">
        <h2 id="next-title" className="flex items-center gap-2.5 font-titre text-[16px] font-bold text-encre">
          <span aria-hidden className="h-4 w-1.5 rounded-full bg-lime" />
          À faire maintenant, dans cet ordre
        </h2>
        <span className="text-sm text-slate">{remaining === 0 ? "Tout est traité" : `${remaining} restante${remaining > 1 ? "s" : ""}`}</span>
      </div>
      <ol className="space-y-2 px-3 pb-3">
        {enriched.map((it, i) => (
          <li key={it.id} className={`flex flex-wrap items-center gap-4 rounded-[20px] px-3 py-3.5 transition-colors hover:bg-brume ${it.done ? "opacity-60" : ""}`}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm ${
                it.done ? "bg-lime text-encre" : "bg-encre font-donnee text-lime"
              }`}
            >
              {it.done ? <IconCheck size={16} /> : i + 1}
            </span>
            <div className="min-w-[14rem] flex-1">
              <p className="flex items-center gap-2 font-medium text-ink">
                <span aria-hidden className={`h-2 w-2 rounded-full ${toneDot[it.tone]}`} />
                {it.title}
                {it.alertIds && !it.done && it.left !== it.alertIds.length && (
                  <span className="text-xs font-normal text-slate">({it.left} restante{it.left > 1 ? "s" : ""})</span>
                )}
              </p>
              <p className="mt-0.5 text-sm text-slate">{it.detail}</p>
            </div>
            <Link
              href={it.href}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                i === 0 && !it.done ? "bg-encre text-lime hover:bg-nuit" : "bg-brume text-encre hover:bg-lime"
              }`}
            >
              {it.done ? "Revoir" : it.cta} <IconArrowRight size={15} />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
