#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Même raison qu'ads-dashboard : Render ne fournit qu'une seule chaîne de
# connexion (le propriétaire de la base, utilisé pour les migrations).
# Sans APP_DATABASE_URL, lib/prisma.ts y retomberait et l'application
# tournerait avec les droits complets du propriétaire au lieu du rôle
# applicatif limité (app_rw) créé par scripts/apply-security.ts.
if [ -z "${APP_DATABASE_URL:-}" ] && [ -n "${APP_DB_PASSWORD:-}" ]; then
  export APP_DATABASE_URL="$(node -e '
    const u = new URL(process.env.DATABASE_URL);
    u.username = "app_rw";
    u.password = process.env.APP_DB_PASSWORD;
    process.stdout.write(u.toString());
  ')"
fi

exec npm run start
