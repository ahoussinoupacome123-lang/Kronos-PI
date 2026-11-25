// Émetteurs de l'UEMOA que le consortium peut relier : logos officiels, présentés
// comme marché visé et jamais comme clients, ni à côté d'un chiffre de fraude.
import Image from "next/image";
import { Building2, Landmark } from "lucide-react";
import { BRAND } from "@/lib/brand";

const LOGOS = [
  { nom: "Orange Money", src: "Logo_Orange_Money.svg", w: 431, h: 115 },
  { nom: "Wave", src: "Wave_nav-logo.png", w: 230, h: 101 },
  { nom: "MTN MoMo", src: "MTN_2022_logo.svg", w: 1280, h: 640 },
  { nom: "Moov Money", src: "Moov_Money_Flooz.png", w: 512, h: 512 },
  { nom: "Mixx by Yas", src: "Yas_logo_2024.svg", w: 645, h: 571 },
  { nom: "Celtiis Cash", src: "Celtiis_logo-primary.svg", w: 45, h: 50 },
  { nom: "Coris Money", src: "Logo_Coris_Bank.svg", w: 600, h: 280 },
  { nom: "Wizall Money", src: "Wizall_logo.png", w: 819, h: 815 },
];

function Tuile({ nom, src, w, h, cache }: (typeof LOGOS)[number] & { cache?: boolean }) {
  return (
    <li aria-hidden={cache} className="flex h-[88px] w-[196px] shrink-0 items-center justify-center rounded-2xl bg-blanc px-7 shadow-[inset_0_0_0_1px_rgba(15,23,18,.07)] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1">
      <Image src={`/visuels/emetteurs/${src}`} alt={cache ? "" : nom} width={w} height={h} className="h-auto max-h-11 w-auto max-w-[132px] object-contain" />
    </li>
  );
}

export default function Emetteurs() {
  return (
    <section aria-labelledby="emetteurs-titre" data-fond="#F7F9F4" className="pb-28">
      <div className="mx-auto grid grid-cols-1 max-w-[1240px] items-center gap-8 px-6 md:grid-cols-[1fr_auto]">
        <div>
          <h2 id="emetteurs-titre" className="max-w-[24ch] font-titre text-[clamp(1.8rem,3vw,2.6rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            175 institutions connectées à <span className="whitespace-nowrap">PI-SPI</span>. Chacune ne lit que ses propres plaintes.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[15px] text-encre-2">
            Huit pays, un même système de paiement instantané. {BRAND.name} relie leurs émetteurs, sans qu&apos;aucune donnée brute ne circule.
          </p>
          <p className="mt-2 text-[13px] text-gris">Émetteurs de l&apos;UEMOA que {BRAND.name} peut relier : un marché visé, pas des clients.</p>
        </div>
        <Image src="/visuels/objet-carte-uemoa.png" alt="Carte des huit pays de l'UEMOA reliés entre eux." width={900} height={900} sizes="340px" className="flotte-css mx-auto w-[260px] drop-shadow-[0_30px_30px_rgba(15,23,18,.18)] md:w-[340px]" />
      </div>
      <div className="group mt-7 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
        <ul className="flex w-max animate-[defile_42s_linear_infinite] gap-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {LOGOS.map((l) => (
            <Tuile key={l.nom} {...l} />
          ))}
          {LOGOS.map((l) => (
            <Tuile key={`${l.nom}-bis`} {...l} cache />
          ))}
        </ul>
      </div>
      <div className="mx-auto mt-5 flex max-w-[1240px] flex-wrap gap-x-8 gap-y-2 px-6 text-[14px] text-encre-2">
        <span className="inline-flex items-center gap-2">
          <Landmark size={17} strokeWidth={1.8} className="text-lime-texte" /> Banques participant à PI-SPI
        </span>
        <span className="inline-flex items-center gap-2">
          <Building2 size={17} strokeWidth={1.8} className="text-lime-texte" /> Institutions de microfinance connectées
        </span>
      </div>
    </section>
  );
}
