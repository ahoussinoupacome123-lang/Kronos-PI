"use client";
// Réacteur du consortium : SikaX au centre, chaque réseau branché par un conduit à double rail.
// Les paquets colorés sont des plaintes qui entrent, le paquet lime est l'alerte qui repart.
// Les émetteurs en orbite sont ceux que PI-SPI permettrait de raccorder ensuite.
import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { operatorColor } from "@/lib/data";

export type Station = { op: string; alertes: number };

const r1 = (v: number) => Math.round(v * 10) / 10;
const W = 1000;
const H = 560;
const C = { x: 500, y: 282 };
const ANNEAU = 92;
const POSITIONS = [
  { x: 160, y: 118 },
  { x: 840, y: 118 },
  { x: 500, y: 500 },
];

/** Conduit en coude doux de la station vers le port du réacteur. */
function conduit(s: { x: number; y: number }) {
  const a = Math.atan2(s.y - C.y, s.x - C.x);
  const e = { x: r1(C.x + Math.cos(a) * ANNEAU), y: r1(C.y + Math.sin(a) * ANNEAU) };
  const c1 = { x: r1(s.x + (e.x - s.x) * 0.62), y: s.y };
  const c2 = { x: e.x, y: r1(e.y + (s.y - e.y) * 0.45) };
  return { d: `M${s.x} ${s.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`, e, a };
}

// Émetteurs raccordables : points fixes en orbite, hors des zones des stations.
const ORBITE = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + 0.12;
  return { x: r1(C.x + Math.cos(a) * 430), y: r1(C.y + Math.sin(a) * 232), a };
}).filter((p) => POSITIONS.every((s) => Math.hypot(p.x - s.x, p.y - s.y) > 150));

