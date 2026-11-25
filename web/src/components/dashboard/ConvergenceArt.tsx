// Illustration de la carte d'accueil : trois nuages de clients (les réseaux) dont les plaintes convergent
// vers un seul compte. Points générés de façon déterministe pour un rendu identique serveur et client.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

export default function ConvergenceArt({ className = "" }: { className?: string }) {
  const rand = rng(42);
  const clusters = [
    { x: 95, y: 92, c: "#4d74ff" },
    { x: 330, y: 70, c: "#22b07d" },
    { x: 230, y: 250, c: "#ffc531" },
  ];
  const center = { x: 215, y: 140 };
  const dots = clusters.flatMap((cl, k) =>
    Array.from({ length: 70 }, () => {
      const a = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.6) * 52;
      return { x: r1(cl.x + Math.cos(a) * r), y: r1(cl.y + Math.sin(a) * r * 0.8), r: r1(0.8 + rand() * 2.2), c: cl.c, o: r1(0.35 + rand() * 0.6), k };
    }),
  );
  const streams = clusters.flatMap((cl, k) =>
    [0, 1, 2].map((i) => {
      const sx = cl.x + (i - 1) * 16;
      const sy = cl.y + (i - 1) * 10;
      const mx = (sx + center.x) / 2 + (k === 1 ? 20 : -20);
      const my = Math.min(sy, center.y) - 30 - i * 8;
      return { d: `M${r1(sx)} ${r1(sy)} Q${r1(mx)} ${r1(my)} ${center.x} ${center.y}`, c: cl.c, key: `${k}-${i}` };
    }),
  );
  return (
    <svg viewBox="0 0 420 300" className={className} role="img" aria-label="Trois réseaux dont les plaintes convergent vers un même compte">
      <defs>
        <radialGradient id="ca-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f2542d" stopOpacity=".55" />
          <stop offset="1" stopColor="#f2542d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ca-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#dce7ff" stopOpacity="1" />
          <stop offset="1" stopColor="#dce7ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="215" cy="150" rx="200" ry="140" fill="url(#ca-halo)" />
      {streams.map((s) => (
        <path key={s.key} d={s.d} fill="none" stroke={s.c} strokeOpacity=".7" strokeWidth="1.4" />
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} fillOpacity={d.o} />
      ))}
      <circle cx={center.x} cy={center.y} r="46" fill="url(#ca-core)" />
      <circle cx={center.x} cy={center.y} r="26" fill="none" stroke="#f2542d" strokeOpacity=".45" />
      <circle cx={center.x} cy={center.y} r="11" fill="#f2542d" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
