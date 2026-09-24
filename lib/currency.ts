import type { Db } from "./prisma";

/**
 * Devise de reporting agence. Chaque client garde sa propre devise de
 * facturation (EUR, USD...) affichée sur sa fiche ; seuls les cumuls
 * multi-clients (Cockpit Overview) ont besoin d'une devise commune pour
 * additionner des montants qui, sinon, ne le sont pas (10 000 $ + 10 000 €
 * n'est pas 20 000 de quoi que ce soit).
 */
export const DEVISE_AGENCE = "MAD";

export type TauxParDevise = Map<string, number>;

export async function chargerTaux(db: Db): Promise<TauxParDevise> {
  const lignes = await db.exchangeRate.findMany();
  const taux: TauxParDevise = new Map(lignes.map((l) => [l.currency, Number(l.rateToMad)]));
  taux.set(DEVISE_AGENCE, 1);
  return taux;
}

/**
 * Jamais un taux inventé : une devise sans taux configuré renvoie null,
 * jamais 1 par défaut ni le montant tel quel réétiqueté MAD.
 */
export function convertirVersMad(montant: number, devise: string, taux: TauxParDevise): number | null {
  const t = taux.get(devise.toUpperCase());
  if (t === undefined) return null;
  return montant * t;
}
