"use client";
// Clôture : l'appel au pilote, sur un aplat lime, puis le pied de page.
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { BRAND } from "@/lib/brand";
import { BoutonDemo, Marque } from "./Navigation";
import { AVEC_MOUVEMENT, gsap, useGSAP } from "./mouvement";

const LIENS = [
  { href: "/cgu", label: "Conditions d'utilisation" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export default function Cloture() {
  const racine = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(AVEC_MOUVEMENT, () => {
        gsap.from(".appel", {
          clipPath: "inset(10% 6% 0% 6% round 48px)",
          ease: "none",
          scrollTrigger: { trigger: racine.current, start: "top bottom", end: "top 35%", scrub: 0.8 },
        });
        gsap.from(".appel-texte > *", { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: racine.current, start: "top 55%" } });
        gsap.from(".appel-photo", { clipPath: "inset(12% 12% 12% 12% round 32px)", scale: 0.92, ease: "none", scrollTrigger: { trigger: racine.current, start: "top 85%", end: "top 30%", scrub: 0.8 } });
        gsap.fromTo(".appel-objet", { y: 80, rotate: -14 }, { y: -30, rotate: 6, ease: "none", scrollTrigger: { trigger: racine.current, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      });
    },
    { scope: racine },
  );

  return (
    <section ref={racine} data-fond="#F7F9F4" className="pt-28">
      <div className="appel mx-3 grid grid-cols-1 items-end gap-10 overflow-hidden rounded-t-[48px] bg-lime px-7 pb-16 pt-20 md:mx-4 md:grid-cols-[1.05fr_.95fr] md:px-16 md:pt-24">
        <div className="appel-texte">
          <h2 className="max-w-[15ch] font-titre text-[clamp(2.6rem,5.6vw,4.8rem)] font-bold leading-[0.98] tracking-[-0.045em]">Huit semaines, deux réseaux, vos plaintes anonymisées.</h2>
          <p className="mt-6 max-w-[46ch] text-lg text-[#24320C]">
            Un pilote sur votre historique de litiges, pour mesurer ce que la démonstration ne peut pas : vos campagnes réelles, vos délais, vos FCFA rendus.
          </p>
          <div className="mt-9">
            <BoutonDemo label="Proposer un pilote" href={`mailto:${BRAND.contact}`} />
          </div>
        </div>
        <div className="relative">
          <div className="appel-photo relative aspect-[3/2] overflow-hidden rounded-[32px] shadow-[0_40px_80px_-40px_rgba(15,23,18,.5)]">
            <Image src="/visuels/agent-kiosque.jpg" alt="Une agente mobile money de Cotonou montre un transfert réussi à une cliente." fill sizes="(max-width: 768px) 100vw, 520px" className="object-cover" />
          </div>
          <Image src="/visuels/objet-sablier.png" alt="" width={900} height={900} sizes="150px" className="appel-objet absolute -bottom-8 -left-8 w-[120px] drop-shadow-[0_30px_30px_rgba(15,23,18,.3)] md:w-[150px]" />
        </div>
      </div>
      <footer className="mx-3 rounded-b-[48px] bg-nuit px-7 py-10 text-white/70 md:mx-4 md:px-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <Marque className="text-white [&>span]:text-encre" />
            <p className="mt-2 text-sm">
              Anciennement {BRAND.legacyName} · {BRAND.team}, GPU Challenge 2026 · données synthétiques, opérateurs fictifs.
            </p>
          </div>
          <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LIENS.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-lime">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
      <div className="h-3" />
    </section>
  );
}
