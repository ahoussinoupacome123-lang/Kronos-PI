// Logo KronosPI.
// Un cadran (Kronos, le temps) dont les douze graduations rappellent que chaque minute compte,
// et dans le cadran un K dessiné comme un graphe : trois plaintes venues de trois réseaux
// convergent vers un seul nœud, le compte mule, posé sur la ligne du temps.
type Props = { size?: number; tone?: "light" | "dark"; className?: string };

export function KronosMark({ size = 40, tone = "light", className = "" }: Props) {
  const ink = tone === "light" ? "#f5f5f7" : "#0b0d12";
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="KronosPI">
      <circle cx="32" cy="32" r="29" fill="none" stroke={ink} strokeOpacity=".28" strokeWidth="1.5" />
      {ticks.map((a) => (
        <line
          key={a}
          x1="32"
          y1={a === 0 ? "3.5" : "4.5"}
          x2="32"
          y2={a === 0 ? "10" : "7.5"}
          stroke={a === 0 ? "#ff6a3d" : ink}
          strokeOpacity={a === 0 ? 1 : 0.55}
          strokeWidth={a === 0 ? 2.4 : 1.4}
          strokeLinecap="round"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      {/* Le K-graphe : une tige (la ligne du temps) et deux bras qui convergent */}
      <path d="M23 17 V47" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M42 17 L27 32 L42 47" fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="42" cy="17" r="3.6" fill={ink} />
      <circle cx="42" cy="47" r="3.6" fill={ink} />
      <circle cx="23" cy="17" r="3.6" fill={ink} />
      <circle cx="27" cy="32" r="5.4" fill="#ff6a3d" stroke={tone === "light" ? "#0b0d12" : "#f5f5f7"} strokeWidth="2" />
    </svg>
  );
}

export function KronosLogo({ size = 36, tone = "light", className = "" }: Props) {
  const ink = tone === "light" ? "#f5f5f7" : "#0b0d12";
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <KronosMark size={size} tone={tone} />
      <span style={{ color: ink, fontSize: size * 0.62, letterSpacing: "-0.02em" }} className="font-semibold leading-none">
        Kronos<span style={{ fontWeight: 300 }}>PI</span>
      </span>
    </span>
  );
}
