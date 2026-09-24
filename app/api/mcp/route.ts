import { NextResponse } from "next/server";
import { getCockpitOverview, getCrossChannelBreakdown, mockClients, mockAnomalies, getClientById } from "@/lib/store";
import { triggerSupermetricsSync } from "@/lib/supermetrics";

export const dynamic = "force-dynamic";

export async function GET() {
  // Return MCP server metadata and available tool schemas
  return NextResponse.json({
    name: "universal-ads-cockpit-mcp",
    version: "1.0.0",
    description: "Native MCP Server for Universal Ads Cockpit (Supermetrics, Looker Studio, Multi-Channel Ads)",
    tools: [
      {
        name: "get_cockpit_kpis",
        description: "Returns aggregated high-level KPIs across all clients and ad platforms (Spend, Revenue, ROAS, Conversions, Health).",
        inputSchema: {
          type: "object",
          properties: {
            clientId: { type: "string", description: "Optional client ID to filter by." }
          }
        }
      },
      {
        name: "get_cross_channel_metrics",
        description: "Returns spend, revenue, ROAS, and CPA broken down by advertising platform (Meta, Google, TikTok, LinkedIn).",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "detect_anomalies",
        description: "Audits campaigns for budget caps, surging CPAs, declining ROAS, or scaling opportunities.",
        inputSchema: {
          type: "object",
          properties: {
            minSeverity: { type: "string", enum: ["CRITICAL", "WARNING", "OPPORTUNITY"], description: "Minimum anomaly severity level." }
          }
        }
      },
      {
        name: "trigger_supermetrics_sync",
        description: "Triggers real-time ingestion from Supermetrics for one or all ad networks.",
        inputSchema: {
          type: "object",
          properties: {
            platform: { type: "string", enum: ["meta", "google", "tiktok", "linkedin"], description: "Specific platform to sync, or omit for all." }
          }
        }
      },
      {
        name: "generate_client_report",
        description: "Generates a structured executive performance report for a specific client.",
        inputSchema: {
          type: "object",
          properties: {
            clientId: { type: "string", description: "Target client ID (e.g. acme-ecom, lumina-beauty, techflow-saas, fitpulse-gym)." }
          },
          required: ["clientId"]
        }
      }
    ]
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, params } = body;

    // JSON-RPC style tool execution
    if (method === "tools/call" || body.tool) {
      const toolName = body.tool || (params && params.name);
      const args = body.arguments || (params && params.arguments) || {};

      switch (toolName) {
        case "get_cockpit_kpis": {
          if (args.clientId) {
            const client = getClientById(args.clientId);
            if (!client) {
              return NextResponse.json({ error: `Client '${args.clientId}' not found.` }, { status: 404 });
            }
            return NextResponse.json({
              content: [{ type: "text", text: JSON.stringify(client, null, 2) }]
            });
          }
          const overview = getCockpitOverview();
          return NextResponse.json({
            content: [{ type: "text", text: JSON.stringify(overview, null, 2) }]
          });
        }

        case "get_cross_channel_metrics": {
          const breakdown = getCrossChannelBreakdown();
          return NextResponse.json({
            content: [{ type: "text", text: JSON.stringify(breakdown, null, 2) }]
          });
        }

        case "detect_anomalies": {
          return NextResponse.json({
            content: [{ type: "text", text: JSON.stringify(mockAnomalies, null, 2) }]
          });
        }

        case "trigger_supermetrics_sync": {
          const syncResult = await triggerSupermetricsSync(args.platform);
          return NextResponse.json({
            content: [{ type: "text", text: JSON.stringify(syncResult, null, 2) }]
          });
        }

        case "generate_client_report": {
          const client = getClientById(args.clientId);
          if (!client) {
            return NextResponse.json({ error: `Client '${args.clientId}' not found.` }, { status: 404 });
          }

          const reportMarkdown = `# Rapport Exécutif de Performance · ${client.name}
**Catégorie** : ${client.category}
**Budget mensuel alloué** : ${client.monthlyBudget} €
**Budget engagé** : ${client.totalSpend} € (${((client.totalSpend / client.monthlyBudget) * 100).toFixed(0)}%)
**Chiffre d'affaires généré** : ${client.totalRevenue} €
**ROAS Global** : **${client.roas}x** (${client.deltaRoas >= 0 ? "+" : ""}${client.deltaRoas}%)
**Conversions totales** : ${client.totalConversions}
**Score de santé du compte** : ${client.healthScore}/100

## Détail des Campagnes par Régie
${client.campaigns.map((c) => `- **${c.name}** [${c.platform.toUpperCase()}] : Spend ${c.spend} €, Rev ${c.revenue} €, ROAS **${c.roas}x**, CPA ${c.cpa} € (Statut: ${c.status})`).join("\n")}

## Recommandations IA Copilot
- Maintenir l'allocation sur les formats les plus rentables.
- Synchronisé en temps réel avec Looker Studio et Supermetrics.
`;

          return NextResponse.json({
            content: [{ type: "text", text: reportMarkdown }]
          });
        }

        default:
          return NextResponse.json({ error: `Unknown tool: ${toolName}` }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid MCP request format" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "MCP execution failed", details: String(err) }, { status: 500 });
  }
}
