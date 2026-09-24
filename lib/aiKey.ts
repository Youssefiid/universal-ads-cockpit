import { prismaApp } from "./prisma";

/**
 * Clé personnelle d'abord (Profil), clé d'agence en repli (Connecteurs) —
 * même règle partout où un fournisseur IA est appelé pour le compte d'un
 * utilisateur (Copilot, suggestion de mapping d'import).
 */
export async function resoudreCleAnthropic(userId: string): Promise<{ secret: string; source: "personnelle" | "agence" } | null> {
  const personnelle = await prismaApp.userConnectorCredential.findUnique({
    where: { userId_provider: { userId, provider: "anthropic" } },
  });
  if (personnelle) return { secret: personnelle.secret, source: "personnelle" };

  const agence = await prismaApp.connectorCredential.findUnique({ where: { provider: "anthropic" } });
  if (agence) return { secret: agence.secret, source: "agence" };

  return null;
}
