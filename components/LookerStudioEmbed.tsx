"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  Sliders,
  Sparkles,
  TrendingUp,
  DollarSign,
  Zap,
  Activity,
  ChevronDown
} from "lucide-react";
import { mockClients, getCockpitOverview, getCrossChannelBreakdown } from "@/lib/store";
import { PlatformIcon } from "./PlatformIcon";

export function LookerStudioEmbed({
  reportUrl = "",
  title = "Tableau de Bord Exécutif Looker Studio",
}: {
  reportUrl?: string;
  title?: string;
}) {
  const [viewMode, setViewMode] = useState<"native" | "iframe">(reportUrl ? "iframe" : "native");
  const [fullscreen, setFullscreen] = useState(false);
  const [customUrl, setCustomUrl] = useState(reportUrl);
  const [activeUrl, setActiveUrl] = useState(reportUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");

  const overview = getCockpitOverview();
  const channels = getCrossChannelBreakdown();

  const endpointUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/looker/data`
    : "http://localhost:3001/api/looker/data";

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      setActiveUrl(customUrl.trim());
      setViewMode("iframe");
    } else {
      setViewMode("native");
    }
    setIsEditing(false);
  };

  const money = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  return (
    <div
      className="card"
      style={{
        padding: "1.4rem",
        position: fullscreen ? "fixed" : "relative",
        inset: fullscreen ? 0 : undefined,
        zIndex: fullscreen ? 999 : undefined,
        height: fullscreen ? "100vh" : "880px",
        borderRadius: fullscreen ? 0 : "14px",
        display: "flex",
        flexDirection: "column",
        marginBottom: fullscreen ? 0 : "1.5rem",
        background: "#060911",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.8rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ background: "rgba(66, 133, 244, 0.15)", padding: "0.45rem", borderRadius: "8px" }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="6" cy="6" r="3" fill="#4285F4" />
              <circle cx="18" cy="6" r="3" fill="#EA4335" />
              <circle cx="6" cy="18" r="3" fill="#34A853" />
              <circle cx="18" cy="18" r="3" fill="#FBBC05" />
            </svg>
          </div>
          <div>
            <h2 className="card-title" style={{ fontSize: "1rem" }}>{title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
              <span className="pill pill-success" style={{ padding: "0.1rem 0.4rem", fontSize: "0.7rem" }}>
                ● Connecteur Direct Actif
              </span>
              <span className="subtle">Looker Studio Community Feed v2.4</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Mode Switcher */}
          <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.06)", borderRadius: "8px", padding: "0.2rem" }}>
            <button
              type="button"
              onClick={() => setViewMode("native")}
              style={{
                background: viewMode === "native" ? "rgba(99, 102, 241, 0.4)" : "transparent",
                color: viewMode === "native" ? "#ffffff" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "0.3rem 0.65rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Rendu Direct Cockpit
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("iframe");
                if (!activeUrl) setIsEditing(true);
              }}
              style={{
                background: viewMode === "iframe" ? "rgba(99, 102, 241, 0.4)" : "transparent",
                color: viewMode === "iframe" ? "#ffffff" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "0.3rem 0.65rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Iframe Externe
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="chip"
            title="Copier l'URL du connecteur Looker Studio"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "URL Copiée !" : "Copier Feed API"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="chip"
            title="Modifier l'URL iframe Looker"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Config URL</span>
          </button>

          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            className="chip"
            title={fullscreen ? "Quitter plein écran" : "Plein écran"}
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* URL Config Bar */}
      {isEditing && (
        <form
          onSubmit={handleApplyUrl}
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.8rem",
            marginBottom: "0.8rem",
            display: "flex",
            gap: "0.6rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Collez ici l'URL de partage embed de votre propre rapport Looker Studio..."
            style={{
              flex: 1,
              background: "#060911",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "0.45rem 0.75rem",
              color: "white",
              fontSize: "0.82rem",
              outline: "none",
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: "0.45rem 0.9rem", fontSize: "0.8rem" }}>
            Charger l'Iframe
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("native");
              setIsEditing(false);
            }}
            className="btn-secondary"
            style={{ padding: "0.45rem 0.9rem", fontSize: "0.8rem" }}
          >
            Revenir au Rendu Direct
          </button>
        </form>
      )}

      {/* VIEW CONTENT */}
      {viewMode === "native" ? (
        /* NATIVE HIGH-FIDELITY LOOKER STUDIO RENDER (Matching Mockup exactly) */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
            overflowY: "auto",
            padding: "0.5rem",
          }}
        >
          {/* Header Banner matching Mockup */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "1rem 1.4rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <PlatformIcon platform="looker" className="w-7 h-7" />
              <div>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "white" }}>
                  Universal Looker Studio Live Connector · <span style={{ color: "#38bdf8" }}>Supermetrics Feed Active</span>
                </h1>
                <p className="subtle" style={{ fontSize: "0.75rem" }}>
                  Mise à jour en temps réel des campagnes Meta, Google, TikTok et LinkedIn
                </p>
              </div>
            </div>
            <span className="pill pill-success" style={{ fontSize: "0.75rem" }}>
              ● Real-time status: Active
            </span>
          </div>

          {/* Top KPI Ribbon (Mockup Top Row) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            <div className="card" style={{ padding: "1rem 1.2rem", background: "#0b0f19" }}>
              <div className="subtle" style={{ fontSize: "0.75rem" }}>Total Spend</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "white", margin: "0.2rem 0" }}>
                {money(overview.totalSpend)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#10b981" }}>▲ +8.2% vs période précédente</div>
            </div>

            <div className="card" style={{ padding: "1rem 1.2rem", background: "#0b0f19" }}>
              <div className="subtle" style={{ fontSize: "0.75rem" }}>Revenue Tracké</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "white", margin: "0.2rem 0" }}>
                {money(overview.totalRevenue)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#10b981" }}>▲ +18.5% de croissance</div>
            </div>

            <div className="card" style={{ padding: "1rem 1.2rem", background: "#0b0f19" }}>
              <div className="subtle" style={{ fontSize: "0.75rem" }}>ROAS Global</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34d399", margin: "0.2rem 0" }}>
                {overview.averageRoas}x
              </div>
              <div style={{ fontSize: "0.7rem", color: "#38bdf8" }}>Objectif cible : 3.80x</div>
            </div>

            <div className="card" style={{ padding: "1rem 1.2rem", background: "#0b0f19" }}>
              <div className="subtle" style={{ fontSize: "0.75rem" }}>Conversions Totales</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "white", margin: "0.2rem 0" }}>
                {overview.totalConversions.toLocaleString("fr-FR")}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#10b981" }}>CPA moyen : {(overview.totalSpend / overview.totalConversions).toFixed(2)} €</div>
            </div>
          </div>

          {/* Main Dashboard Body: Tables + Multi-channel charts + Mapping Panel */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: "1rem", flex: 1 }}>
            {/* Left: Dynamic Campaign Performance Table */}
            <div className="card" style={{ padding: "1.2rem", background: "#0b0f19", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>Performance par Canal</h3>
                <span className="pill pill-on" style={{ fontSize: "0.7rem" }}>Top Sources</span>
              </div>

              <div style={{ overflowX: "auto", flex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "#94a3b8" }}>
                      <th style={{ padding: "0.4rem" }}>Canal</th>
                      <th style={{ padding: "0.4rem" }}>Spend</th>
                      <th style={{ padding: "0.4rem" }}>Revenue</th>
                      <th style={{ padding: "0.4rem" }}>ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((c) => (
                      <tr key={c.platformKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "0.5rem 0.4rem", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
                          <PlatformIcon platform={c.platformKey} className="w-3.5 h-3.5" />
                          <span>{c.platform}</span>
                        </td>
                        <td style={{ padding: "0.5rem 0.4rem" }}>{money(c.spend)}</td>
                        <td style={{ padding: "0.5rem 0.4rem", fontWeight: 600 }}>{money(c.revenue)}</td>
                        <td style={{ padding: "0.5rem 0.4rem", color: c.roas >= 4 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                          {c.roas}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Center: Multi-channel ROAS Bar Visuals */}
            <div className="card" style={{ padding: "1.2rem", background: "#0b0f19", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>Multi-Channel ROAS Breakdown</h3>
                <span className="subtle" style={{ fontSize: "0.72rem" }}>Objectif: &gt; 3.0x</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", flex: 1, justifyContent: "center" }}>
                {channels.map((c) => {
                  const barWidth = Math.min((c.roas / 6.0) * 100, 100);

                  return (
                    <div key={c.platformKey}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
                        <span style={{ fontWeight: 600 }}>{c.platform}</span>
                        <span style={{ color: "#34d399", fontWeight: 700 }}>{c.roas}x ROAS</span>
                      </div>
                      <div style={{ height: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "5px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${barWidth}%`,
                            height: "100%",
                            background: c.platformKey === "meta"
                              ? "#0081FB"
                              : c.platformKey === "google"
                              ? "#34A853"
                              : c.platformKey === "tiktok"
                              ? "#EE1D52"
                              : "#0A66C2",
                            borderRadius: "5px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Community Connector Field Mapping Panel (Mockup Right Side) */}
            <div className="card" style={{ padding: "1.2rem", background: "#0b0f19", fontSize: "0.78rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "white", marginBottom: "0.6rem" }}>
                Live Community Connector
              </h3>
              <p className="subtle" style={{ fontSize: "0.72rem", marginBottom: "0.8rem" }}>
                Mapping des champs typés vers le schéma Looker Studio :
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
                {[
                  { name: "Total Spend", type: "METRIC (EUR)", active: true },
                  { name: "Total Revenue", type: "METRIC (EUR)", active: true },
                  { name: "ROAS Index", type: "METRIC (Float)", active: true },
                  { name: "Ad Platform", type: "DIMENSION", active: true },
                  { name: "Client ID", type: "DIMENSION", active: true },
                  { name: "Campaign Status", type: "DIMENSION", active: true },
                ].map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.35rem 0.5rem",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{ color: "#cbd5e1" }}>{f.name}</span>
                    <span style={{ color: "#818cf8", fontSize: "0.68rem" }}>{f.type}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 600 }}>Direct API Endpoint</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                </div>
                <code style={{ fontSize: "0.68rem", color: "#38bdf8", wordBreak: "break-all" }}>
                  GET /api/looker/data
                </code>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EXTERNAL IFRAME EMBED VIEW */
        <div
          style={{
            flex: 1,
            width: "100%",
            background: "#060911",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {activeUrl ? (
            <iframe
              src={activeUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem", color: "#94a3b8" }}>
              <p>Aucune URL de rapport externe renseignée.</p>
              <button type="button" onClick={() => setIsEditing(true)} className="btn-primary">
                Entrer l'URL d'un rapport Looker Studio
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Bar */}
      <div
        style={{
          background: "rgba(11, 15, 25, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          padding: "0.6rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.78rem",
          marginTop: "0.6rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#38bdf8", fontWeight: 600 }}>Connecteur Looker Studio :</span>
          <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.15rem 0.4rem", borderRadius: "4px", color: "#a5b4fc" }}>
            GET /api/looker/data
          </code>
        </div>
        <a
          href="https://lookerstudio.google.com"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#818cf8", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}
        >
          Ouvrir Google Looker Studio
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
