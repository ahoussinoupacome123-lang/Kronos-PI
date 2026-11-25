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
    <section aria-labelledby="next-title" className="rounded-[22px] bg-white shadow-[0_10px_34px_-24px_rgba(11,27,75,0.45)]">
      <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5">
        <h2 id="next-title" className="font-medium">
          À faire maintenant, dans cet ordre
        </h2>
        <span className="text-sm text-slate">{remaining === 0 ? "Tout est traité" : `${remaining} restante${remaining > 1 ? "s" : ""}`}</span>
      </div>
      <ol className="divide-y divide-paper-line">
        {enriched.map((it, i) => (
          <li key={it.id} className={`flex flex-wrap items-center gap-4 px-5 py-4 ${it.done ? "opacity-60" : ""}`}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm ${
                it.done ? "bg-sage/25 text-sage-deep" : "bg-ink text-cream"
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
                i === 0 && !it.done ? "bg-laterite text-paper-2 hover:bg-laterite-deep" : "border border-paper-line text-ink hover:border-ink"
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
