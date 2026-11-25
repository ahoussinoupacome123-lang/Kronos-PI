"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDecisions } from "@/components/dashboard/decisions";
import { IconClose, IconGraph, IconSend } from "@/components/ui/icons";

type Msg = { role: "user" | "nexus"; text: string; links?: { href: string; label: string }[]; engine?: string };

const SUGGESTIONS: Record<string, string[]> = {
  "/tableau-de-bord": ["Par quoi je commence ?", "Quelles échéances approchent ?", "Rejoue le cas d'Aïcha"],
  "/tableau-de-bord/alertes": ["Comment marche la règle 3 · 2 · 60 ?", "Et si on gèle un innocent ?", "Par quoi je commence ?"],
  "/tableau-de-bord/dossiers": ["Quelles échéances approchent ?", "Que dit l'article 35 ?", "Par quoi je commence ?"],
  "/tableau-de-bord/incidents": ["Que montre le radar ?", "Par quoi je commence ?"],
  "/tableau-de-bord/preuves": ["Que valent nos résultats face à l'opérateur seul ?", "Le GPU a-t-il vraiment servi ?"],
  "/tableau-de-bord/audit": ["Qu'est-ce qui quitte mon établissement ?", "Et si on gèle un innocent ?"],
};

export default function Nexus({ userName }: { userName: string }) {
  const path = usePathname();
  const { decisions } = useDecisions();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "nexus",
      text: `Bonjour ${userName}. Je suis Nexus : je relie les plaintes de chaque réseau à travers le graphe et je vous dis quoi traiter en premier. Je ne gèle rien ; je propose, vous décidez.`,
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const key = Object.keys(SUGGESTIONS)
    .sort((a, b) => b.length - a.length)
    .find((k) => path.startsWith(k));
  const chips = SUGGESTIONS[key ?? "/tableau-de-bord"];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/nexus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, decided: Object.keys(decisions) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setMsgs((m) => [...m, { role: "nexus", text: json.text, links: json.links, engine: json.engine }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "nexus", text: `Je n'ai pas pu répondre : ${(e as Error).message}. Réessayez dans un instant.` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="nexus-panel"
        className={`on-ink fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-ink py-2.5 pl-2.5 pr-5 text-cream shadow-[0_14px_40px_-12px_rgba(15,23,18,0.7)] transition-[transform,opacity] duration-300 hover:-translate-y-0.5 ${open ? "pointer-events-none translate-y-2 opacity-0" : ""}`}
      >
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-lime text-ink">
          <IconGraph size={18} />
          <span aria-hidden className="absolute inset-0 animate-[pulse-ring_2.4s_ease-out_infinite] rounded-full border border-lime" />
        </span>
        <span className="text-sm font-medium">Demander à Nexus</span>
        <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-mist sm:inline">Ctrl K</kbd>
      </button>

      <aside
        id="nexus-panel"
        aria-label="Assistant Nexus"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[26rem] flex-col border-l border-paper-line bg-paper-2 shadow-[-20px_0_60px_-30px_rgba(15,23,18,0.45)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <header className="on-ink flex items-center gap-3 bg-ink px-5 py-4 text-cream">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">
            <IconGraph size={20} />
          </span>
          <div className="flex-1">
            <p className="font-display text-lg font-semibold tracking-[-0.01em]">Nexus</p>
            <p className="text-xs text-mist">Relie les réseaux par le graphe. Répond à partir des mesures.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer Nexus" className="rounded-full p-2 text-mist hover:bg-white/10 hover:text-cream">
            <IconClose size={18} />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed ${m.role === "user" ? "bg-ink text-cream" : "bg-paper-3/70 text-ink"}`}>
                <p>{m.text}</p>
                {m.links && m.links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.links.map((l) => (
                      <Link
                        key={l.href + l.label}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-paper-line bg-paper-2 px-3 py-1 text-xs font-medium text-ink hover:border-ink"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
                {m.engine && <p className="mt-2 text-[11px] text-slate">{m.engine === "llm" ? "Rédigé par le modèle local, vérifié sur les mesures" : "Réponse ancrée sur les résultats du pipeline"}</p>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-slate" role="status">
              <span className="h-2 w-2 animate-pulse rounded-full bg-laterite" /> Nexus parcourt le graphe…
            </div>
          )}
        </div>

        <div className="border-t border-paper-line px-5 pb-5 pt-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => ask(c)}
                disabled={busy}
                className="rounded-full border border-paper-line px-3 py-1.5 text-xs text-ink transition-colors hover:border-ink disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-end gap-2 rounded-2xl border border-paper-line bg-paper p-2 focus-within:border-indigo-deep"
          >
            <label htmlFor="nexus-input" className="sr-only">
              Votre question à Nexus
            </label>
            <textarea
              id="nexus-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Posez une question sur une alerte, un délai…"
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-slate/70"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Envoyer" className="grid h-9 w-9 place-items-center rounded-xl bg-laterite text-paper-2 transition-opacity disabled:opacity-40">
              <IconSend size={16} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
