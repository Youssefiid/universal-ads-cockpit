import { LookerSchemaField } from "./types";

/**
 * Le schéma seul, séparé de la lecture (lib/lookerConnector.ts) : ce fichier
 * ne touche pas Postgres et peut donc être importé par un composant client
 * (l'onglet « Schéma » de /looker) sans entraîner `pg` dans le bundle
 * navigateur.
 */
export const lookerFields: LookerSchemaField[] = [
  { name: "date", label: "Date", dataType: "STRING", semantics: { conceptType: "DIMENSION", semanticType: "YEAR_MONTH_DAY" } },
  { name: "clientId", label: "Client ID", dataType: "STRING", semantics: { conceptType: "DIMENSION" } },
  { name: "clientName", label: "Client Name", dataType: "STRING", semantics: { conceptType: "DIMENSION" } },
  { name: "category", label: "Category", dataType: "STRING", semantics: { conceptType: "DIMENSION" } },
  { name: "platform", label: "Ad Platform", dataType: "STRING", semantics: { conceptType: "DIMENSION" } },
  { name: "campaignName", label: "Campaign Name", dataType: "STRING", semantics: { conceptType: "DIMENSION" } },
  { name: "campaignStatus", label: "Status", dataType: "STRING", semantics: { conceptType: "DIMENSION" } },
  { name: "spend", label: "Spend (€)", dataType: "NUMBER", semantics: { conceptType: "METRIC", semanticType: "CURRENCY_EUR", isDouble: true } },
  { name: "revenue", label: "Revenue (€)", dataType: "NUMBER", semantics: { conceptType: "METRIC", semanticType: "CURRENCY_EUR", isDouble: true } },
  { name: "conversions", label: "Conversions", dataType: "NUMBER", semantics: { conceptType: "METRIC" } },
  { name: "impressions", label: "Impressions", dataType: "NUMBER", semantics: { conceptType: "METRIC" } },
  { name: "clicks", label: "Clicks", dataType: "NUMBER", semantics: { conceptType: "METRIC" } },
  { name: "roas", label: "ROAS (x)", dataType: "NUMBER", semantics: { conceptType: "METRIC", isDouble: true } },
  { name: "cpa", label: "CPA (€)", dataType: "NUMBER", semantics: { conceptType: "METRIC", semanticType: "CURRENCY_EUR", isDouble: true } },
  { name: "ctr", label: "CTR (%)", dataType: "NUMBER", semantics: { conceptType: "METRIC", semanticType: "PERCENT", isDouble: true } },
  { name: "cpc", label: "CPC (€)", dataType: "NUMBER", semantics: { conceptType: "METRIC", semanticType: "CURRENCY_EUR", isDouble: true } }
];
