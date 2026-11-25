"use client";
// Deux vraies plaintes du corpus synthétique, l'une arnaque, l'autre vraie erreur :
// les mêmes mots. Le signal n'est pas dans le texte, il est dans le croisement.
import Image from "next/image";
import { useRef } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { nombre, preuves } from "@/lib/accueil";
import { AVEC_MOUVEMENT, gsap, useGSAP } from "./mouvement";

// Textes tels que générés (data/complaints.jsonl), fautes comprises.
const PLAINTES = [
  {
    ref: "RC-000627",
    heure: "08:49",
    morceaux: ["Bjr madame ", "erreur", " sur 20 mil ", "vers", " gildas.quenum@alphamoney, merci de regulariser. merci de regler ca pardon dêh"],
    verite: "arnaque",
  },
  {
    ref: "RC-009409",
    heure: "06:11",
    morceaux: ["Bjr madame proleme avec un transfert de 25500 FCFA ", "vers", " aicha.gbedo@betacash, ce nest pas le bon desinatare. mci avnace"],
    verite: "erreur",
  },
] as const;

export default function Recits() {
  const racine = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(AVEC_MOUVEMENT, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: racine.current, start: "top 68%" }, defaults: { ease: "expo.out" } });
        tl.from(".recits-panneau", { y: 80, scale: 0.97, autoAlpha: 0, duration: 1.3 })
          .from(".recits-texte > :not(.bulles-3d)", { y: 30, autoAlpha: 0, duration: 1, stagger: 0.1 }, "-=0.9")
          .from(".bulle", { x: (i) => (i ? 90 : -90), autoAlpha: 0, rotate: (i) => (i ? 2 : -2), duration: 1.2, stagger: 0.18 }, "-=0.9")
          .from(".mot-commun", { backgroundSize: "0% 100%", duration: 0.8, stagger: 0.12, ease: "power2.inOut" }, "-=0.4")
          .from(".bulles-3d", { y: 50, rotate: -10, autoAlpha: 0, duration: 1.2 }, "-=0.6")
          .from(".verdict", { scale: 0.6, autoAlpha: 0, duration: 0.7, stagger: 0.15, ease: "back.out(2)" }, "-=0.3");
      });
    },
    { scope: racine },
  );

  return (
    <section ref={racine} id="recits" data-fond="#EEF2E8" className="scroll-mt-24 px-4 py-10">
      <div className="recits-panneau mx-auto grid grid-cols-1 max-w-[1240px] items-center gap-14 rounded-[40px] bg-blanc px-7 py-16 md:px-16 md:py-24 lg:grid-cols-[.9fr_1.1fr]">
        <div className="recits-texte">
          <h2 className="font-titre text-[clamp(2.4rem,4.6vw,3.9rem)] font-bold leading-[1] tracking-[-0.04em] text-balance">Deux récits. Les mêmes mots.</h2>
          <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-encre-2">
            L&apos;arnaque à l&apos;« erreur de dépôt » et la vraie erreur de numéro s&apos;écrivent de la même façon. Lue seule, une plainte ne dit
            pas qui ment.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 rounded-3xl bg-brume p-5 sm:flex-row sm:items-center sm:gap-5">
            <span className="whitespace-nowrap font-titre text-[44px] font-bold leading-none tracking-[-0.045em] tabular-nums">{nombre(preuves.ambigues)}</span>
            <span className="text-[15px] leading-snug text-encre-2">
              plaintes ambiguës mesurées : aucun moteur de lecture ne fait mieux que répondre toujours la même chose. Le signal est dans le croisement.
            </span>
          </div>
          <Image src="/visuels/objet-bulles.png" alt="" width={900} height={900} sizes="240px" className="bulles-3d flotte-css mt-8 hidden w-[240px] drop-shadow-[0_26px_26px_rgba(15,23,18,.18)] lg:block" />
        </div>

        <div className="grid gap-5">
          {PLAINTES.map((p) => (
            <figure key={p.ref} className="bulle rounded-[26px] bg-sol p-6 shadow-[inset_0_0_0_1px_rgba(15,23,18,.07)]">
              <figcaption className="mb-3 flex justify-between font-donnee text-[12.5px] text-gris">
                <span>Plainte {p.ref}</span>
                <span>{p.heure}</span>
              </figcaption>
              <blockquote className="font-donnee text-[16px] leading-relaxed text-encre">
                {p.morceaux.map((m, i) =>
                  i % 2 ? (
                    <mark key={i} className="mot-commun rounded-md bg-[linear-gradient(var(--color-lime),var(--color-lime))] bg-[length:100%_100%] bg-no-repeat px-1 text-encre">
                      {m}
                    </mark>
                  ) : (
                    <span key={i}>{m}</span>
                  ),
                )}
              </blockquote>
              {p.verite === "arnaque" ? (
                <span className="verdict mt-4 inline-flex items-center gap-1.5 rounded-full bg-alerte-fond px-3 py-1.5 text-[13px] font-semibold text-[#B4232A]">
                  <TriangleAlert size={15} strokeWidth={2} /> Vérité terrain : arnaque
                </span>
              ) : (
                <span className="verdict mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#EAF7D3] px-3 py-1.5 text-[13px] font-semibold text-lime-texte">
                  <CircleCheck size={15} strokeWidth={2} /> Vérité terrain : vraie erreur
                </span>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
