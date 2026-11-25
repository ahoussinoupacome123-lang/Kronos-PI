import { BRAND } from "@/lib/brand";
// Défilement des émetteurs de l'UEMOA que ${BRAND.name} doit relier.
// Choix délibéré : monogrammes neutres, pas les logos des marques. Ces acteurs ne sont ni clients ni partenaires ;
// afficher leurs logos laisserait croire le contraire devant un jury où siègent certains d'entre eux.
type Issuer = { name: string; mono: string; detail: string };

const ISSUERS: Issuer[] = [
  { name: "Orange Money", mono: "OM", detail: "38,4 % du volume UEMOA" },
  { name: "Wave", mono: "WV", detail: "28,4 % du volume UEMOA" },
  { name: "MTN MoMo", mono: "MT", detail: "17,4 % du volume UEMOA" },
  { name: "Moov Money", mono: "MV", detail: "6,9 % du volume UEMOA" },
  { name: "Mixx by Yas", mono: "YS", detail: "3 % du volume UEMOA" },
  { name: "Celtiis Cash", mono: "CC", detail: "Bénin" },
  { name: "Coris Money", mono: "CM", detail: "Burkina Faso" },
  { name: "Wizall Money", mono: "WZ", detail: "Sénégal · Côte d'Ivoire" },
  { name: "Banques PI-SPI", mono: "BQ", detail: "participants directs" },
  { name: "IMF connectées", mono: "IM", detail: "participants indirects" },
];

const tones = ["#3d4bc4", "#2f7a5a", "#9a6a12", "#b8461f", "#5b6172"];

function Monogram({ text, i }: { text: string; i: number }) {
  const c = tones[i % tones.length];
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="37" height="37" rx="11" fill={c} fillOpacity=".09" stroke={c} strokeOpacity=".35" />
      <text x="19" y="23.5" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={c} style={{ fontFamily: "var(--font-plex-mono)" }}>
        {text}
      </text>
    </svg>
  );
}

export default function IssuerMarquee() {
  const row = [...ISSUERS, ...ISSUERS];
  return (
    <section aria-labelledby="ecosysteme" className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 id="ecosysteme" className="max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] text-ink text-balance md:text-3xl">
          Une arnaque traverse les réseaux. Personne ne la voit en entier.
        </h2>
        <p className="mt-3 max-w-2xl text-slate">
          175 institutions sont connectées à PI-SPI. Chacune ne lit que ses propres réclamations. {BRAND.name} est la
          couche qui les relie, sans qu&apos;aucune ne livre le texte d&apos;un client.
        </p>
      </div>
      <div
        className="marquee relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
        aria-label="Émetteurs de monnaie électronique et participants de l'UEMOA"
      >
        <ul className="marquee-track flex w-max gap-4 pr-4">
          {row.map((it, i) => (
            <li
              key={`${it.name}-${i}`}
              aria-hidden={i >= ISSUERS.length}
              className="flex items-center gap-3 rounded-2xl border border-paper-line bg-paper-2 py-3 pl-3 pr-6 shadow-[0_1px_2px_rgba(10,14,26,0.04),0_8px_24px_-12px_rgba(10,14,26,0.12)]"
            >
              <Monogram text={it.mono} i={i} />
              <span className="flex flex-col leading-tight">
                <span className="font-medium text-ink">{it.name}</span>
                <span className="text-xs text-slate">{it.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mx-auto mt-5 max-w-6xl px-6 text-xs text-slate">
        Marché adressable, pas des clients : aucun partenariat n&apos;est revendiqué. Parts de volume des transactions de
        monnaie électronique : BCEAO, rapport annuel sur les services financiers numériques 2024. Les démonstrations
        utilisent trois opérateurs fictifs.
      </p>
    </section>
  );
}
