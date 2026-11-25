"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChart, IconFile, IconGraph, IconHome, IconLogout, IconRadar, IconShield } from "@/components/ui/icons";
import { logout } from "@/app/connexion/actions";
import { useDecisions } from "./decisions";

type Item = { href: string; label: string; icon: React.ReactNode; badge?: number };

export default function Sidebar({ user, pendingPriority, dueSoon }: { user: { name: string; role: string; org: string }; pendingPriority: string[]; dueSoon: number }) {
  const path = usePathname();
  const { decisions } = useDecisions();
  const open = pendingPriority.filter((id) => !decisions[id]).length;

  const items: Item[] = [
    { href: "/tableau-de-bord", label: "Aujourd'hui", icon: <IconHome size={18} /> },
    { href: "/tableau-de-bord/alertes", label: "Alertes mules", icon: <IconGraph size={18} />, badge: open },
    { href: "/tableau-de-bord/dossiers", label: "Dossiers et délais", icon: <IconFile size={18} />, badge: dueSoon },
    { href: "/tableau-de-bord/incidents", label: "Radar d'incidents", icon: <IconRadar size={18} /> },
    { href: "/tableau-de-bord/preuves", label: "Preuves mesurées", icon: <IconChart size={18} /> },
    { href: "/tableau-de-bord/audit", label: "Piste d'audit", icon: <IconShield size={18} /> },
  ];

  return (
    <aside className="on-ink sticky top-[6.25rem] hidden h-[calc(100dvh-7.5rem)] w-[16.5rem] shrink-0 flex-col overflow-hidden rounded-[28px] bg-nuit px-4 py-6 text-white shadow-[0_30px_60px_-30px_rgba(15,23,18,.7)] lg:flex">
      <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-lime/20 blur-3xl" />
      <p className="relative px-3 font-donnee text-[10.5px] tracking-[0.2em] text-white/45">ESPACE ÉTABLISSEMENT</p>
      <nav aria-label="Espace établissement" className="relative mt-4 flex-1">
        <ul className="space-y-1">
          {items.map((it) => {
            const active = it.href === "/tableau-de-bord" ? path === it.href : path.startsWith(it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 ${
                    active ? "bg-lime font-semibold text-encre shadow-[0_10px_30px_-12px_rgba(200,240,74,.6)]" : "text-white/70 hover:translate-x-0.5 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${active ? "bg-encre text-lime" : "bg-white/[0.06] group-hover:text-lime"}`}>{it.icon}</span>
                  <span className="flex-1">{it.label}</span>
                  {it.badge ? (
                    <span className="rounded-full bg-alerte px-2 py-0.5 font-donnee text-[11px] tabular-nums text-white">{it.badge}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="relative rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/[0.06]">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-white/50">{user.role}</p>
        <p className="truncate text-xs text-white/50">{user.org}</p>
        <form action={logout} className="mt-3">
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-cream">
            <IconLogout size={15} /> Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = usePathname();
  const items = [
    ["/tableau-de-bord", "Aujourd'hui"],
    ["/tableau-de-bord/alertes", "Alertes"],
    ["/tableau-de-bord/dossiers", "Dossiers"],
    ["/tableau-de-bord/incidents", "Radar"],
    ["/tableau-de-bord/preuves", "Preuves"],
    ["/tableau-de-bord/audit", "Audit"],
  ];
  return (
    <nav aria-label="Espace établissement" className="mt-3 flex gap-1 overflow-x-auto rounded-2xl bg-blanc px-2 py-2 ring-1 ring-encre/[0.06] lg:hidden">
      {items.map(([href, label]) => {
        const active = href === "/tableau-de-bord" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-lime text-encre" : "text-gris"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
