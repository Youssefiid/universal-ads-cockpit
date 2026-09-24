import * as readline from "readline";
import "dotenv/config";
import { prismaApp } from "../lib/prisma";
import { getCockpitOverview, getCrossChannelBreakdown, getAnomalies, getClientById } from "../lib/queries";
import { cleSupermetrics, listerComptesSupermetrics, ErreurSupermetrics } from "../lib/supermetrics";
import type { Platform } from "../lib/types";

/**
 * Serveur MCP stdio, aligné sur app/api/mcp/route.ts — les deux exposaient
 * auparavant des listes d'outils différentes (4 ici, 5 côté HTTP, dont un
 * `generate_client_report` que ce fichier n'avait jamais reçu). Les deux
 * appellent maintenant exactement les mêmes fonctions réelles.
 */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

function sendResponse(response: object) {
  process.stdout.write(JSON.stringify(response) + "\n");
}

const TOOLS = [
  {
    name: "get_cockpit_kpis",
    description: "Retourne les KPIs mesurés (dépense, CA, ROAS, conversions, score de santé) sur 30 jours glissants. Optionnellement filtré par client.",
    inputSchema: { type: "object", properties: { clientId: { type: "string" } } },
  },
  {
    name: "get_cross_channel_metrics",
    description: "Retourne la répartition mesurée de la dépense, du CA et du ROAS par régie publicitaire.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "detect_anomalies",
    description: "Retourne les campagnes dont le ROAS mesuré sort des seuils surveillés. Vide si aucune.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_supermetrics_accounts",
    description: "Liste les comptes réellement visibles avec la clé Supermetrics de l'agence, pour une régie. Ne synchronise aucune donnée.",
    inputSchema: {
      type: "object",
      properties: { platform: { type: "string", enum: ["meta", "google", "tiktok", "linkedin"] } },
      required: ["platform"],
    },
  },
  {
    name: "generate_client_report",
    description: "Génère un rapport Markdown à partir des métriques mesurées d'un client.",
    inputSchema: { type: "object", properties: { clientId: { type: "string" } }, required: ["clientId"] },
  },
];

rl.on("line", async (line) => {
  if (!line.trim()) return;

  try {
    const request = JSON.parse(line);
    const { id, method, params } = request;

    if (method === "initialize") {
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "universal-ads-cockpit-mcp", version: "2.0.0" },
        },
      });
      return;
    }

    if (method === "tools/list") {
      sendResponse({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
      return;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      switch (toolName) {
        case "get_cockpit_kpis": {
          if (args.clientId) {
            const client = await getClientById(prismaApp, args.clientId);
            sendResponse({
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: JSON.stringify(client ?? { error: "Not found" }) }] },
            });
          } else {
            const overview = await getCockpitOverview(prismaApp);
            sendResponse({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(overview) }] } });
          }
          break;
        }
        case "get_cross_channel_metrics": {
          const breakdown = await getCrossChannelBreakdown(prismaApp);
          sendResponse({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(breakdown) }] } });
          break;
        }
        case "detect_anomalies": {
          const anomalies = await getAnomalies(prismaApp);
          sendResponse({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(anomalies) }] } });
          break;
        }
        case "list_supermetrics_accounts": {
          const cle = await cleSupermetrics(prismaApp);
          if (!cle) {
            sendResponse({ jsonrpc: "2.0", id, error: { code: -32000, message: "Aucune clé Supermetrics enregistrée." } });
            break;
          }
          try {
            const comptes = await listerComptesSupermetrics(cle, args.platform as Platform);
            sendResponse({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(comptes) }] } });
          } catch (e) {
            const message = e instanceof ErreurSupermetrics ? e.message : String(e);
            sendResponse({ jsonrpc: "2.0", id, error: { code: -32001, message } });
          }
          break;
        }
        case "generate_client_report": {
          const client = await getClientById(prismaApp, args.clientId);
          if (!client) {
            sendResponse({ jsonrpc: "2.0", id, error: { code: -32002, message: `Client '${args.clientId}' introuvable.` } });
            break;
          }
          const md = `# Rapport de Performance · ${client.name}\nROAS ${client.roas}x, dépense ${client.totalSpend} ${client.currency}, ${client.totalConversions} conversions.`;
          sendResponse({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: md }] } });
          break;
        }
        default:
          sendResponse({ jsonrpc: "2.0", id, error: { code: -32601, message: `Tool ${toolName} not found` } });
      }
      return;
    }

    sendResponse({ jsonrpc: "2.0", id, result: {} });
  } catch (err) {
    sendResponse({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error", data: String(err) } });
  }
});
