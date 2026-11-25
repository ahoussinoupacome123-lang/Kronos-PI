"use client";
// Les quatre temps : lire, masquer, croiser, agir. Sur grand écran la section reste
// fixée et le défilement fait avancer les étapes ; sur mobile, elles s'empilent.
import Image from "next/image";
import { useRef } from "react";
import { UserCheck } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { gsap, useGSAP } from "./mouvement";

const ETAPES = [
  { titre: "Lire", objet: "objet-telephone-alerte", texte: "L'IA lit la plainte, même écrite « 25mil » en SMS, et en tire le montant, l'heure et le bénéficiaire." },
  { titre: "Masquer", objet: "objet-bouclier", texte: "Le bénéficiaire devient une empreinte chiffrée. Le texte et le nom du plaignant restent chez l'opérateur." },
  { titre: "Croiser", objet: "objet-reseau", texte: "3 plaignants, 2 réseaux, 60 minutes, la même empreinte : alerte « mule probable »." },
  { titre: "Agir", objet: "objet-dossier", texte: "Geler le compte, ou rembourser avec un dossier PI-SPI prêt et minuté J+3 / J+30." },
];

export default function Fonctionnement() {
  const racine = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.set(".objet:not(:first-child)", { autoAlpha: 0, scale: 0.7, rotate: -12, y: 60 });
        gsap.set(".etape:not(:first-of-type)", { opacity: 0.28 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: ".scene-etapes", start: "top top", end: `+=${ETAPES.length * 90}%`, pin: true, scrub: 0.9, snap: { snapTo: 1 / (ETAPES.length - 1), duration: 0.6, ease: "power2.inOut" } },
        });
        for (let i = 1; i < ETAPES.length; i++) {
          tl.to(`.objet:nth-child(${i})`, { autoAlpha: 0, scale: 0.8, rotate: 10, y: -60, duration: 1, ease: "power2.in" })
            .to(`.objet:nth-child(${i + 1})`, { autoAlpha: 1, scale: 1, rotate: 0, y: 0, duration: 1, ease: "power2.out" }, "<0.35")
            .to(`.etape:nth-of-type(${i})`, { opacity: 0.28, duration: 0.6 }, "<")
            .to(`.etape:nth-of-type(${i + 1})`, { opacity: 1, duration: 0.6 }, "<")
            .to(".progression", { scaleY: (i + 1) / ETAPES.length, duration: 1, ease: "none" }, "<");
        }
        gsap.to(".flotte", { y: -14, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });

      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".etape-mobile").forEach((el) =>
          gsap.from(el, { y: 60, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } }),
        );
      });
    },
    { scope: racine },
  );

  return (
    <section ref={racine} id="fonctionnement" data-fond="#E8EEDD" className="scroll-mt-24">
      <div className="scene-etapes relative overflow-hidden lg:h-screen">
        <Image src="/visuels/fond-vagues.jpg" alt="" fill sizes="100vw" className="object-cover opacity-55 [mask-image:linear-gradient(transparent,#000_18%,#000_82%,transparent)]" />
        <div className="relative mx-auto grid grid-cols-1 h-full max-w-[1240px] items-center gap-12 px-6 py-24 lg:grid-cols-[1fr_1fr] lg:pb-6 lg:pt-24">
          <div>
            <h2 className="max-w-[13ch] font-titre text-[clamp(2.4rem,4.6vw,3.9rem)] font-bold leading-[1] tracking-[-0.04em]">Une plainte entre. Une décision claire sort.</h2>

            <ol className="relative mt-10 hidden gap-1 pl-8 lg:grid">
              <span aria-hidden className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-encre/10" />
              <span aria-hidden className="progression absolute bottom-2 left-0 top-2 w-[3px] origin-top rounded-full bg-lime-vif" style={{ transform: `scaleY(${1 / ETAPES.length})` }} />
              {ETAPES.map((e) => (
                <li key={e.titre} className="etape py-3">
                  <h3 className="font-titre text-[28px] font-bold tracking-[-0.03em]">{e.titre}</h3>
                  <p className="mt-1 max-w-[42ch] text-[16px] leading-relaxed text-encre-2">{e.texte}</p>
                </li>
              ))}
            </ol>

            <p className="mt-10 hidden max-w-[52ch] items-center gap-3 rounded-full bg-blanc/90 px-5 py-3.5 text-[15px] shadow-[0_10px_30px_-18px_rgba(15,23,18,.4)] backdrop-blur lg:inline-flex">
              <UserCheck size={20} strokeWidth={1.8} className="shrink-0 text-lime-texte" />
              <span>
                <b>{BRAND.name} recommande, il ne gèle jamais seul.</b> La décision reste humaine, et elle est tracée.
              </span>
            </p>
          </div>

          <div className="relative hidden aspect-square w-full max-w-[520px] justify-self-center lg:block">
            <div aria-hidden className="absolute inset-[12%] rounded-full bg-lime/45 blur-3xl" />
            <div className="flotte relative h-full w-full">
              {ETAPES.map((e, i) => (
                <Image key={e.objet} src={`/visuels/${e.objet}.png`} alt="" width={900} height={900} sizes="520px" className={`objet absolute inset-0 h-full w-full object-contain drop-shadow-[0_40px_40px_rgba(15,23,18,.22)] ${i ? "invisible opacity-0" : ""}`} />
              ))}
            </div>
          </div>

          <ol className="grid gap-10 lg:hidden">
            {ETAPES.map((e) => (
              <li key={e.titre} className="etape-mobile grid grid-cols-[96px_1fr] items-center gap-5">
                <Image src={`/visuels/${e.objet}.png`} alt="" width={900} height={900} sizes="96px" className="h-24 w-24 object-contain" />
                <div>
                  <h3 className="font-titre text-2xl font-bold tracking-[-0.03em]">{e.titre}</h3>
                  <p className="mt-1 text-[15.5px] leading-relaxed text-encre-2">{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
