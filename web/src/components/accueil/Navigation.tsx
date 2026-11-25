"use client";
// Barre de navigation flottante : elle se rétracte quand on descend, revient quand on remonte.
import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { NOM_ACCENT, NOM_BASE } from "@/lib/nom";
import { SECTIONS_ACCUEIL } from "@/lib/sections";
import { gsap, ScrollTrigger, useGSAP } from "./mouvement";

const LIENS = SECTIONS_ACCUEIL.map((s) => ({ href: `#${s.id}`, label: s.label }));

export function Marque({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center font-titre text-[24px] font-extrabold tracking-[-0.04em] ${className}`}>
      {NOM_BASE}
      <span className="ml-[3px] inline-grid h-[30px] min-w-[30px] place-items-center rounded-[9px] px-1.5 bg-lime text-[22px] text-encre">{NOM_ACCENT}</span>
    </span>
  );
}

export default function Navigation() {
  const barre = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(barre.current, { y: -40, opacity: 0, duration: 1.1, ease: "expo.out", delay: 0.1 });
    ScrollTrigger.create({
      start: 120,
      end: "max",
      onUpdate: (st) => gsap.to(barre.current, { yPercent: st.direction === 1 ? -140 : 0, duration: 0.5, ease: "power3.out", overwrite: "auto" }),
    });
  });

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3.5 z-40 px-4">
      <div
        ref={barre}
        className="pointer-events-auto mx-auto flex h-16 max-w-[1240px] items-center justify-between rounded-full bg-blanc/85 pl-6 pr-2.5 shadow-[0_1px_2px_rgba(15,23,18,.05),0_10px_30px_-12px_rgba(15,23,18,.18)] backdrop-blur-xl"
      >
        <Link href="/" aria-label={`${BRAND.name}, accueil`}>
          <Marque />
        </Link>
        <nav aria-label="Navigation principale" className="hidden gap-8 text-[15px] font-medium text-encre-2 lg:flex">
          {LIENS.map((l) => (
            <a key={l.href} href={l.href} className="relative transition-colors hover:text-encre after:absolute after:inset-x-0 after:-bottom-1 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-lime-vif after:transition-transform after:duration-500 hover:after:scale-x-100">
              {l.label}
            </a>
          ))}
        </nav>
        <BoutonDemo compact />
      </div>
    </header>
  );
}

export function BoutonDemo({ compact = false, label = "Ouvrir la démo", href = "/connexion?demo=1" }: { compact?: boolean; label?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-full bg-nuit font-semibold text-white transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(15,23,18,.55)] active:translate-y-0 ${compact ? "h-[46px] pl-5 pr-[7px] text-[15px]" : "h-[54px] pl-6 pr-2 text-base"}`}
    >
      <span className={compact ? "max-sm:sr-only" : ""}>{label}</span>
      <span className={`grid place-items-center rounded-full bg-lime text-encre transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:rotate-45 ${compact ? "h-8 w-8" : "h-[38px] w-[38px]"}`}>
        <ArrowUpRight size={18} strokeWidth={2} />
      </span>
    </Link>
  );
}
