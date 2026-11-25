"use client";

import { useEffect, useMemo, useState } from "react";
import type { Graph } from "@/lib/data";

// Arrondi : évite un écart de rendu serveur/client sur les flottants.
const r1 = (v: number) => Math.round(v * 10) / 10;
const COL: Record<string, string> = { ALPHAMONEY: "var(--color-reseau-a)", BETACASH: "var(--color-reseau-b)", GAMMAPAY: "var(--color-reseau-c)" };

/** Graphe d'une alerte, rejouable plainte par plainte : on voit le seuil 3 · 2 se franchir. */
export default function AlertGraph({ graph, minComplainants = 3, minOperators = 2 }: { graph: Graph; minComplainants?: number; minOperators?: number }) {
  const edges = useMemo(() => [...graph.edges].filter((e) => e.ts).sort((a, b) => a.ts!.localeCompare(b.ts!)), [graph]);
  const [step, setStep] = useState(edges.length);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (step >= edges.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fin de lecture
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [playing, step, edges.length]);

  const W = 620;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const ops = Array.from(new Set(graph.nodes.filter((n) => n.kind === "operateur").map((n) => n.id)));
  const opPos = Object.fromEntries(
    ops.map((op, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(ops.length, 1) + Math.PI / 6;
      return [op, { x: r1(cx + Math.cos(a) * 205), y: r1(cy + Math.sin(a) * 112) }];
    }),
  );
  const complainants = graph.nodes.filter((n) => n.kind === "plaignant");
  // Plaignants répartis en éventail autour de leur réseau, côté extérieur, pour dégager les conduits.
  const parOp: Record<string, string[]> = {};
  complainants.forEach((n) => (parOp[n.operator ?? ops[0]] ??= []).push(n.id));
  const cPos = Object.fromEntries(
    Object.entries(parOp).flatMap(([op, ids]) => {
      const base = opPos[op] ?? { x: cx, y: cy };
      const dehors = Math.atan2(base.y - cy, base.x - cx);
      return ids.map((id, k) => {
        const ang = dehors + (k - (ids.length - 1) / 2) * 0.62;
        return [id, { x: r1(base.x + Math.cos(ang) * 46), y: r1(base.y + Math.sin(ang) * 46) }];
      });
    }),
  );
  const shown = edges.slice(0, step);
  const nC = new Set(shown.map((e) => e.source)).size;
  const nO = new Set(shown.map((e) => e.operator)).size;
  const fired = nC >= minComplainants && nO >= minOperators;
  const center = graph.nodes.find((n) => n.kind === "beneficiaire");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-[22px] bg-nuit" role="img" aria-label={`Graphe de l'alerte : ${nC} plaignants sur ${nO} réseaux`}>
        <defs>
          <radialGradient id="ag-core">
            <stop offset="0" stopColor={fired ? "var(--color-alerte)" : "var(--color-lime)"} stopOpacity=".45" />
            <stop offset="1" stopColor={fired ? "var(--color-alerte)" : "var(--color-lime)"} stopOpacity="0" />
          </radialGradient>
          <pattern id="ag-trame" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#fff" fillOpacity=".07" />
          </pattern>
          <filter id="ag-lueur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.6" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#ag-trame)" />
        {ops.map((op) => (
          <g key={op}>
            <circle cx={opPos[op].x} cy={opPos[op].y} r="74" fill={COL[op] ?? "#888"} fillOpacity=".06" />
            <circle cx={opPos[op].x} cy={opPos[op].y} r="66" fill="none" stroke={COL[op] ?? "#888"} strokeOpacity=".28" strokeDasharray="1 7" strokeWidth="4" className="hub-tourne" />
            <rect x={opPos[op].x + (opPos[op].x > cx ? 58 : -52)} y={opPos[op].y + (opPos[op].x > cx ? -11 : 62)} width="104" height="22" rx="11" fill="#202d26" stroke={COL[op] ?? "#888"} strokeOpacity=".5" />
            <text x={opPos[op].x + (opPos[op].x > cx ? 110 : 0)} y={opPos[op].y + (opPos[op].x > cx ? 4 : 77)} textAnchor="middle" fontSize="10.5" fill="#fff" style={{ fontFamily: "var(--font-donnee)", letterSpacing: "0.1em" }}>
              {op}
            </text>
          </g>
        ))}
        {edges.map((e, i) => {
          const p = cPos[e.source];
          if (!p) return null;
          const visible = i < step;
          const mx = (p.x + cx) / 2;
          const my = (p.y + cy) / 2;
          const k = 0.18 * (i % 2 ? 1 : -1);
          const d = `M${p.x} ${p.y} Q${r1(mx - (cy - p.y) * k)} ${r1(my + (cx - p.x) * k)} ${cx} ${cy}`;
          const col = COL[e.operator ?? ""] ?? "#ccc";
          return (
            <g key={i} style={{ opacity: visible ? 1 : 0, transition: "opacity 600ms" }}>
              <path d={d} fill="none" stroke={col} strokeOpacity={e.after_alert ? 0.3 : 0.6} strokeWidth="7" strokeLinecap="round" />
              <path d={d} fill="none" stroke="#1e2b25" strokeWidth="4.6" strokeLinecap="round" />
              <path d={d} fill="none" stroke={col} strokeWidth="1.2" strokeDasharray={e.after_alert ? "3 6" : "8 18"} className={e.after_alert ? undefined : "hub-flux"} />
              {visible && !e.after_alert && (
                <circle r="3" fill={col} filter="url(#ag-lueur)" className="hub-paquet">
                  <animateMotion dur="2.6s" begin={`${r1((i % 5) * 0.5)}s`} repeatCount="indefinite" path={d} />
                </circle>
              )}
            </g>
          );
        })}
        {complainants.map((n) => {
          const p = cPos[n.id];
          const on = shown.some((e) => e.source === n.id);
          const col = COL[n.operator ?? ""] ?? "#888";
          return (
            <g key={n.id} style={{ opacity: on ? 1 : 0.22, transition: "opacity 500ms" }}>
              <circle cx={p.x} cy={p.y} r="13" fill={col} fillOpacity=".14" />
              <circle cx={p.x} cy={p.y} r="7" fill="#202d26" stroke={col} strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="2.6" fill={col} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="74" fill="url(#ag-core)" className="hub-respire" />
        <circle cx={cx} cy={cy} r="40" fill="none" stroke={fired ? "var(--color-alerte)" : "var(--color-lime)"} strokeOpacity=".5" strokeWidth="5" strokeDasharray="1.5 6" className="hub-tourne" />
        <circle cx={cx} cy={cy} r="28" fill="#141d18" stroke={fired ? "var(--color-alerte)" : "var(--color-lime)"} strokeWidth="1.6" style={{ transition: "stroke 500ms" }} />
        <circle cx={cx} cy={cy} r={fired ? 11 : 7} fill={fired ? "var(--color-alerte)" : "var(--color-lime)"} style={{ transition: "all 500ms" }} />
        <rect x={cx - 62} y={cy + 40} width="124" height="22" rx="11" fill="#202d26" />
        <text x={cx} y={cy + 55} textAnchor="middle" fontSize="11" fill="#fff" fillOpacity=".85" style={{ fontFamily: "var(--font-donnee)" }}>
          {center?.id.slice(0, 12)}…
        </text>
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (step >= edges.length) setStep(0);
            setPlaying((p) => !p);
          }}
          className="rounded-full bg-encre px-5 py-2.5 text-sm font-semibold text-lime transition-transform hover:scale-[1.03]"
        >
          {playing ? "Pause" : step >= edges.length ? "Rejouer la convergence" : "Lire"}
        </button>
        <label className="flex flex-1 items-center gap-3 text-sm text-slate">
          <span className="sr-only">Nombre de plaintes affichées</span>
          <input
            type="range"
            min={0}
            max={edges.length}
            value={step}
            onChange={(e) => {
              setPlaying(false);
              setStep(Number(e.target.value));
            }}
            className="flex-1 accent-lime-vif"
          />
        </label>
        <p className="font-donnee text-sm tabular-nums text-encre" aria-live="polite">
          {nC} plaignant{nC > 1 ? "s" : ""} · {nO} réseau{nO > 1 ? "x" : ""}{" "}
          <span className={fired ? "font-semibold text-alerte" : "text-gris"}>{fired ? "· seuil franchi" : `· seuil ${minComplainants} · ${minOperators}`}</span>
        </p>
      </div>
      {step > 0 && step <= edges.length && edges[step - 1]?.ts && (
        <p className="mt-2 text-xs text-slate">
          Dernière plainte affichée : {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" }).format(new Date(edges[step - 1].ts!))}, réseau{" "}
          {edges[step - 1].operator}, montant arrondi {new Intl.NumberFormat("fr-FR").format(edges[step - 1].amount_rounded_fcfa ?? 0)} FCFA. Les traits pointillés arrivent après l&apos;alerte.
        </p>
      )}
    </div>
  );
}
