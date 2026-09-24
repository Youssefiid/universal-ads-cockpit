import { NextResponse } from "next/server";
import { prismaApp } from "@/lib/prisma";
import { getCockpitOverview, getCrossChannelBreakdown, getAnomalies, getClientById, getAllClients } from "@/lib/queries";
import { autoriseAppelMcpHttp } from "@/lib/connectorAuth";
import { libelleReseau } from "@/lib/networks";
import type { Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Serveur MCP, sur des outils qui font ce que leur description dit.
 *
 * `trigger_supermetrics_sync` promettait un « real-time ingestion from
 * Supermetrics » qu'aucune ligne de code ne réalisait — un agent qui lisait
 * cette description la tenait pour un fait. Il n'existe plus : ni ce cockpit
 * ni ads-dashboard n'ont d'ingestion automatique branchée, et un outil MCP
 * ne doit jamais annoncer une capacité que rien ne tient. À la place,
 * `list_supermetrics_accounts` fait ce qu'il annonce : lister les comptes
 * réellement visibles avec la clé enregistrée.
 */
export async function GET() {
  return NextResponse.json({
    name: "universal-ads-cockpit-mcp",
    version: "2.0.0",
    description: "Serveur MCP du Universal Ads Cockpit — lecture de métriques mesurées, aucune simulation.",
    tools: [
      {
        name: "get_cockpit_kpis",
        description: "Retourne les KPIs mesurés (dépense, CA, ROAS, conversions, score de santé), sur 30 jours glissants. Optionnellement filtré par client.",
        inputSchema: {
          type: "object",
          properties: { clientId: { type: "string", description: "Identifiant de client optionnel." } },
        },
      },
      {
        name: "get_cross_channel_metrics",
        description: "Retourne la répartition mesurée de la dépense, du CA et du ROAS par régie publicitaire.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "detect_anomalies",
        description: "Retourne les campagnes dont le ROAS mesuré sort des seuils surveillés (sous 1,5x ou au-dessus de 5x). Vide si aucune ne sort de ces bornes.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "list_supermetrics_accounts",
        description: "Liste les comptes publicitaires réellement visibles avec la clé Supermetrics de l'agence, pour une régie donnée. Ne synchronise aucune donnée.",
        inputSchema: {
          type: "object",
          properties: { platform: { type: "string", enum: ["meta", "google", "tiktok", "linkedin"] } },
          required: ["platform"],
        },
      },
      {
        name: "generate_client_report",
        description: "Génère un rapport Markdown à partir des métriques mesurées d'un client. N'affirme jamais de synchronisation ou de fraîcheur qui ne serait pas mesurée.",
        inputSchema: {
          type: "object",
          properties: { clientId: { type: "string" } },
          required: ["clientId"],
        },
      },
    ],
  });
}

export async function POST(request: Request) {
  if (!(await autoriseAppelMcpHttp(request))) {
    return NextResponse.json({ error: "Non autorisé : session cockpit ou jeton connecteur requis." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const toolName = body.tool || body.params?.name;
    const args = body.arguments || body.params?.arguments || {};

    switch (toolName) {
      case "get_cockpit_kpis": {
        if (args.clientId) {
          const client = await getClientById(prismaApp, args.clientId);
          if (!client) return NextResponse.json({ error: `Client '${args.clientId}' introuvable.` }, { status: 404 });
          return NextResponse.json({ content: [{ type: "text", text: JSON.stringify(client, null, 2) }] });
        }
        const overview = await getCockpitOverview(prismaApp);
        return NextResponse.json({ content: [{ type: "text", text: JSON.stringify(overview, null, 2) }] });
      }

      case "get_cross_channel_metrics": {
        const breakdown = await getCrossChannelBreakdown(prismaApp);
        return NextResponse.json({ content: [{ type: "text", text: JSON.stringify(breakdown, null, 2) }] });
      }

      case "detect_anomalies": {
        const anomalies = await getAnomalies(prismaApp);
        return NextResponse.json({ content: [{ type: "text", text: JSON.stringify(anomalies, null, 2) }] });
      }

      case "list_supermetrics_accounts": {
        const { cleSupermetrics, listerComptesSupermetrics, ErreurSupermetrics } = await import("@/lib/supermetrics");
        const cle = await cleSupermetrics(prismaApp);
        if (!cle) return NextResponse.json({ error: "Aucune clé Supermetrics enregistrée pour l'agence." }, { status: 404 });
        try {
          const comptes = await listerComptesSupermetrics(cle, args.platform as Platform);
          return NextResponse.json({ content: [{ type: "text", text: JSON.stringify(comptes, null, 2) }] });
        } catch (e) {
          const message = e instanceof ErreurSupermetrics ? e.message : String(e);
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }

      case "generate_client_report": {
        const client = await getClientById(prismaApp, args.clientId);
        if (!client) return NextResponse.json({ error: `Client '${args.clientId}' introuvable.` }, { status: 404 });

        const money = (v: number) => `${v.toLocaleString("fr-FR")} ${client.currency}`;
        const reportMarkdown = `# Rapport de Performance · ${client.name}
**Catégorie** : ${client.category}
**Budget mensuel** : ${money(client.monthlyBudget)}
**Dépense mesurée (30 derniers jours)** : ${money(client.totalSpend)}
**Chiffre d'affaires tracké** : ${money(client.totalRevenue)}
**ROAS** : **${client.roas}x**
**Conversions** : ${client.totalConversions}
**Score de santé** : ${client.healthScore}/100

## Campagnes mesurées
${
  client.campaigns.length
    ? client.campaigns
        .map((c) => {
          const reseau = libelleReseau(c.platform, c.network);
          const regie = reseau ? `${c.platform.toUpperCase()} · ${reseau}` : c.platform.toUpperCase();
          return `- **${c.name}** [${regie}] : ${money(c.spend)} dépensés, ${c.conversions} conversions, ROAS ${c.roas}x`;
        })
        .join("\n")
    : "Aucune campagne mesurée sur la période."
}

_Généré à partir des métriques importées, sans estimation ni donnée simulée._
`;
        return NextResponse.json({ content: [{ type: "text", text: reportMarkdown }] });
      }

      default:
        return NextResponse.json({ error: `Outil inconnu : ${toolName}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Échec d'exécution MCP", details: String(err) }, { status: 500 });
  }
}
