"use client";

import { useEffect, useMemo, useState } from "react";
import type { Graph } from "@/lib/data";

// Arrondi : évite un écart de rendu serveur/client sur les flottants.
const r1 = (v: number) => Math.round(v * 10) / 10;
const COL: Record<string, string> = { ALPHAMONEY: "#7d8cff", BETACASH: "#7cc4a4", GAMMAPAY: "#e8b04b" };

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
      return [op, { x: r1(cx + Math.cos(a) * 225), y: r1(cy + Math.sin(a) * 100) }];
    }),
  );
  const complainants = graph.nodes.filter((n) => n.kind === "plaignant");
  const perOp: Record<string, number> = {};
  const cPos = Object.fromEntries(
    complainants.map((n) => {
      const op = n.operator ?? ops[0];
      const k = (perOp[op] = (perOp[op] ?? 0) + 1) - 1;
      const base = opPos[op] ?? { x: cx, y: cy };
      const ang = Math.atan2(cy - base.y, cx - base.x) + (k - 1) * 0.55;
      return [n.id, { x: r1(base.x + Math.cos(ang) * 62), y: r1(base.y + Math.sin(ang) * 62) }];
    }),
  );
  const shown = edges.slice(0, step);
  const nC = new Set(shown.map((e) => e.source)).size;
  const nO = new Set(shown.map((e) => e.operator)).size;
  const fired = nC >= minComplainants && nO >= minOperators;
  const center = graph.nodes.find((n) => n.kind === "beneficiaire");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-ink" role="img" aria-label={`Graphe de l'alerte : ${nC} plaignants sur ${nO} réseaux`}>
        <defs>
          <radialGradient id="ag-core">
            <stop offset="0" stopColor="#e0643a" stopOpacity=".7" />
            <stop offset="1" stopColor="#e0643a" stopOpacity="0" />
          </radialGradient>
        </defs>
        {ops.map((op) => (
          <g key={op}>
            <circle cx={opPos[op].x} cy={opPos[op].y} r="86" fill={COL[op] ?? "#888"} fillOpacity=".06" stroke={COL[op] ?? "#888"} strokeOpacity=".3" strokeDasharray="2 6" />
            <text x={opPos[op].x} y={opPos[op].y - 70} textAnchor="middle" fontSize="11" fill={COL[op]} style={{ fontFamily: "var(--font-plex-mono)", letterSpacing: "0.08em" }}>
              {op}
            </text>
          </g>
        ))}
        {edges.map((e, i) => {
          const p = cPos[e.source];
          if (!p) return null;
          const visible = i < step;
          return (
            <line
              key={i}
              x1={p.x}
              y1={p.y}
              x2={cx}
              y2={cy}
              stroke={COL[e.operator ?? ""] ?? "#ccc"}
              strokeWidth="1.6"
              strokeDasharray={e.after_alert ? "4 5" : undefined}
              style={{ opacity: visible ? 0.9 : 0, transition: "opacity 500ms" }}
            />
          );
        })}
        {complainants.map((n) => {
          const p = cPos[n.id];
          const on = shown.some((e) => e.source === n.id);
          return (
            <g key={n.id} style={{ opacity: on ? 1 : 0.25, transition: "opacity 500ms" }}>
              <circle cx={p.x} cy={p.y} r="11" fill={COL[n.operator ?? ""] ?? "#888"} fillOpacity=".2" />
              <circle cx={p.x} cy={p.y} r="5.5" fill={COL[n.operator ?? ""] ?? "#888"} />
            </g>
          );
        })}
        {fired && <circle cx={cx} cy={cy} r="62" fill="url(#ag-core)" />}
        <circle cx={cx} cy={cy} r={fired ? 15 : 10} fill={fired ? "#e0643a" : "#ece5d6"} style={{ transition: "all 500ms" }} />
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize="11.5" fill="#ece5d6" style={{ fontFamily: "var(--font-plex-mono)" }}>
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
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-ink-3"
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
            className="flex-1 accent-[#e0643a]"
          />
        </label>
        <p className="font-mono text-sm tabular-nums text-ink" aria-live="polite">
          {nC} plaignant{nC > 1 ? "s" : ""} · {nO} réseau{nO > 1 ? "x" : ""}{" "}
          <span className={fired ? "text-laterite-deep" : "text-slate"}>{fired ? "· seuil franchi" : `· seuil ${minComplainants} · ${minOperators}`}</span>
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
