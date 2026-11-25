// Briques visuelles du tableau de bord (serveur ou client).
export function PageHead({ title, lead, children }: { title: string; lead?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-slate">{lead}</p>}
      </div>
      {children}
    </header>
  );
}

export function Panel({ title, aside, children, className = "" }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-paper-line bg-paper-2 ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-paper-line px-5 py-3.5">
          <h2 className="font-medium text-ink">{title}</h2>
          {aside}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Indicateur avec explication accessible au survol et au focus. */
export function Kpi({ label, value, compare, help, tone = "ink" }: { label: string; value: string; compare?: string; help: string; tone?: "ink" | "laterite" | "sage" | "amber" }) {
  const color = { ink: "text-ink", laterite: "text-laterite-deep", sage: "text-sage-deep", amber: "text-amber-deep" }[tone];
  return (
    <div className="group relative rounded-2xl border border-paper-line bg-paper-2 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate">{label}</p>
        <button
          type="button"
          aria-label={`Comprendre : ${label}`}
          className="peer grid h-5 w-5 shrink-0 place-items-center rounded-full border border-paper-line text-[11px] text-slate hover:border-ink hover:text-ink"
        >
          ?
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-3 top-11 z-20 w-64 translate-y-1 rounded-xl bg-ink p-3 text-xs leading-relaxed text-cream opacity-0 shadow-[0_12px_30px_-10px_rgba(10,14,26,0.6)] transition-[opacity,transform] duration-200 peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100"
        >
          {help}
        </span>
      </div>
      <p className={`mt-3 font-display text-[2rem] font-semibold leading-none tracking-[-0.02em] tabular-nums ${color}`}>{value}</p>
      {compare && <p className="mt-2 text-xs text-slate">{compare}</p>}
    </div>
  );
}

export function Pill({ tone, children }: { tone: "laterite" | "sage" | "amber" | "slate" | "indigo"; children: React.ReactNode }) {
  const cls = {
    laterite: "bg-laterite/12 text-laterite-deep",
    sage: "bg-sage/20 text-sage-deep",
    amber: "bg-amber/20 text-amber-deep",
    slate: "bg-paper-3 text-slate",
    indigo: "bg-indigo/15 text-indigo-deep",
  }[tone];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function OperatorDot({ op }: { op: string }) {
  const c = { ALPHAMONEY: "#7d8cff", BETACASH: "#7cc4a4", GAMMAPAY: "#e8b04b" }[op] ?? "#5b6172";
  return <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />;
}

/** Courbe des FCFA encore gelables : ce que chaque minute de retard coûte aux victimes. */
export function FreezableChart({ points, alertAt, soloAlertAt, height = 180 }: { points: [string, number][]; alertAt?: string; soloAlertAt?: string; height?: number }) {
  if (!points.length) return <p className="text-sm text-slate">Pas de courbe pour cette alerte.</p>;
  const W = 640;
  const H = height;
  const pad = { l: 56, r: 12, t: 12, b: 26 };
  const t0 = new Date(points[0][0]).getTime();
  const t1 = new Date(points[points.length - 1][0]).getTime();
  const max = Math.max(...points.map((p) => p[1]));
  const x = (iso: string) => pad.l + ((new Date(iso).getTime() - t0) / (t1 - t0 || 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / (max || 1)) * (H - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(" ");
  const area = `${d} L${x(points[points.length - 1][0])} ${H - pad.b} L${pad.l} ${H - pad.b} Z`;
  const fmt = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" }).format(new Date(iso));
  const valueAt = (iso?: string) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    let v = points[0][1];
    for (const p of points) if (new Date(p[0]).getTime() <= t) v = p[1];
    return v;
  };
  const marker = (iso: string | undefined, color: string, label: string) => {
    if (!iso) return null;
    const v = valueAt(iso)!;
    const mx = x(iso);
    if (mx < pad.l || mx > W - pad.r) return null;
    return (
      <g>
        <line x1={mx} x2={mx} y1={pad.t} y2={H - pad.b} stroke={color} strokeDasharray="3 4" />
        <circle cx={mx} cy={y(v)} r="5" fill={color} stroke="#fbf8f2" strokeWidth="2" />
        <text x={mx + 8} y={pad.t + 12} fontSize="11" fill={color} style={{ fontFamily: "var(--font-plex)" }}>
          {label} {fmt(iso)}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="FCFA encore gelables au fil du temps">
      {[0, 0.5, 1].map((k) => (
        <g key={k}>
          <line x1={pad.l} x2={W - pad.r} y1={y(max * k)} y2={y(max * k)} stroke="#d9d0be" strokeWidth="1" />
          <text x={pad.l - 8} y={y(max * k) + 4} textAnchor="end" fontSize="10.5" fill="#5b6172" style={{ fontFamily: "var(--font-plex-mono)" }}>
            {new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(max * k)}
          </text>
        </g>
      ))}
      <path d={area} fill="#e0643a" fillOpacity=".08" />
      <path d={d} fill="none" stroke="#e0643a" strokeWidth="2" strokeLinejoin="round" />
      {marker(alertAt, "#b8461f", "Consortium")}
      {marker(soloAlertAt, "#5b6172", "Opérateur seul")}
      <text x={pad.l} y={H - 6} fontSize="10.5" fill="#5b6172" style={{ fontFamily: "var(--font-plex-mono)" }}>
        {fmt(points[0][0])}
      </text>
      <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="10.5" fill="#5b6172" style={{ fontFamily: "var(--font-plex-mono)" }}>
        {fmt(points[points.length - 1][0])}
      </text>
    </svg>
  );
}
