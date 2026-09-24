import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * SHADOW_DATABASE_URL n'existe qu'en local (npx prisma migrate dev). En
 * production, seul `migrate deploy` tourne, qui n'a jamais besoin d'une
 * base fantôme — env() de Prisma lève une erreur si la variable est
 * totalement absente, donc on ne l'inclut que quand elle existe.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
    ...(process.env.SHADOW_DATABASE_URL ? { shadowDatabaseUrl: env("SHADOW_DATABASE_URL") } : {}),
  },
});
