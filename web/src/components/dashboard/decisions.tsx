"use client";

// Décisions humaines prises pendant la démo (validation ou rejet d'une recommandation de gel).
// Prototype : conservées dans le navigateur (localStorage). En production : table d'audit chaînée côté serveur.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Decision = {
  alertId: string;
  verdict: "SUSPENDRE" | "ECARTER";
  motive: string;
  by: string;
  at: string;
};

type Ctx = {
  decisions: Record<string, Decision>;
  decide: (d: Decision) => void;
  reset: () => void;
};

const DecisionsContext = createContext<Ctx | null>(null);
const KEY = "rg-decisions-v1";

export function DecisionsProvider({ children }: { children: React.ReactNode }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local au montage
      if (raw) setDecisions(JSON.parse(raw));
    } catch {
      /* stockage indisponible : la démo continue sans mémoire */
    }
  }, []);

  const decide = useCallback((d: Decision) => {
    setDecisions((prev) => {
      const next = { ...prev, [d.alertId]: d };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setDecisions({});
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  const value = useMemo(() => ({ decisions, decide, reset }), [decisions, decide, reset]);
  return <DecisionsContext.Provider value={value}>{children}</DecisionsContext.Provider>;
}

export function useDecisions() {
  const ctx = useContext(DecisionsContext);
  if (!ctx) throw new Error("useDecisions hors de DecisionsProvider");
  return ctx;
}
