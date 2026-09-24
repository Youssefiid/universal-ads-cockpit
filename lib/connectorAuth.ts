import { timingSafeEqual } from "crypto";
import { getSession } from "./access";

/**
 * Jeton dédié pour les appels serveur à serveur (flux Looker Studio, agents
 * MCP externes) qui n'ont pas de session de navigateur. Sans
 * CONNECTOR_API_KEY configuré, la fonction refuse plutôt que d'exposer les
 * métriques réelles des clients sans aucun contrôle.
 */
export function jetonConnecteurValide(request: Request): boolean {
  const attendu = process.env.CONNECTOR_API_KEY;
  if (!attendu) return false;

  const header = request.headers.get("authorization") ?? "";
  const fourni = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!fourni) return false;

  const bufAttendu = Buffer.from(attendu);
  const bufFourni = Buffer.from(fourni);
  if (bufAttendu.length !== bufFourni.length) return false;

  return timingSafeEqual(bufAttendu, bufFourni);
}

/**
 * Autorise soit une session cockpit valide (le testeur intégré à /mcp,
 * appelé depuis le navigateur d'un utilisateur déjà connecté), soit le
 * jeton connecteur (un agent MCP externe, sans cookie de session).
 */
export async function autoriseAppelMcpHttp(request: Request): Promise<boolean> {
  if (jetonConnecteurValide(request)) return true;
  const session = await getSession();
  return session !== null;
}
