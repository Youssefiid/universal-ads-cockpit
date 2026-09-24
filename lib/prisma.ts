import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export type Db = Omit<PrismaClient, "$connect" | "$disconnect" | "$transaction" | "$on" | "$use" | "$extends">;

/**
 * Deux connexions, comme dans ads-dashboard : DATABASE_URL (propriétaire, pour
 * les migrations et les scripts d'ingestion) et APP_DATABASE_URL (le rôle
 * applicatif, soumis aux politiques par ligne — voir scripts/security.sql).
 *
 * Sans cette séparation, l'application tournerait comme propriétaire de la
 * base : un rôle qui peut être superutilisateur sur certaines bases gérées,
 * et qui contourne alors les politiques par ligne quel que soit
 * `FORCE ROW LEVEL SECURITY`.
 */
function client(connectionString: string | undefined) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaApp?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? client(process.env.DATABASE_URL);
export const prismaApp =
  globalForPrisma.prismaApp ??
  client(process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaApp = prismaApp;
}
