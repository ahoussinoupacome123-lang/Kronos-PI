// Usage : npm run hash -- "<mot de passe>"  ->  scrypt$<sel>$<hachage>
import { randomBytes, scryptSync } from "node:crypto";

const pw = process.argv[2];
if (!pw) {
  console.error('Usage : npm run hash -- "<mot de passe>"');
  process.exit(1);
}
const salt = randomBytes(16);
console.log(`scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 32).toString("hex")}`);
