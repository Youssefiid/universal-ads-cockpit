import type { Platform } from "./types";
import type { Db } from "./prisma";

/**
 * Client HTTP réel vers Supermetrics, porté d'ads-dashboard.
 *
 * Remplace `triggerSupermetricsSync` de la version précédente, qui attendait
 * 800 ms puis tirait un nombre au hasard entre 120 et 420 comme "lignes
 * synchronisées" — en le faisant passer pour une synchronisation réussie à
 * chaque appel. Ici, c'est un appel réel à `GET
 * https://api.supermetrics.com/query/accounts`, documenté sur
 * docs.supermetrics.com/apidocs (authentification `Authorization: Bearer`,
 * portée `ds_accounts_read`).
 *
 * Ce module liste les comptes réellement accessibles à une clé — il ne
 * synchronise aucune donnée de campagne. Aucune ingestion automatique n'est
 * branchée dans ce cockpit, dans ads-dashboard non plus : l'import se fait
 * par fichier (voir /supermetrics, l'écran d'import).
 */

const BASE_URL = "https://api.supermetrics.com";

const SUPERMETRICS_DS_ID: Record<Platform, string> = {
  google: "AW",
  meta: "FA",
  tiktok: "TIK",
  linkedin: "LIA",
};

export type CompteSupermetrics = { id: string; name: string; group: string | null };

export class ErreurSupermetrics extends Error {
  constructor(
    public statut: number,
    message: string,
  ) {
    super(message);
    this.name = "ErreurSupermetrics";
  }
}

export async function listerComptesSupermetrics(
  cle: string,
  platform: Platform,
): Promise<CompteSupermetrics[]> {
  const dsId = SUPERMETRICS_DS_ID[platform];
  const url = new URL("/query/accounts", BASE_URL);
  url.searchParams.set("ds_id", dsId);

  let reponse: Response;
  try {
    reponse = await fetch(url, {
      headers: { Authorization: `Bearer ${cle}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    throw new ErreurSupermetrics(
      0,
      `Supermetrics n'a pas pu être joint (${e instanceof Error ? e.message : "erreur inconnue"}).`,
    );
  }

  if (reponse.status === 401 || reponse.status === 403) {
    throw new ErreurSupermetrics(
      401,
      "Clé Supermetrics refusée. Vérifiez qu'elle porte la portée « ds_accounts_read ».",
    );
  }
  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => "");
    throw new ErreurSupermetrics(502, `Supermetrics a renvoyé une erreur (${reponse.status}). ${detail.slice(0, 200)}`);
  }

  const corps = (await reponse.json().catch(() => null)) as {
    data?: { accounts?: { account_id: string; account_name: string; group_name?: string | null }[] }[];
  } | null;

  const comptes = (corps?.data ?? []).flatMap((d) => d.accounts ?? []);
  return comptes
    .filter((c) => c.account_id && c.account_name)
    .map((c) => ({ id: c.account_id, name: c.account_name, group: c.group_name ?? null }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Récupère la clé Supermetrics de l'agence, si une a été enregistrée. */
export async function cleSupermetrics(db: Db) {
  const row = await db.connectorCredential.findUnique({ where: { provider: "supermetrics" } });
  return row?.secret ?? null;
}
