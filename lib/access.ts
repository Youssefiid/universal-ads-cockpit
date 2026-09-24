import { cookies } from "next/headers";
import { prismaApp } from "./prisma";
import { readSessionToken, SESSION_COOKIE } from "./auth";

export type Session = {
  userId: string;
  role: "admin" | "member";
};

/**
 * Le rôle est relu en base à chaque requête, jamais fait confiance depuis le
 * cookie : un compte désactivé ou rétrogradé perd l'accès dès la requête
 * suivante, pas à l'expiration du jeton signé.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const parsed = readSessionToken(token);
  if (!parsed) return null;

  const user = await prismaApp.user.findUnique({ where: { id: parsed.userId } });
  if (!user || user.deactivatedAt) return null;

  return { userId: user.id, role: user.role };
}
