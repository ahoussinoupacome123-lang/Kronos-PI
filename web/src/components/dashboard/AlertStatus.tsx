"use client";

import { useDecisions } from "./decisions";
import { Pill } from "./ui";

export default function AlertStatus({ alertId, priority }: { alertId: string; priority: boolean }) {
  const { decisions } = useDecisions();
  const d = decisions[alertId];
  if (d) return <Pill tone="sage">{d.verdict === "SUSPENDRE" ? "Suspension recommandée" : "Écartée"}</Pill>;
  return priority ? <Pill tone="laterite">Décision requise</Pill> : <Pill tone="indigo">À qualifier</Pill>;
}
