import * as readline from "readline";
import { getCockpitOverview, getCrossChannelBreakdown, mockClients, mockAnomalies, getClientById } from "../lib/store";
import { triggerSupermetricsSync } from "../lib/supermetrics";

// Lightweight Stdio JSON-RPC 2.0 MCP Server
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(response: object) {
  process.stdout.write(JSON.stringify(response) + "\n");
}

const TOOLS = [
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
        minSeverity: { type: "string", enum: ["CRITICAL", "WARNING", "OPPORTUNITY"] }
      }
    }
  },
  {
    name: "trigger_supermetrics_sync",
    description: "Triggers real-time ingestion from Supermetrics for one or all ad networks.",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["meta", "google", "tiktok", "linkedin"] }
      }
    }
  }
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
          serverInfo: {
            name: "universal-ads-cockpit-mcp",
            version: "1.0.0"
          }
        }
      });
      return;
    }

    if (method === "tools/list") {
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS }
      });
      return;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      switch (toolName) {
        case "get_cockpit_kpis": {
          if (args.clientId) {
            const client = getClientById(args.clientId);
            sendResponse({
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: JSON.stringify(client || { error: "Not found" }) }] }
            });
          } else {
            sendResponse({
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: JSON.stringify(getCockpitOverview()) }] }
            });
          }
          break;
        }

        case "get_cross_channel_metrics": {
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(getCrossChannelBreakdown()) }] }
          });
          break;
        }

        case "detect_anomalies": {
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(mockAnomalies) }] }
          });
          break;
        }

        case "trigger_supermetrics_sync": {
          const syncResult = await triggerSupermetricsSync(args.platform);
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(syncResult) }] }
          });
          break;
        }

        default:
          sendResponse({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Tool ${toolName} not found` }
          });
      }
      return;
    }

    // Default response for notifications or ping
    sendResponse({
      jsonrpc: "2.0",
      id,
      result: {}
    });
  } catch (err) {
    sendResponse({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error", data: String(err) }
    });
  }
});
