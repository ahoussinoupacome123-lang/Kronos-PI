"use client";
// Écran du téléphone de la photo héros : la campagne CMP-01 rejouée en boucle.
// Les plaintes arrivent de trois réseaux, puis l'alerte s'allume. Tout vient des mesures.
import { NOM_ACCENT, NOM_BASE } from "@/lib/nom";
import { useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { casDemo, nombre } from "@/lib/accueil";
import { hhmm, operatorColor } from "@/lib/data";
import { AVEC_MOUVEMENT, gsap, useGSAP } from "./mouvement";

const PLAINTES = casDemo.plaintes.slice(0, 3);

export default function EcranTelephone() {
  const ecran = useRef<HTMLDivElement>(null);
  const compteur = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(AVEC_MOUVEMENT, () => {
        const valeur = { v: casDemo.totalFcfa };
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 1.4 });
        tl.set(".ligne", { autoAlpha: 0, y: 14 })
          .set(".alerte", { autoAlpha: 0, scale: 0.92, y: 10 })
          .set(valeur, { v: casDemo.totalFcfa })
          .to(".ligne", { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.9 })
          .to(".alerte", { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.6)" }, "+=0.5")
          .to(".halo", { opacity: 1, duration: 0.4, yoyo: true, repeat: 3 }, "<")
          .to(
            valeur,
            {
              v: casDemo.encoreSurLeCompte,
              duration: 2.2,
              ease: "power2.inOut",
              onUpdate: () => {
                if (compteur.current) compteur.current.textContent = nombre(Math.round(valeur.v / 1000) * 1000);
              },
            },
            "-=0.2",
          )
          .to({}, { duration: 2.4 })
          .to([".ligne", ".alerte"], { autoAlpha: 0, duration: 0.5, ease: "power2.in" });
      });
    },
    { scope: ecran },
  );

  return (
    <div ref={ecran} className="absolute inset-0 overflow-hidden bg-[#F4F7F0] [container-type:inline-size]" aria-hidden>
      <div className="flex items-center justify-between px-[8cqw] pt-[5cqw] font-donnee text-[5cqw] font-medium text-encre">
        <span>{hhmm(casDemo.heureAlerte)}</span>
        <span className="h-[3cqw] w-[9cqw] rounded-full bg-encre/80" />
      </div>
      <div className="mt-[6cqw] px-[7cqw]">
        <div className="flex items-center gap-[2cqw] font-titre text-[8cqw] font-extrabold tracking-[-0.04em]">
          {NOM_BASE}<span className="grid h-[9cqw] min-w-[9cqw] place-items-center rounded-[2.6cqw] bg-lime px-[1.4cqw]">{NOM_ACCENT}</span>
        </div>
        <p className="mt-[1cqw] text-[4.6cqw] text-gris">Plaintes reçues sur le consortium</p>
      </div>

      <ul className="mt-[5cqw] space-y-[3cqw] px-[5cqw]">
        {PLAINTES.map((p) => (
          <li key={p.heure} className="ligne flex items-center gap-[3cqw] rounded-[4cqw] bg-white px-[4cqw] py-[3.4cqw] shadow-[0_2px_8px_rgba(15,23,18,.06)]">
            <span className="h-[4.6cqw] w-[4.6cqw] shrink-0 rounded-full" style={{ background: operatorColor[p.operateur] ?? "#66726A" }} />
            <span className="min-w-0 flex-1">
              <span className="block text-[4.4cqw] font-semibold leading-tight">Plainte · {p.operateur}</span>
              <span className="block font-donnee text-[3.8cqw] text-gris">
                {hhmm(p.heure)} · {nombre(p.montant)} F
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="alerte relative mx-[5cqw] mt-[5cqw] rounded-[5cqw] bg-nuit px-[5cqw] py-[4.6cqw] text-white">
        <span className="halo pointer-events-none absolute -inset-[1.4cqw] rounded-[6cqw] opacity-0 ring-[1.4cqw] ring-alerte/60" />
        <span className="flex items-center gap-[2cqw] text-[4.2cqw] font-semibold text-[#FF8A8E]">
          <TriangleAlert className="h-[5cqw] w-[5cqw]" strokeWidth={2.2} /> Mule probable
        </span>
        <span className="mt-[1.4cqw] block text-[4.2cqw] text-white/75">
          {casDemo.plaignants} plaignants · {casDemo.reseaux} réseaux
        </span>
        <span className="mt-[2.4cqw] block font-titre text-[9.5cqw] font-bold leading-none tracking-[-0.04em] tabular-nums">
          <span ref={compteur}>{nombre(casDemo.encoreSurLeCompte)}</span>
          <span className="ml-[1.6cqw] text-[4.4cqw] font-semibold text-lime">FCFA</span>
        </span>
        <span className="mt-[1cqw] block text-[3.8cqw] text-white/60">encore sur le compte</span>
      </div>
    </div>
  );
}
