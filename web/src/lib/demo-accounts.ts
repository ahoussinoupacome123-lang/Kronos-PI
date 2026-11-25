
// Comptes de démonstration FICTIFS, rattachés aux opérateurs fictifs du corpus synthétique.
// Mot de passe commun : voir .env.example (DEMO_PASSWORD_HINT). Seul le hachage scrypt figure ici.
// Un compte personnel supplémentaire s'ajoute sans être publié : DEMO_USER_EMAIL + DEMO_USER_PASSWORD_HASH dans .env.local.
import { BRAND } from "@/lib/brand";

export type DemoAccount = { email: string; passwordHash: string; name: string; role: string; org: string };

const DEMO_HASH =
  "scrypt$9d8349437296f31b9256f8ac4ded9cae$bbea5835013a7ba5bfae0caf7e105f3c88f5fae42308183fd2d3b255cf17f574";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "litiges@alphamoney.demo", passwordHash: DEMO_HASH, name: "Aminata Diallo", role: "Responsable litiges et fraude", org: "ALPHAMONEY (fictif)" },
  { email: "analyste@betacash.demo", passwordHash: DEMO_HASH, name: "Koffi Mensah", role: "Analyste fraude", org: "BETACASH (fictif)" },
  { email: "agent@gammapay.demo", passwordHash: DEMO_HASH, name: "Rachida Sow", role: "Agent centre de contact", org: "GAMMAPAY (fictif)" },
  { email: "supervision@hub.demo", passwordHash: DEMO_HASH, name: "Équipe hub", role: "Supervision consortium", org: `Hub ${BRAND.name}` },
];

export const DEMO_PASSWORD = "Demo-Reclam-2026";
