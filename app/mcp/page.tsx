"use client";

import React, { useState } from "react";
import { Cpu, Terminal, Play, Check, Copy, ShieldCheck, Zap, Layers, RefreshCw } from "lucide-react";

export default function McpExplorerPage() {
  const [activeTool, setActiveTool] = useState("get_cockpit_kpis");
  const [toolArg, setToolArg] = useState("");
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const tools = [
    {
      id: "get_cockpit_kpis",
      name: "get_cockpit_kpis",
      desc: "Récupère les KPIs consolidés (Spend, Revenue, ROAS, Conversions) à l'échelle globale ou pour un client spécifique.",
      argsHint: "Optionnel : clientId (ex: acme-ecom, lumina-beauty)"
    },
    {
      id: "get_cross_channel_metrics",
      name: "get_cross_channel_metrics",
      desc: "Retourne la répartition multi-canaux (Meta, Google, TikTok, LinkedIn) avec parts de budget et ROAS par régie.",
      argsHint: "Aucun argument requis"
    },
    {
      id: "detect_anomalies",
      name: "detect_anomalies",
      desc: "Audite les campagnes et remonte les hausses de CPA anormales, les risques de déplafonnement ou opportunités de scaling.",
      argsHint: "Optionnel : minSeverity (CRITICAL, WARNING, OPPORTUNITY)"
    },
    {
      id: "list_supermetrics_accounts",
      name: "list_supermetrics_accounts",
      desc: "Liste les comptes réellement visibles avec la clé Supermetrics de l'agence, pour une régie donnée. Ne synchronise aucune donnée.",
      argsHint: "Requis : platform (meta, google, tiktok, linkedin)"
    },
    {
      id: "generate_client_report",
      name: "generate_client_report",
      desc: "Génère un rapport de performance exécutif au format Markdown pour un client donné.",
      argsHint: "Requis : clientId (ex: acme-ecom)"
    }
  ];

  const handleRunTool = async () => {
    setIsRunning(true);
    setExecutionResult(null);

    try {
      let argsObj = {};
      if (toolArg.trim()) {
        if (toolArg.startsWith("{")) {
          argsObj = JSON.parse(toolArg);
        } else if (activeTool === "list_supermetrics_accounts") {
          argsObj = { platform: toolArg.trim() };
        } else {
          argsObj = { clientId: toolArg.trim() };
        }
      }

      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: activeTool,
          arguments: argsObj
        })
      });

      const data = await res.json();
      setExecutionResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setExecutionResult(JSON.stringify({ error: String(err) }, null, 2));
    } finally {
      setIsRunning(false);
    }
  };

  // Chemin réel du projet, pas celui du brouillon Antigravity où il a été
  // conçu — une configuration copiée telle quelle aurait pointé vers un
  // dossier qui n'existe plus dès que le projet est déplacé.
  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        "universal-ads-cockpit": {
          command: "npx",
          args: ["tsx", "mcp/server.ts"],
          cwd: "/Users/youssefidbelkheir/Projects/universal-ads-cockpit",
        }
      }
    },
    null,
    2
  );

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(mcpConfigJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span className="pill pill-on" style={{ fontSize: "0.75rem" }}>Model Context Protocol (MCP)</span>
            <span className="subtle" style={{ fontSize: "0.75rem" }}>Anthropic & AGY Standard</span>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Serveur MCP & Outils IA Intégrés
          </h1>
          <p className="subtle" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Permettez à vos agents IA (Claude, Antigravity, Cursor) d'interroger et d'auditer vos régies en direct
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button type="button" onClick={handleCopyConfig} className="chip">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Config MCP Copiée !" : "Copier MCP Config"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tools Playground */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.4rem", marginBottom: "1.8rem" }}>
        {/* Left: Tools List */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cpu className="w-5 h-5 text-indigo-400" />
            Outils MCP Prêts à l'Emploi
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {tools.map((t) => {
              const isSelected = activeTool === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTool(t.id);
                    setToolArg(t.id === "generate_client_report" ? "acme-ecom" : "");
                  }}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "10px",
                    background: isSelected ? "rgba(99, 102, 241, 0.16)" : "rgba(255, 255, 255, 0.03)",
                    border: isSelected ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <code style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.85rem" }}>{t.name}</code>
                    <span className="pill pill-on" style={{ fontSize: "0.68rem" }}>TOOL</span>
                  </div>
                  <p className="subtle" style={{ fontSize: "0.78rem", lineHeight: 1.4 }}>{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Tool Execution Playground */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 className="card-title" style={{ marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Terminal className="w-5 h-5 text-sky-400" />
            Testeur d'Outil en Direct
          </h2>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>
              Argument pour <code>{activeTool}</code> :
            </label>
            <input
              type="text"
              value={toolArg}
              onChange={(e) => setToolArg(e.target.value)}
              placeholder="ex: acme-ecom ou arguments JSON"
              style={{
                width: "100%",
                background: "#060911",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "0.5rem 0.8rem",
                color: "white",
                fontSize: "0.82rem",
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleRunTool}
            disabled={isRunning}
            className="btn-primary"
            style={{ marginBottom: "1rem", alignSelf: "flex-start", fontSize: "0.82rem" }}
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
            <span>{isRunning ? "Exécution en cours..." : "Exécuter l'outil MCP"}</span>
          </button>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>
              Réponse JSON-RPC / Données retournées :
            </label>
            <pre
              style={{
                flex: 1,
                minHeight: "220px",
                background: "#060911",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                padding: "0.85rem",
                fontSize: "0.78rem",
                fontFamily: "monospace",
                color: "#cbd5e1",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {executionResult || "// Cliquez sur 'Exécuter l'outil MCP' pour tester la réponse de l'outil"}
            </pre>
          </div>
        </div>
      </div>

      {/* Integration Code Snippet */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: "0.6rem" }}>
          Configuration MCP pour vos Agents (Claude Desktop / Cursor / Antigravity)
        </h2>
        <p className="subtle" style={{ fontSize: "0.82rem", marginBottom: "0.8rem" }}>
          Ajoutez cette configuration à votre fichier <code>claude_desktop_config.json</code> pour connecter vos agents IA directement au cockpit.
        </p>
        <pre
          style={{
            background: "#060911",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "1rem",
            fontSize: "0.82rem",
            fontFamily: "monospace",
            color: "#38bdf8",
            overflowX: "auto",
          }}
        >
          {mcpConfigJson}
        </pre>
      </div>
    </div>
  );
}