export default function ConsortiumHub({ stations, className = "" }: { stations: Station[]; className?: string }) {
  const [focus, setFocus] = useState<string | null>(null);
  const bras = stations.slice(0, 3).map((st, i) => ({ ...st, pos: POSITIONS[i], ...conduit(POSITIONS[i]), couleur: operatorColor[st.op] ?? "#888" }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`${BRAND.name} au centre du consortium, relié à ${stations.length} réseaux`}>
      <defs>
        <radialGradient id="hub-halo">
          <stop offset="0" stopColor="var(--color-lime)" stopOpacity=".34" />
          <stop offset=".45" stopColor="var(--color-lime)" stopOpacity=".08" />
          <stop offset="1" stopColor="var(--color-lime)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hub-disque" cx="40%" cy="35%">
          <stop offset="0" stopColor="#3a4d43" />
          <stop offset="1" stopColor="#16211b" />
        </radialGradient>
        <pattern id="hub-trame" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#fff" fillOpacity=".07" />
        </pattern>
        <filter id="hub-lueur" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {bras.map((b) => (
          <linearGradient key={b.op} id={`hub-g-${b.op}`} gradientUnits="userSpaceOnUse" x1={b.pos.x} y1={b.pos.y} x2={b.e.x} y2={b.e.y}>
            <stop offset="0" stopColor={b.couleur} />
            <stop offset="1" stopColor="var(--color-lime)" />
          </linearGradient>
        ))}
      </defs>

      <rect width={W} height={H} fill="url(#hub-trame)" />
      <ellipse cx={C.x} cy={C.y} rx="430" ry="232" fill="none" stroke="#fff" strokeOpacity=".06" />
      <ellipse cx={C.x} cy={C.y} rx="300" ry="160" fill="none" stroke="#fff" strokeOpacity=".05" strokeDasharray="2 10" />

      {/* Émetteurs raccordables : liaisons en attente vers l'orbite intérieure */}
      {ORBITE.map((p, i) => (
        <g key={i} opacity={focus ? 0.35 : 1} style={{ transition: "opacity .4s" }}>
          <line x1={p.x} y1={p.y} x2={r1(C.x + Math.cos(p.a) * 150)} y2={r1(C.y + Math.sin(p.a) * 112)} stroke="#fff" strokeOpacity=".07" strokeDasharray="2 6" />
          <circle cx={p.x} cy={p.y} r="3.2" fill="#fff" fillOpacity=".22" />
          <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#fff" strokeOpacity=".08" />
        </g>
      ))}

      <circle cx={C.x} cy={C.y} r="230" fill="url(#hub-halo)" className="hub-respire" />

      {/* Conduits */}
      {bras.map((b, i) => {
        const terne = focus && focus !== b.op;
        return (
          <g key={b.op} opacity={terne ? 0.25 : 1} style={{ transition: "opacity .4s" }}>
            <path d={b.d} fill="none" stroke={`url(#hub-g-${b.op})`} strokeOpacity=".1" strokeWidth="34" strokeLinecap="round" />
            <path d={b.d} fill="none" stroke={`url(#hub-g-${b.op})`} strokeOpacity=".75" strokeWidth="15" strokeLinecap="round" />
            <path d={b.d} fill="none" stroke="#1a251f" strokeWidth="12" strokeLinecap="round" />
            <path d={b.d} fill="none" stroke={`url(#hub-g-${b.op})`} strokeOpacity=".35" strokeWidth="1" />
            <path d={b.d} fill="none" stroke={`url(#hub-g-${b.op})`} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="46 394" filter="url(#hub-lueur)" className="hub-comete" style={{ animationDelay: `${-i * 0.8}s` }} />
            <g className="hub-paquet">
              {[0, 1, 2].map((k) => (
                <circle key={k} r="3.6" fill={b.couleur} filter="url(#hub-lueur)">
                  <animateMotion dur="3.4s" begin={`${r1(i * 0.7 + k * 1.13)}s`} repeatCount="indefinite" path={b.d} />
                </circle>
              ))}
              <circle r="5" fill="var(--color-lime)" filter="url(#hub-lueur)">
                <animateMotion dur="5.1s" begin={`${r1(1.6 + i * 1.4)}s`} repeatCount="indefinite" path={b.d} keyPoints="1;0;0" keyTimes="0;0.42;1" calcMode="spline" keySplines="0.3 0 0.2 1;0 0 1 1" />
              </circle>
            </g>
            {/* Port sur l'anneau */}
            <g transform={`translate(${b.e.x} ${b.e.y}) rotate(${r1((b.a * 180) / Math.PI)})`}>
              <rect x="-4" y="-9" width="14" height="18" rx="4" fill="#1a251f" stroke="var(--color-lime)" strokeOpacity=".8" />
              <rect x="1" y="-3" width="5" height="6" rx="1.5" fill="var(--color-lime)" />
            </g>
          </g>
        );
      })}

      {/* Réacteur */}
      <circle cx={C.x} cy={C.y} r="140" fill="none" stroke="#fff" strokeOpacity=".1" strokeDasharray="1 9" strokeWidth="6" className="hub-tourne" />
      <circle cx={C.x} cy={C.y} r="118" fill="none" stroke="var(--color-lime)" strokeOpacity=".22" strokeDasharray="60 22 6 22" className="hub-tourne-inverse" />
      <circle cx={C.x} cy={C.y} r={ANNEAU} fill="#141d18" stroke="var(--color-lime)" strokeOpacity=".55" strokeWidth="1.5" />
      <circle cx={C.x} cy={C.y} r={ANNEAU - 9} fill="none" stroke="var(--color-lime)" strokeOpacity=".35" strokeWidth="7" strokeDasharray="1.5 6" className="hub-tourne" />
      <circle cx={C.x} cy={C.y} r="66" fill="url(#hub-disque)" stroke="#fff" strokeOpacity=".12" />
      <circle cx={C.x} cy={C.y} r="66" fill="none" stroke="var(--color-lime)" strokeWidth="2" strokeDasharray="70 345" strokeLinecap="round" className="hub-tourne-inverse" />
      <text x={C.x} y={C.y + 6} textAnchor="middle" fontSize="27" fontWeight="700" fill="#fff" style={{ fontFamily: "var(--font-titre)", letterSpacing: "-0.03em" }}>
        {BRAND.name.replace(/X$/, "")}
        <tspan fill="var(--color-lime)">{BRAND.name.endsWith("X") ? "X" : ""}</tspan>
      </text>
      <text x={C.x} y={C.y + 26} textAnchor="middle" fontSize="9.5" fill="var(--color-lime)" fillOpacity=".8" style={{ fontFamily: "var(--font-donnee)", letterSpacing: "0.22em" }}>
        CONSORTIUM
      </text>

      {/* Stations des réseaux */}
      {bras.map((b) => {
        const w = 248;
        const x = b.pos.x - w / 2;
        const y = b.pos.y - 38;
        const actif = focus === b.op;
        return (
          <Link key={b.op} href="/tableau-de-bord/alertes" aria-label={`${b.op} : ${b.alertes} alertes croisées`}>
            <g onMouseEnter={() => setFocus(b.op)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(b.op)} onBlur={() => setFocus(null)} style={{ cursor: "pointer" }}>
              <rect x={x - 6} y={y - 6} width={w + 12} height="88" rx="26" fill={b.couleur} fillOpacity={actif ? 0.18 : 0.07} style={{ transition: "fill-opacity .35s" }} />
              <rect x={x} y={y} width={w} height="76" rx="21" fill="#202d26" stroke={b.couleur} strokeOpacity={actif ? 0.9 : 0.45} style={{ transition: "stroke-opacity .35s" }} />
              <circle cx={x + 26} cy={y + 38} r="14" fill={b.couleur} fillOpacity=".16" className="hub-respire" />
              <circle cx={x + 26} cy={y + 38} r="6" fill={b.couleur} />
              <text x={x + 52} y={y + 33} fontSize="15" fontWeight="600" fill="#fff" style={{ fontFamily: "var(--font-donnee)", letterSpacing: "0.1em" }}>
                {b.op}
              </text>
              <text x={x + 52} y={y + 54} fontSize="14" fill="#fff" fillOpacity=".55" style={{ fontFamily: "var(--font-texte)" }}>
                {b.alertes} alertes croisées
              </text>
            </g>
          </Link>
        );
      })}
    </svg>
  );
}
