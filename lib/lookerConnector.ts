import { mockClients, getCockpitOverview } from "./store";
import { LookerSchemaField } from "./types";

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

export function getLookerStudioData() {
  const rows: { values: (string | number)[] }[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const client of mockClients) {
    for (const campaign of client.campaigns) {
      rows.push({
        values: [
          today,
          client.id,
          client.name,
          client.category,
          campaign.platform.toUpperCase(),
          campaign.name,
          campaign.status,
          campaign.spend,
          campaign.revenue,
          campaign.conversions,
          campaign.impressions,
          campaign.clicks,
          campaign.roas,
          campaign.cpa,
          campaign.ctr,
          campaign.cpc
        ]
      });
    }
  }

  return {
    schema: lookerFields,
    rows,
    metadata: {
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      overview: getCockpitOverview(),
      documentation: "Direct Looker Studio Community Connector JSON Feed"
    }
  };
}
