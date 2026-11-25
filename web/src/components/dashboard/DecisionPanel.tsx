"use client";

import { useState } from "react";
import { useDecisions } from "./decisions";
import { IconCheck, IconSnow } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";

/** La décision humaine : rien ne se passe sans motif écrit et confirmation sur un aperçu. */
export default function DecisionPanel({ alertId, user, hostOperator, freezable }: { alertId: string; user: string; hostOperator: string; freezable: string }) {
  const { decisions, decide } = useDecisions();
  const existing = decisions[alertId];
  const [verdict, setVerdict] = useState<"SUSPENDRE" | "ECARTER" | null>(null);
  const [motive, setMotive] = useState("");
  const [confirming, setConfirming] = useState(false);
  const tooShort = motive.trim().length < 10;

  if (existing) {
    return (
      <div className="rounded-2xl border border-sage/40 bg-sage/10 p-5">
        <p className="flex items-center gap-2 font-medium text-sage-deep">
          <IconCheck size={18} /> Décision enregistrée dans l&apos;audit
        </p>
        <p className="mt-2 text-sm text-ink">
          {existing.verdict === "SUSPENDRE" ? "Suspension temporaire des retraits recommandée à " + hostOperator : "Alerte écartée"} par {existing.by},{" "}
          {new Date(existing.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}.
        </p>
        <p className="mt-1 text-sm text-slate">Motif : « {existing.motive} »</p>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] bg-white shadow-[0_10px_34px_-24px_rgba(11,27,75,0.45)] p-5">
      <h3 className="font-medium text-ink">Votre décision</h3>
      <p className="mt-1 text-sm text-slate">{BRAND.name} ne gèle rien. Le compte est chez {hostOperator} : c&apos;est à eux de suspendre.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Décision">
        <button
          type="button"
          role="radio"
          aria-checked={verdict === "SUSPENDRE"}
          onClick={() => setVerdict("SUSPENDRE")}
          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${verdict === "SUSPENDRE" ? "border-laterite bg-laterite/10" : "border-paper-line hover:border-ink"}`}
        >
          <span className="flex items-center gap-2 font-medium text-ink">
            <IconSnow size={16} className="text-laterite-deep" /> Recommander la suspension
          </span>
          <span className="mt-1 block text-xs text-slate">Notifier {hostOperator}, {freezable} encore gelables</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={verdict === "ECARTER"}
          onClick={() => setVerdict("ECARTER")}
          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${verdict === "ECARTER" ? "border-ink bg-paper-3" : "border-paper-line hover:border-ink"}`}
        >
          <span className="font-medium text-ink">Écarter l&apos;alerte</span>
          <span className="mt-1 block text-xs text-slate">Faux positif : facturier, tontine, erreur groupée</span>
        </button>
      </div>
      {verdict && (
        <div className="mt-4">
          <label htmlFor="motive" className="text-sm font-medium text-ink">
            Motif, inscrit dans l&apos;audit
          </label>
          <textarea
            id="motive"
            value={motive}
            onChange={(e) => {
              setMotive(e.target.value);
              setConfirming(false);
            }}
            rows={3}
            placeholder={verdict === "SUSPENDRE" ? "Ex. : 7 victimes sur 3 réseaux en 12 min, même récit de faux dépôt." : "Ex. : compte de facturier connu, plaintes pour retard de service."}
            className="mt-2 w-full rounded-xl border border-paper-line bg-paper px-3 py-2 text-sm outline-none focus:border-indigo-deep"
          />
          {tooShort && motive.length > 0 && <p className="mt-1 text-xs text-laterite-deep">10 caractères au moins : le motif est la trace de votre raisonnement.</p>}
          {!confirming ? (
            <button
              type="button"
              disabled={tooShort}
              onClick={() => setConfirming(true)}
              className="mt-3 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink-3 disabled:opacity-40"
            >
              Vérifier avant d&apos;enregistrer
            </button>
          ) : (
            <div className="mt-3 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm">
              <p className="text-ink">
                Vous allez enregistrer : <strong>{verdict === "SUSPENDRE" ? `recommandation de suspension transmise à ${hostOperator}` : "alerte écartée"}</strong>, signée {user}.
                Cette entrée d&apos;audit ne se modifie pas.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => decide({ alertId, verdict, motive: motive.trim(), by: user, at: new Date().toISOString() })}
                  className="rounded-full bg-laterite px-5 py-2 font-medium text-paper-2 hover:bg-laterite-deep"
                >
                  Confirmer et signer
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-paper-line px-5 py-2 text-ink hover:border-ink">
                  Modifier
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
