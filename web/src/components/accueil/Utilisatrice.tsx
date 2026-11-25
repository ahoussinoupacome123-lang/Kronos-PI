"use client";
// Pour qui : la responsable litiges et fraude, et le dossier qu'elle reçoit déjà rempli.
import Image from "next/image";
import { useRef } from "react";
import { Check, FileCheck2 } from "lucide-react";
import { nombre } from "@/lib/accueil";
import { dossiers } from "@/lib/data";
import { AVEC_MOUVEMENT, gsap, useGSAP } from "./mouvement";

const dossier = dossiers.find((d) => d.decision === "REMBOURSER")!;
const jour = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "Africa/Porto-Novo" }).format(new Date(iso));

export default function Utilisatrice() {
  const racine = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(AVEC_MOUVEMENT, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: racine.current, start: "top 65%" }, defaults: { ease: "expo.out" } });
        tl.from(".portrait", { clipPath: "inset(18% 18% 18% 18% round 36px)", duration: 1.5, ease: "expo.inOut" })
          .from(".portrait img", { scale: 1.25, duration: 1.8 }, "<")
          .from(".util-texte > *", { y: 34, autoAlpha: 0, duration: 1, stagger: 0.1 }, "-=1.1")
          .from(".fiche", { x: 80, autoAlpha: 0, duration: 1.1 }, "-=0.9")
          .from(".sablier", { y: 80, rotate: -20, autoAlpha: 0, duration: 1.2 }, "-=0.9");
        gsap.to(".sablier", { y: -50, rotate: 8, ease: "none", scrollTrigger: { trigger: racine.current, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      });
    },
    { scope: racine },
  );

  return (
    <section ref={racine} data-fond="#F7F9F4" className="px-4 py-28">
      <div className="mx-auto grid grid-cols-1 max-w-[1240px] items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
        <div className="relative order-2 lg:order-1">
          <div className="portrait relative aspect-[4/5] overflow-hidden rounded-[36px]">
            <Image src="/visuels/responsable-fraude.jpg" alt="Une responsable litiges et fraude travaille sur son ordinateur." fill sizes="(max-width: 1024px) 100vw, 600px" className="object-cover" />
          </div>
          <div className="fiche absolute -right-2 bottom-10 w-[300px] rounded-[24px] bg-blanc p-5 shadow-[0_2px_6px_rgba(15,23,18,.06),0_30px_60px_-28px_rgba(15,23,18,.45)] sm:-right-10">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <FileCheck2 size={18} strokeWidth={1.9} className="text-lime-texte" /> Dossier prêt
              <span className="ml-auto font-donnee text-[11px] text-gris">{dossier.id}</span>
            </p>
            <p className="mt-2 font-titre text-[22px] font-bold tracking-[-0.03em]">
              Rembourser {nombre(dossier.amountFcfa ?? 0)} FCFA
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
              <div className="rounded-xl bg-brume px-3 py-2">
                <dt className="text-gris">J+{dossier.timer.refund_business_days} ouvrés</dt>
                <dd className="font-semibold">{jour(dossier.timer.refund_due_at)}</dd>
              </div>
              <div className="rounded-xl bg-brume px-3 py-2">
                <dt className="text-gris">J+{dossier.timer.client_answer_calendar_days}</dt>
                <dd className="font-semibold">{jour(dossier.timer.client_answer_due_at)}</dd>
              </div>
            </dl>
          </div>
          <Image src="/visuels/objet-sablier.png" alt="" width={900} height={900} sizes="160px" className="sablier pointer-events-none absolute -left-6 -top-10 w-[130px] drop-shadow-[0_30px_30px_rgba(15,23,18,.25)] sm:w-[160px] lg:-left-14" />
        </div>

        <div className="util-texte order-1 lg:order-2">
          <h2 className="font-titre text-[clamp(2.4rem,4.6vw,3.9rem)] font-bold leading-[1] tracking-[-0.04em] text-balance">
            Pour celle qui doit rendre l&apos;argent dans les délais.
          </h2>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-encre-2">
            La responsable litiges et fraude d&apos;un émetteur doit rembourser sous 3 jours ouvrés (art. 35) et répondre au client sous un mois. Elle reçoit
            l&apos;alerte ou le dossier déjà rempli, avec ses échéances, et c&apos;est elle qui décide.
          </p>
          <ul className="mt-8 grid gap-3 text-[16px]">
            {["Demande d'annulation PI-SPI pré-remplie", "Minuteur J+3 ouvrés et J+30", "Chaque décision signée et tracée"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-lime font-bold text-encre">
                  <Check size={15} strokeWidth={2.6} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
