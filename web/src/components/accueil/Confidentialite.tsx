"use client";
// Ce qui reste chez l'opérateur, ce qui part au hub, et la limite dite d'avance.
// La page bascule en encre à l'entrée de cette section (data-fond).
import Image from "next/image";
import { useRef } from "react";
import { Check, Lock } from "lucide-react";
import { meta } from "@/lib/data";
import { AVEC_MOUVEMENT, gsap, useGSAP } from "./mouvement";

const premiereLettre = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default function Confidentialite() {
  const racine = useRef<HTMLElement>(null);
  const { ne_sort_jamais, sort, limite_connue, production } = meta.privacy;

  useGSAP(
    () => {
      gsap.matchMedia().add(AVEC_MOUVEMENT, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: racine.current, start: "top 60%" }, defaults: { ease: "expo.out" } });
        tl.from(".conf-titre > :not(.bouclier)", { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1 })
          .from(".colonne", { y: 70, autoAlpha: 0, duration: 1.2, stagger: 0.15 }, "-=0.8")
          .from(".colonne li", { x: -20, autoAlpha: 0, duration: 0.7, stagger: 0.05 }, "-=0.8")
          .from(".cle", { x: 60, rotate: 25, autoAlpha: 0, duration: 1.3, ease: "expo.out" }, 0.6)
          .from(".bouclier", { scale: 0.6, rotate: -25, autoAlpha: 0, duration: 1.4, ease: "back.out(1.4)" }, 0.2);
      });
    },
    { scope: racine },
  );

  return (
    <section ref={racine} id="confidentialite" data-fond="#1E2B25" className="scroll-mt-24 px-4 py-28 text-white">
      <div className="mx-auto max-w-[1240px]">
        <div className="conf-titre grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="max-w-[16ch] font-titre text-[clamp(2.4rem,4.6vw,3.9rem)] font-bold leading-[1] tracking-[-0.04em]">Le texte des plaintes ne sort jamais.</h2>
            <p className="mt-5 max-w-[48ch] text-lg text-white/70">Chaque opérateur garde ses données. Le hub ne reçoit que le strict nécessaire pour faire le lien.</p>
          </div>
          <Image src="/visuels/objet-bouclier.png" alt="" width={900} height={900} sizes="200px" className="bouclier hidden w-[200px] drop-shadow-[0_30px_40px_rgba(0,0,0,.45)] md:block" />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="colonne rounded-[32px] bg-white/[.06] p-8 ring-1 ring-white/10">
            <h3 className="font-titre text-[26px] font-bold tracking-[-0.03em]">Reste chez l&apos;opérateur</h3>
            <ul className="mt-6 grid gap-4">
              {ne_sort_jamais.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[16px] text-white/85">
                  <Lock size={19} strokeWidth={1.9} className="mt-0.5 shrink-0 text-[#FF8A8E]" /> {premiereLettre(t)}
                </li>
              ))}
            </ul>
          </div>
          <div className="colonne relative rounded-[32px] bg-lime p-8 text-encre">
            <Image src="/visuels/objet-cle.png" alt="" width={900} height={900} sizes="150px" className="cle pointer-events-none absolute -right-3 -top-10 w-[150px] drop-shadow-[0_24px_24px_rgba(15,23,18,.3)]" />
            <h3 className="pr-32 font-titre text-[26px] font-bold tracking-[-0.03em]">Part au hub, le minimum</h3>
            <ul className="mt-6 grid gap-4">
              {sort.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[16px]">
                  <Check size={19} strokeWidth={2.4} className="mt-0.5 shrink-0" /> {premiereLettre(t)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="colonne mt-4 rounded-[24px] bg-white/[.04] px-7 py-5 text-[14.5px] leading-relaxed text-white/70 ring-1 ring-white/10">
          <b className="text-white">Limite, dite avant qu&apos;on nous la pose :</b> {limite_connue} <b className="text-white">En production :</b> {production}
        </p>
      </div>
    </section>
  );
}
