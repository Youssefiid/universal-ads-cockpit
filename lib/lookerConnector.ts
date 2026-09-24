import { prismaApp } from "./prisma";
import { getAllClients, getCockpitOverview } from "./queries";
import { lookerFields } from "./lookerFields";

export { lookerFields };

/**
 * Le flux Looker Studio, sur les mêmes données mesurées que le reste du
 * cockpit. Auparavant, cette fonction reformatait `mockClients` — quatre
 * clients fictifs aux chiffres écrits à la main — en un flux JSON typé qui
 * se présentait comme un connecteur de données réel. Un tableau Looker
 * Studio branché dessus aurait affiché des chiffres inventés à qui les
 * présente à un vrai client.
 */
export async function getLookerStudioData() {
  const clients = await getAllClients(prismaApp);
  const { clients: _omises, ...overview } = await getCockpitOverview(prismaApp, clients);
  const rows: { values: (string | number)[] }[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const client of clients) {
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
      overview,
      documentation: "Looker Studio Community Connector JSON Feed — données mesurées, pas de simulation."
    }
  };
}
