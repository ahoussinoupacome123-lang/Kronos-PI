"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "./actions";
import { IconArrowRight, IconLock } from "@/components/ui/icons";

export default function LoginForm({ suite }: { suite: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="suite" value={suite} />
      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Adresse professionnelle
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          placeholder="prenom.nom@etablissement.com"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className="mt-2 block w-full rounded-xl border border-paper-line bg-paper-2 px-4 py-3 text-ink outline-none transition-[border-color,box-shadow] placeholder:text-slate/70 focus:border-indigo-deep focus:shadow-[0_0_0_4px_rgba(30,43,37,0.12)]"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Mot de passe
          </label>
          <button type="button" onClick={() => setShow((s) => !s)} className="text-xs text-slate underline hover:text-ink">
            {show ? "Masquer" : "Afficher"}
          </button>
        </div>
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.error)}
          className="mt-2 block w-full rounded-xl border border-paper-line bg-paper-2 px-4 py-3 text-ink outline-none transition-[border-color,box-shadow] focus:border-indigo-deep focus:shadow-[0_0_0_4px_rgba(30,43,37,0.12)]"
        />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="rounded-xl border border-laterite/30 bg-laterite/10 px-4 py-3 text-sm text-laterite-deep">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 font-medium text-cream transition-[background-color,opacity] hover:bg-ink-3 disabled:opacity-60"
      >
        {pending ? "Vérification…" : "Se connecter"}
        {!pending && <IconArrowRight size={18} />}
      </button>
      <p className="flex items-center gap-2 text-xs text-slate">
        <IconLock size={14} /> Session chiffrée de 8 heures, aucun traceur publicitaire.
      </p>
    </form>
  );
}
