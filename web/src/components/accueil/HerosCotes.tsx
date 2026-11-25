"use client";
// Les côtés du haut de page : les trois plaintes de CMP-01, une par réseau, flottent et
// envoient chacune un fil vers le titre. C'est le produit en une image : des plaintes
// isolées qui convergent. Affiché seulement quand l'écran laisse la place (≥ 1280 px).
import Image from "next/image";
import { useRef } from "react";
import { casDemo, nombre } from "@/lib/accueil";
import { hhmm, operatorColor } from "@/lib/data";
import { AVEC_MOUVEMENT, gsap, useGSAP } from "./mouvement";

const [p1, p2, p3] = casDemo.plaintes;

// Positions en % de la zone du titre ; `profondeur` règle l'amplitude de la parallaxe.
const PLAINTES = [
  { p: p1, cote: "gauche", style: { left: "2%", top: "8%" }, profondeur: 1.3 },
  { p: p2, cote: "gauche", style: { left: "7%", top: "50%" }, profondeur: 0.8 },
  { p: p3, cote: "droite", style: { right: "6%", top: "46%" }, profondeur: 1.1 },
];
const OBJETS = [
  { src: "objet-telephone-alerte", style: { left: "1%", top: "78%" }, taille: 116, profondeur: 0.6, rotation: -10 },
  { src: "objet-billets", style: { right: "2%", top: "2%" }, taille: 150, profondeur: 1.5, rotation: 12 },
  { src: "objet-reseau", style: { right: "1%", top: "80%" }, taille: 104, profondeur: 0.7, rotation: -6 },
  { src: "objet-piece", style: { right: "12.5%", top: "24%" }, taille: 78, profondeur: 2.2, rotation: 16, hauteur: 811 },
];
// Fils pointillés, des plaintes vers les bords du surlignage « avant le retrait » :
// ils passent par les marges et ne croisent jamais le paragraphe (viewBox 1000 × 600).
const FILS = ["M165 78 C 215 78, 205 190, 232 190", "M205 335 C 225 335, 214 220, 232 206", "M800 308 C 784 308, 790 214, 768 200"];

function Plainte({ p }: { p: (typeof casDemo.plaintes)[number] }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-blanc/90 py-2.5 pl-3 pr-4 shadow-[0_2px_6px_rgba(15,23,18,.05),0_18px_40px_-22px_rgba(15,23,18,.35)] backdrop-blur">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: operatorColor[p.operateur] }} />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: operatorColor[p.operateur] }} />
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-semibold">Plainte · {p.operateur}</span>
        <span className="block font-donnee text-[11.5px] text-gris">
          {hhmm(p.heure)} · {nombre(p.montant)} F
        </span>
      </span>
    </div>
  );
}

export default function HerosCotes() {
  const racine = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      gsap.matchMedia().add(AVEC_MOUVEMENT, () => {
        gsap.from(".cote-el", { autoAlpha: 0, scale: 0.8, y: 30, duration: 1.3, ease: "expo.out", stagger: 0.12, delay: 0.9 });
        gsap.from(".fil", { autoAlpha: 0, duration: 1.6, ease: "power2.out", stagger: 0.15, delay: 1.3 });
        gsap.utils.toArray<HTMLElement>(".flotte-doux").forEach((el, i) =>
          gsap.to(el, { y: i % 2 ? 12 : -12, rotate: i % 2 ? 2 : -2, duration: 2.8 + i * 0.45, ease: "sine.inOut", yoyo: true, repeat: -1 }),
        );
        const suivre = contextSafe!((e: PointerEvent) => {
          const x = e.clientX / window.innerWidth - 0.5;
          const y = e.clientY / window.innerHeight - 0.5;
          gsap.utils.toArray<HTMLElement>(".cote-el").forEach((el) => {
            const k = Number(el.dataset.profondeur ?? 1);
            gsap.to(el, { x: x * 34 * k, y: y * 24 * k, duration: 1.4, ease: "power3.out", overwrite: "auto" });
          });
        });
        window.addEventListener("pointermove", suivre);
        return () => window.removeEventListener("pointermove", suivre);
      });
    },
    { scope: racine },
  );

  return (
    <div ref={racine} aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
      <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {FILS.map((d) => (
          <path key={d} d={d} className="fil animate-[fil_2.4s_linear_infinite] motion-reduce:animate-none" fill="none" stroke="var(--color-lime-vif)" strokeWidth="1.6" strokeDasharray="5 9" strokeLinecap="round" opacity=".7" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {PLAINTES.map(({ p, style, profondeur }) => (
        <div key={p.heure} className="cote-el absolute" style={style} data-profondeur={profondeur}>
          <div className="flotte-doux">
            <Plainte p={p} />
          </div>
        </div>
      ))}
      {OBJETS.map((o) => (
        <div key={o.src} className="cote-el absolute" style={o.style} data-profondeur={o.profondeur}>
          <div className="flotte-doux" style={{ rotate: `${o.rotation}deg` }}>
            <Image src={`/visuels/${o.src}.png`} alt="" width={900} height={"hauteur" in o ? o.hauteur : 900} sizes={`${o.taille}px`} style={{ width: o.taille }} className="h-auto drop-shadow-[0_24px_24px_rgba(15,23,18,.2)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
