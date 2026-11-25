"use client";
// Défilement fluide (Lenis) synchronisé avec ScrollTrigger, et couleur de fond qui
// glisse d'une section à l'autre au lieu de coupures nettes.
import { useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { AVEC_MOUVEMENT, gsap, ScrollTrigger, useGSAP } from "./mouvement";

export default function DefilementFluide({ children }: { children: ReactNode }) {
  const racine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia(AVEC_MOUVEMENT).matches) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useGSAP(
    () => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-fond]");
      sections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (st) => {
            if (!st.isActive) return;
            gsap.to(racine.current, { backgroundColor: section.dataset.fond, duration: 0.9, ease: "power2.out", overwrite: "auto" });
          },
        });
      });
    },
    { scope: racine },
  );

  return (
    <div ref={racine} className="overflow-x-clip bg-sol font-texte text-encre">
      {children}
    </div>
  );
}
