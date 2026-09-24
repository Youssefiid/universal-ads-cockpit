import { randomBytes, scrypt, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";

/**
 * Mots de passe et sessions, sans dépendance externe.
 *
 * scrypt (natif à Node, pas de binding compilé comme bcrypt) pour le hachage,
 * une signature HMAC pour le jeton de session posé en cookie. Le jeton ne
 * contient que l'identifiant et la date d'émission : le rôle et le type de
 * compte sont relus en base à chaque requête, jamais fait confiance depuis le
 * cookie, pour qu'un changement de rôle ou une suppression de compte prenne
 * effet immédiatement plutôt qu'à l'expiration du jeton.
 */

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;

  // Une longueur différente ferait échouer timingSafeEqual : on l'écarte
  // avant, pas en laissant l'exception remonter comme un mot de passe invalide.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/** Un mot de passe trop court se devine par force brute en un temps négligeable. */
export function motDePasseAssezFort(password: string): boolean {
  return password.length >= 10;
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error(
      "SESSION_SECRET manquant : aucune session ne peut être signée sans lui.",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Math.floor(Date.now() / 1000)}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sign(payload)}`;
}

/**
 * Vérifie la signature puis l'expiration.
 *
 * L'ordre compte : un jeton falsifié doit être rejeté avant même de regarder
 * ce qu'il prétend contenir, pour qu'une horloge trafiquée dans le payload ne
 * serve jamais à contourner l'expiration.
 */
export function readSessionToken(token: string): { userId: string } | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = sign(Buffer.from(payloadB64, "base64url").toString("utf8"));
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const [userId, issuedAtRaw] = payload.split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!userId || !Number.isFinite(issuedAt)) return null;
  if (Date.now() / 1000 - issuedAt > SESSION_MAX_AGE_SECONDS) return null;

  return { userId };
}
