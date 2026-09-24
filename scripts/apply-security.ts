import "dotenv/config";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * Pose le rôle applicatif sans jamais écrire son mot de passe en clair dans
 * un fichier suivi par Git. Même mécanisme qu'ads-dashboard.
 */
const echapper = (s: string) => s.replaceAll("'", "''");
const motDePasseAppRw = process.env.APP_DB_PASSWORD ?? "app_rw";

const sql = readFileSync("scripts/security.sql", "utf8").replaceAll(
  "__APP_RW_PASSWORD__",
  echapper(motDePasseAppRw),
);

execFileSync("npx", ["prisma", "db", "execute", "--stdin"], {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
});
