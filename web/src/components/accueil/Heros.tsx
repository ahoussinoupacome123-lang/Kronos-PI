"use client";
// Haut de page : le titre, puis la photo dont le téléphone rejoue la campagne CMP-01.
import Image from "next/image";
import { useRef } from "react";
import { Hourglass, ShieldCheck } from "lucide-react";
import { casDemo, nombre, preuves } from "@/lib/accueil";
import { hhmm, num, OPERATORS, operatorColor } from "@/lib/data";
import EcranTelephone from "./EcranTelephone";
import HerosCotes from "./HerosCotes";
import { BoutonDemo } from "./Navigation";
import { AVEC_MOUVEMENT, gsap, useGSAP } from "./mouvement";

// Position de l'écran blanc dans la photo (1672 × 941), mesurée au pixel.
const ECRAN = {
  left: "57.71%",
  top: "20.72%",
  width: "15.79%",
  height: "60.47%",
};

function Mots({ texte }: { texte: string }) {
  return texte.split(" ").map((mot, i) => (
    <span
      key={i}
      className="inline-block overflow-hidden pb-[0.08em] align-bottom"
    >
      <span className="mot inline-block">{mot}&nbsp;</span>
    </span>
  ));
}

export default function Heros() {
  const racine = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const mm = gsap.matchMedia();
      mm.add(AVEC_MOUVEMENT, () => {
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
        intro
          .from(".mot", { yPercent: 115, duration: 1.2, stagger: 0.06 })
          .from(
            ".surligne",
            { scaleX: 0, duration: 1, ease: "expo.inOut" },
            "-=0.7",
          )
          .from(
            ".apparait",
            { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1 },
            "-=0.7",
          )
          .from(
            ".scene",
            {
              clipPath: "inset(14% 10% 0% 10% round 40px)",
              duration: 1.6,
              ease: "expo.inOut",
            },
            0.35,
          )
          .from(
            ".scene-photo",
            { scale: 1.18, duration: 2, ease: "expo.out" },
            0.45,
          )
          .from(
            ".carte",
            { y: 50, autoAlpha: 0, scale: 0.94, duration: 1.1, stagger: 0.14 },
            1.1,
          );

        gsap.to(".scene-photo", {
          yPercent: 7,
          ease: "none",
          scrollTrigger: {
            trigger: ".scene",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
        gsap.utils.toArray<HTMLElement>(".carte").forEach((carte) => {
          const vitesse = Number(carte.dataset.vitesse ?? 1);
          gsap.to(carte, {
            y: -90 * vitesse,
            ease: "none",
            scrollTrigger: {
              trigger: ".scene",
              start: "top 70%",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        });

        const suivre = contextSafe!((e: PointerEvent) => {
          const x = e.clientX / window.innerWidth - 0.5;
          const y = e.clientY / window.innerHeight - 0.5;
          gsap.to(".carte-interieur", {
            x: x * 22,
            y: y * 16,
            duration: 1.2,
            ease: "power3.out",
            stagger: 0.03,
          });
        });
        window.addEventListener("pointermove", suivre);
        return () => window.removeEventListener("pointermove", suivre);
      });
    },
    { scope: racine },
  );

  return (
    <section
      ref={racine}
      data-fond="#F7F9F4"
      className="relative px-4 pb-24 pt-36 md:pt-40"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="relative">
          <HerosCotes />
          <div className="relative mx-auto max-w-[920px] text-center">
            <h1 className="font-titre text-[clamp(2.7rem,6.6vw,5.9rem)] font-bold leading-[0.98] tracking-[-0.045em] text-balance">
              <Mots texte="Gelez l'argent volé" />
              <br />
              <span className="relative inline-block whitespace-nowrap">
                <span
                  aria-hidden
                  className="surligne absolute inset-x-[-0.08em] bottom-[0.1em] top-[0.16em] origin-left rounded-[0.12em] bg-lime"
                />
                <span className="relative">
                  <Mots texte="avant le retrait." />
                </span>
              </span>
            </h1>
            <p className="apparait mx-auto mt-7 max-w-[40ch] text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-encre-2">
              La victime se plaint chez un opérateur, le compte mule est chez un
              autre. Nous croisons leurs réclamations et donnons l&apos;alerte
              en {num(preuves.delai.consortium)} minutes, pendant que
              l&apos;argent est encore là.
            </p>
            <div className="apparait mt-9 flex flex-wrap items-center justify-center gap-3">
              <BoutonDemo />
              <a
                href="#preuves"
                className="inline-flex h-[54px] items-center rounded-full px-6 font-semibold text-encre shadow-[inset_0_0_0_1.5px_rgba(15,23,18,.12)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_1.5px_rgba(15,23,18,.9)]"
              >
                Voir les résultats mesurés
              </a>
            </div>
            <p className="apparait mt-6 inline-flex items-center gap-2 text-sm text-gris">
              <ShieldCheck size={16} className="text-lime-texte" />
              Données synthétiques : {nombre(preuves.corpus)} réclamations, 3
              opérateurs fictifs.
            </p>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-[1120px]">
          <div
            className="scene relative overflow-hidden rounded-[40px] bg-brume shadow-[0_40px_80px_-40px_rgba(15,23,18,.35)]"
            style={{ aspectRatio: "1672 / 941" }}
          >
            <div className="scene-photo absolute inset-0 will-change-transform">
              <Image
                src="/visuels/hero-telephone.jpg"
                alt="Une cliente montre son téléphone : l'alerte de la campagne s'y affiche."
                fill
                preload
                sizes="(max-width: 1160px) 100vw, 1120px"
                className="object-cover"
              />
              <div
                className="absolute overflow-hidden"
                style={{ ...ECRAN, borderRadius: "11% / 5.2%" }}
              >
                <EcranTelephone />
              </div>
            </div>
          </div>

          <div
            className="carte absolute -left-3 top-[12%] hidden w-[330px] md:block lg:-left-14"
            data-vitesse="1.2"
          >
            <div className="carte-interieur rounded-[22px] bg-blanc p-5 shadow-[0_2px_6px_rgba(15,23,18,.06),0_30px_60px_-28px_rgba(15,23,18,.4)]">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alerte opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-alerte" />
                </span>
                Alerte consortium
                <span className="ml-auto rounded-full bg-alerte-fond px-2 py-0.5 font-donnee text-[11px] text-alerte">
                  {hhmm(casDemo.heureAlerte)}
                </span>
              </div>
              <p className="mt-2.5 font-titre text-[22px] font-bold tracking-[-0.03em]">
                Mule probable
              </p>
              <p className="text-sm text-encre-2">
                {casDemo.plaignants} plaignants · {casDemo.reseaux} réseaux ·
                détectée en {num(casDemo.delaiMin)} min
              </p>
              <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-brume">
                <div
                  className="h-full rounded-full bg-lime-vif"
                  style={{
                    width: `${(100 * casDemo.encoreSurLeCompte) / casDemo.totalFcfa}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 flex justify-between text-[12.5px] text-gris">
                <span>
                  <b className="tabular-nums text-encre">
                    {nombre(casDemo.encoreSurLeCompte)}
                  </b>{" "}
                  FCFA encore sur le compte
                </span>
                <span className="whitespace-nowrap tabular-nums">
                  / {nombre(casDemo.totalFcfa)}
                </span>
              </p>
            </div>
          </div>

          <div
            className="carte absolute -right-3 top-[58%] hidden md:block lg:-right-12"
            data-vitesse="0.7"
          >
            <div className="carte-interieur flex items-center gap-3 rounded-[22px] bg-blanc py-4 pl-4 pr-6 shadow-[0_2px_6px_rgba(15,23,18,.06),0_30px_60px_-28px_rgba(15,23,18,.4)]">
              <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-lime">
                <Hourglass size={20} strokeWidth={1.9} />
              </span>
              <span>
                <span className="block text-[12.5px] text-gris">
                  Remboursement, art. 35
                </span>
                <span className="block font-titre text-xl font-bold tracking-[-0.02em]">
                  J+3 ouvrés
                </span>
              </span>
            </div>
          </div>

          <div
            className="carte absolute -right-3 top-[8%] hidden md:block lg:-right-16"
            data-vitesse="1.6"
          >
            <div className="carte-interieur flex items-center gap-3.5 rounded-full bg-blanc py-2.5 pl-2.5 pr-5 shadow-[0_2px_6px_rgba(15,23,18,.06),0_30px_60px_-28px_rgba(15,23,18,.4)]">
              <span className="flex">
                {OPERATORS.map((o) => operatorColor[o]).map((c, i) => (
                  <span
                    key={c}
                    className="h-8 w-8 rounded-full border-[2.5px] border-white"
                    style={{ background: c, marginLeft: i ? -9 : 0 }}
                  />
                ))}
              </span>
              <span className="text-[13.5px] leading-tight">
                <b className="block text-[15px]">
                  {casDemo.reseaux} réseaux croisés
                </b>
                aucun numéro en clair
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
