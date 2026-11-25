"use client";
// Résultats face à la référence (opérateur seul), sur le même corpus synthétique.
import Image from "next/image";
import { useRef } from "react";
import { Cpu } from "lucide-react";
import { nombre, preuves } from "@/lib/accueil";
import { num, pct } from "@/lib/data";
import { AVEC_MOUVEMENT, gsap, useGSAP } from "./mouvement";

function Compteur({ valeur, decimales = 0 }: { valeur: number | null; decimales?: number }) {
  if (valeur == null) return <span>—</span>;
  return (
    <span className="compteur tabular-nums" data-valeur={valeur} data-decimales={decimales}>
      {decimales ? num(valeur, decimales) : nombre(valeur)}
    </span>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <li className="flex justify-between gap-4 border-b border-encre/8 pb-3 text-[15px] last:border-0">
      <span className="text-encre-2">{libelle}</span>
      <b className="font-semibold tabular-nums">{valeur}</b>
    </li>
  );
}

export default function Preuves() {
  const racine = useRef<HTMLElement>(null);
  const { gelables, delai, campagnes, precision, ia } = preuves;

  useGSAP(
    () => {
      gsap.matchMedia().add(AVEC_MOUVEMENT, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: ".bento", start: "top 72%" }, defaults: { ease: "expo.out" } });
        tl.from(".preuves-titre > *", { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1 })
          .from(".tuile", { y: 90, autoAlpha: 0, scale: 0.96, duration: 1.3, stagger: 0.09 }, "-=0.8");
        gsap.utils.toArray<HTMLElement>(".compteur").forEach((el) => {
          const cible = Number(el.dataset.valeur);
          const dec = Number(el.dataset.decimales);
          const o = { v: 0 };
          tl.to(o, { v: cible, duration: 1.8, ease: "power3.out", onUpdate: () => (el.textContent = dec ? num(o.v, dec) : nombre(Math.round(o.v))) }, 0.5);
        });
        tl.from(".objet-tuile", { y: 40, rotate: -14, scale: 0.7, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: "back.out(1.5)" }, 0.9);
        gsap.fromTo(".billets", { y: 60, rotate: -8 }, { y: -40, rotate: 6, ease: "none", scrollTrigger: { trigger: ".bento", start: "top bottom", end: "bottom top", scrub: 0.8 } });
      });
    },
    { scope: racine },
  );

  return (
    <section ref={racine} id="preuves" data-fond="#F7F9F4" className="scroll-mt-24 px-4 py-28">
      <div className="mx-auto max-w-[1240px]">
        <div className="preuves-titre flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-[14ch] font-titre text-[clamp(2.4rem,4.6vw,3.9rem)] font-bold leading-[1] tracking-[-0.04em]">Mesuré contre la situation actuelle.</h2>
          <p className="max-w-[40ch] text-lg text-encre-2">Même règle, même corpus. Seule différence : l&apos;opérateur seul ne voit pas les autres réseaux.</p>
        </div>

        <div className="bento mt-12 grid grid-cols-1 gap-4 md:grid-cols-12">
          <article className="tuile relative overflow-hidden rounded-[36px] bg-lime p-8 md:col-span-7 md:row-span-2 md:p-10">
            <h3 className="text-[15px] font-semibold text-encre/80">FCFA encore gelables au moment de l&apos;alerte</h3>
            <p className="mt-4 font-titre text-[clamp(3.6rem,8vw,7rem)] font-bold leading-[0.95] tracking-[-0.05em]">
              <Compteur valeur={gelables.consortium} />
              <span className="ml-2 text-[0.3em] tracking-[-0.01em]">FCFA</span>
            </p>
            <p className="mt-4 max-w-[30ch] text-[15.5px] text-encre/80">
              contre <b className="tabular-nums">{nombre(gelables.seul)} FCFA</b> pour l&apos;opérateur seul, sur {campagnes.injectees} campagnes.
            </p>
            <Image src="/visuels/objet-billets.png" alt="" width={900} height={900} sizes="300px" className="billets pointer-events-none mt-6 ml-auto block w-[58%] max-w-[300px] drop-shadow-[0_30px_30px_rgba(15,23,18,.25)] md:absolute md:bottom-6 md:right-8 md:mt-0 md:w-[42%]" />
          </article>

          <article className="tuile rounded-[36px] bg-nuit p-8 text-white md:col-span-5">
            <h3 className="text-[15px] font-semibold text-white/70">Délai médian de détection</h3>
            <p className="mt-3 font-titre text-[clamp(3.4rem,6vw,5.2rem)] font-bold leading-none tracking-[-0.05em]">
              <Compteur valeur={delai.consortium} />
              <span className="ml-2 text-[0.32em] text-lime">min</span>
            </p>
            <p className="mt-3 text-[15px] text-white/70">
              contre <b className="tabular-nums text-white">{num(delai.seul)} min</b> pour l&apos;opérateur seul
            </p>
          </article>

          <article className="tuile rounded-[36px] bg-blanc p-8 shadow-[inset_0_0_0_1px_rgba(15,23,18,.07)] md:col-span-5">
            <h3 className="text-[15px] font-semibold text-encre-2">Campagnes de mules détectées</h3>
            <p className="mt-3 font-titre text-[clamp(3.4rem,6vw,5.2rem)] font-bold leading-none tracking-[-0.05em]">
              <Compteur valeur={campagnes.consortium} />/{campagnes.injectees}
            </p>
            <p className="mt-3 text-[15px] text-encre-2">
              contre <b className="tabular-nums text-encre">{campagnes.seul}/{campagnes.injectees}</b> pour l&apos;opérateur seul
            </p>
          </article>

          <article className="tuile relative rounded-[36px] bg-blanc p-8 shadow-[inset_0_0_0_1px_rgba(15,23,18,.07)] md:col-span-6">
            <Image src="/visuels/objet-puce-gpu.png" alt="" width={900} height={900} sizes="130px" className="objet-tuile pointer-events-none absolute -right-3 -top-8 w-[130px] drop-shadow-[0_20px_20px_rgba(15,23,18,.22)]" />
            <h3 className="flex flex-wrap items-center gap-2.5 pr-28 text-[15px] font-semibold text-encre-2">
              <Cpu size={18} strokeWidth={1.8} className="text-lime-texte" /> Lecture des plaintes par IA
              {ia.gpu && <span className="rounded-full bg-brume px-2.5 py-0.5 font-donnee text-[11px] text-encre-2">{ia.gpu}</span>}
            </h3>
            <ul className="mt-5 grid gap-3">
              <Ligne libelle="Modèle local" valeur={ia.modele || "—"} />
              <Ligne libelle="Débit mesuré" valeur={ia.debit ? `${num(ia.debit, 2)} réclamations/s` : "non mesuré"} />
              <Ligne libelle="F1 sur le montant" valeur={ia.f1Montant ? num(ia.f1Montant, 3) : "non mesuré"} />
              <Ligne libelle="Coût pour 1 000 réclamations" valeur={ia.coutPour1000 ? `${num(ia.coutPour1000, 2)} FCFA` : "non calculé"} />
            </ul>
          </article>

          <article className="tuile relative rounded-[36px] bg-blanc p-8 shadow-[inset_0_0_0_1px_rgba(15,23,18,.07)] md:col-span-6">
            <Image src="/visuels/objet-cible.png" alt="" width={900} height={900} sizes="118px" className="objet-tuile pointer-events-none absolute -right-2 -top-8 w-[118px] drop-shadow-[0_20px_20px_rgba(15,23,18,.22)]" />
            <h3 className="pr-28 text-[15px] font-semibold text-encre-2">Précision des alertes</h3>
            <ul className="mt-5 grid gap-3">
              <Ligne libelle="Règle brute 3 · 2 · 60" valeur={pct(precision.brute)} />
              <Ligne libelle="Après score de priorité" valeur={pct(precision.apresScore)} />
              <Ligne libelle="Opérateur seul" valeur={pct(precision.seul)} />
              <Ligne libelle="Décision finale" valeur="humaine, tracée" />
            </ul>
          </article>
        </div>
        <p className="mt-5 text-[13px] text-gris">
          Corpus synthétique de {nombre(preuves.corpus)} réclamations et {campagnes.injectees} campagnes : l&apos;incertitude reste large. Générateur et vérité terrain publiés.
        </p>
      </div>
    </section>
  );
}
