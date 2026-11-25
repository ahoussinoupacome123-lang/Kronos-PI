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
    <aside className="on-ink sticky top-4 hidden h-[calc(100dvh-7.5rem)] w-[16.5rem] shrink-0 flex-col rounded-[28px] bg-ink px-4 py-6 text-cream shadow-[0_24px_60px_-30px_rgba(11,27,75,0.8)] lg:flex">
      <p className="px-3 text-[11px] font-bold tracking-[0.12em] text-mist">ESPACE ÉTABLISSEMENT</p>
      <nav aria-label="Espace établissement" className="mt-4 flex-1">
        <ul className="space-y-1">
          {items.map((it) => {
            const active = it.href === "/tableau-de-bord" ? path === it.href : path.startsWith(it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active ? "bg-white/12 font-semibold text-white" : "text-cream/75 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <span className={active ? "text-amber" : ""}>{it.icon}</span>
                  <span className="flex-1">{it.label}</span>
                  {it.badge ? (
                    <span className="rounded-full bg-laterite px-2 py-0.5 font-mono text-[11px] tabular-nums text-paper-2">{it.badge}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="rounded-2xl bg-white/6 p-3">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-mist">{user.role}</p>
        <p className="truncate text-xs text-mist">{user.org}</p>
        <form action={logout} className="mt-3">
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-mist transition-colors hover:bg-white/5 hover:text-cream">
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
    <nav aria-label="Espace établissement" className="mt-3 flex gap-1 overflow-x-auto rounded-2xl bg-white px-2 py-2 lg:hidden">
      {items.map(([href, label]) => {
        const active = href === "/tableau-de-bord" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-ink text-white" : "text-slate"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
