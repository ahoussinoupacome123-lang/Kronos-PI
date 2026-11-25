// Briques visuelles du tableau de bord (serveur ou client).
import Image from "next/image";

/** En-tête de page. `objet` : nom d'un objet 3D de `public/visuels/` (sans « objet- » ni extension). */
export function PageHead({ title, lead, objet, children }: { title: string; lead?: React.ReactNode; objet?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-5">
        {objet && (
          <Image src={`/visuels/objet-${objet}.png`} alt="" width={900} height={900} sizes="96px" className="flotte-css hidden w-[84px] shrink-0 drop-shadow-[0_16px_16px_rgba(15,23,18,.18)] sm:block md:w-[96px]" />
        )}
        <div>
          <h1 className="font-titre text-[clamp(2rem,3.4vw,2.6rem)] font-bold leading-[1.02] tracking-[-0.04em] text-encre text-balance">{title}</h1>
          {lead && <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-encre-2">{lead}</p>}
        </div>
      </div>
      {children}
    </header>
  );
}

export function Panel({ title, aside, children, className = "" }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`carte rounded-[26px] bg-blanc ring-1 ring-encre/[0.06] shadow-[0_1px_2px_rgba(15,23,18,.04),0_24px_48px_-32px_rgba(15,23,18,.35)] ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-6 pb-1 pt-5">
          <h2 className="flex min-w-0 items-center gap-2.5 font-titre text-[16px] font-bold tracking-[-0.01em] text-encre">
            <span aria-hidden className="h-4 w-1.5 shrink-0 rounded-full bg-lime" />
            {title}
          </h2>
          {aside}
        </div>
      )}
      <div className="px-6 pb-6 pt-4">{children}</div>
    </section>
  );
}

/** Indicateur avec explication accessible au survol et au focus. */
export function Kpi({ label, value, compare, help, tone = "ink" }: { label: string; value: string; compare?: string; help: string; tone?: "ink" | "laterite" | "sage" | "amber" }) {
  const color = { ink: "text-encre", laterite: "text-laterite-deep", sage: "text-lime-texte", amber: "text-amber-deep" }[tone];
  const barre = { ink: "bg-encre", laterite: "bg-alerte", sage: "bg-lime", amber: "bg-amber" }[tone];
  return (
    <div className="carte group relative flex flex-col overflow-hidden rounded-[26px] bg-blanc p-5 ring-1 ring-encre/[0.06] shadow-[0_1px_2px_rgba(15,23,18,.04),0_24px_48px_-32px_rgba(15,23,18,.35)] transition-transform duration-300 hover:-translate-y-0.5">
      <span aria-hidden className={`absolute left-0 top-6 h-8 w-1 rounded-r-full ${barre}`} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-gris">{label}</p>
        <button
          type="button"
          aria-label={`Comprendre : ${label}`}
          className="peer grid h-5 w-5 shrink-0 place-items-center rounded-full border border-paper-line text-[11px] text-slate hover:border-ink hover:text-ink"
        >
          ?
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-3 top-11 z-20 w-64 translate-y-1 rounded-xl bg-ink p-3 text-xs leading-relaxed text-cream opacity-0 shadow-[0_12px_30px_-10px_rgba(15,23,18,0.6)] transition-[opacity,transform] duration-200 peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100"
        >
          {help}
        </span>
      </div>
      <p className={`mt-auto pt-4 font-titre text-[2.4rem] font-bold leading-none tracking-[-0.04em] tabular-nums ${color}`}>{value}</p>
      {compare && <p className="mt-3 self-start rounded-full bg-brume px-2.5 py-1 text-[11.5px] text-encre-2">{compare}</p>}
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
  const c = { ALPHAMONEY: "var(--color-reseau-a)", BETACASH: "var(--color-reseau-b)", GAMMAPAY: "var(--color-reseau-c)" }[op] ?? "var(--color-slate)";
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
  const marker = (iso: string | undefined, color: string, label: string, rang = 0) => {
    if (!iso) return null;
    const v = valueAt(iso)!;
    const mx = x(iso);
    if (mx < pad.l || mx > W - pad.r) return null;
    return (
      <g>
        <line x1={mx} x2={mx} y1={pad.t} y2={H - pad.b} stroke={color} strokeDasharray="3 4" />
        <circle cx={mx} cy={y(v)} r="10" fill={color} fillOpacity=".15" />
        <circle cx={mx} cy={y(v)} r="5" fill={color} stroke="#fff" strokeWidth="2" />
        <text x={mx + 8} y={H - pad.b - 10 - rang * 15} fontSize="11" fill={color} fontWeight="600" style={{ fontFamily: "var(--font-donnee)" }}>
          {label} {fmt(iso)}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="FCFA encore gelables au fil du temps">
      <defs>
        <linearGradient id="fc-aire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-lime)" stopOpacity=".55" />
          <stop offset="1" stopColor="var(--color-lime)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((k) => (
        <g key={k}>
          <line x1={pad.l} x2={W - pad.r} y1={y(max * k)} y2={y(max * k)} stroke="var(--color-mist)" strokeOpacity=".5" strokeWidth="1" strokeDasharray="2 5" />
          <text x={pad.l - 8} y={y(max * k) + 4} textAnchor="end" fontSize="10.5" fill="var(--color-slate)" style={{ fontFamily: "var(--font-donnee)" }}>
            {new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(max * k)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#fc-aire)" />
      <path d={d} fill="none" stroke="var(--color-lime-texte)" strokeWidth="2.4" strokeLinejoin="round" />
      {marker(alertAt, "var(--color-laterite-deep)", "Consortium")}
      {marker(soloAlertAt, "var(--color-slate)", "Opérateur seul", 1)}
      <text x={pad.l} y={H - 6} fontSize="10.5" fill="var(--color-slate)" style={{ fontFamily: "var(--font-donnee)" }}>
        {fmt(points[0][0])}
      </text>
      <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="10.5" fill="var(--color-slate)" style={{ fontFamily: "var(--font-donnee)" }}>
        {fmt(points[points.length - 1][0])}
      </text>
    </svg>
  );
}
