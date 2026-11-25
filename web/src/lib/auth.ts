// Session de démonstration : cookie httpOnly signé (HS256), aucun stockage serveur.
// Comptes : src/lib/demo-accounts.ts (comptes fictifs) + un compte personnel optionnel lu dans l'environnement.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { DEMO_ACCOUNTS, type DemoAccount } from "./demo-accounts";

export const SESSION_COOKIE = "rg_session";
const DEV_SECRET = "reclam-graph-dev-secret-a-remplacer-en-production-0001";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production" && process.env.VERCEL) {
    console.warn("AUTH_SECRET manquant : secret de développement utilisé (démo uniquement).");
  }
  return new TextEncoder().encode(s ?? DEV_SECRET);
}

export type Session = { sub: string; name: string; role: string; org: string };

function envAccount(): DemoAccount | null {
  const email = process.env.DEMO_USER_EMAIL;
  const hash = process.env.DEMO_USER_PASSWORD_HASH;
  if (!email || !hash) return null;
  return {
    email: email.toLowerCase(),
    passwordHash: hash,
    name: process.env.DEMO_USER_NAME ?? "Joachim",
    role: "Responsable litiges et fraude",
    org: "ALPHAMONEY (fictif)",
  };
}

export function allAccounts(): DemoAccount[] {
  const extra = envAccount();
  return extra ? [extra, ...DEMO_ACCOUNTS] : DEMO_ACCOUNTS;
}

/** Format du hachage : scrypt$<sel hex>$<hachage hex>. Générer avec `npm run hash -- "<mot de passe>"`. */
export function verifyPassword(password: string, stored: string) {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const got = scryptSync(password, Buffer.from(salt, "hex"), expected.length);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export function findAccount(email: string) {
  return allAccounts().find((a) => a.email === email.trim().toLowerCase()) ?? null;
}

export async function createSession(a: DemoAccount) {
  const token = await new SignJWT({ name: a.name, role: a.role, org: a.org })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(a.email)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function readSession(token?: string): Promise<Session | null> {
  const t = token ?? (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    return { sub: String(payload.sub), name: String(payload.name), role: String(payload.role), org: String(payload.org) };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
