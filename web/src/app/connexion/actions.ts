"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, findAccount, verifyPassword } from "@/lib/auth";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

export type LoginState = { error?: string; email?: string };

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/tableau-de-bord") ? s : "/tableau-de-bord";
}

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Saisissez votre adresse et votre mot de passe.", email };
  const account = findAccount(email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return { error: "Adresse ou mot de passe incorrect. Vérifiez la saisie, ou entrez avec un compte de démonstration.", email };
  }
  await createSession(account);
  redirect(safeNext(form.get("suite")));
}

export async function loginAsDemo(form: FormData) {
  const email = String(form.get("email") ?? "");
  const account = DEMO_ACCOUNTS.find((a) => a.email === email) ?? DEMO_ACCOUNTS[0];
  await createSession(account);
  redirect(safeNext(form.get("suite")));
}

export async function logout() {
  await destroySession();
  redirect("/connexion");
}
