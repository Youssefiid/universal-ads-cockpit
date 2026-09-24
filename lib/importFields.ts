/**
 * Séparé de lib/import.ts (qui importe papaparse/exceljs/fast-xml-parser,
 * tous Node-only) pour rester importable depuis un composant client — même
 * raison que lib/lookerFields.ts vs lib/lookerConnector.ts : importer quoi
 * que ce soit de lib/import.ts depuis "use client" entraînerait ces
 * dépendances serveur dans le bundle navigateur.
 */
export type LigneBrute = Record<string, string>;

export const CHAMPS_CIBLES = [
  "date",
  "campaignId",
  "campaignName",
  "impressions",
  "clicks",
  "cost",
  "conversions",
  "conversionValue",
  "currency",
  "ignore",
] as const;
export type ChampCible = (typeof CHAMPS_CIBLES)[number];

export type Mapping = Record<string, ChampCible>;

export const LIBELLE_CHAMP: Record<ChampCible, string> = {
  date: "Date",
  campaignId: "Identifiant de campagne",
  campaignName: "Nom de campagne",
  impressions: "Impressions",
  clicks: "Clics",
  cost: "Dépense",
  conversions: "Conversions",
  conversionValue: "Chiffre d'affaires",
  currency: "Devise",
  ignore: "Ignorer",
};
