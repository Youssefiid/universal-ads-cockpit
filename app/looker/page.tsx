"use client";

import React, { useState } from "react";
import { LookerStudioEmbed } from "@/components/LookerStudioEmbed";
import { lookerFields } from "@/lib/lookerConnector";
import { Copy, Check, ExternalLink, Code, Layers, Sparkles, Database } from "lucide-react";

export default function LookerStudioPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"embed" | "schema" | "guide">("embed");

  const endpointUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/looker/data`
    : "http://localhost:3001/api/looker/data";

  const handleCopy = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span className="pill pill-on" style={{ fontSize: "0.75rem" }}>Passerelle Looker Studio</span>
            <span className="subtle" style={{ fontSize: "0.75rem" }}>Google Data Studio Certified</span>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Looker Studio Live & Connecteur Direct
          </h1>
          <p className="subtle" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Visualisation temps réel et alimentation automatisée des rapports Google Looker Studio
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={handleCopy}
            className="chip"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "URL Feed Copiée !" : "Copier Endpoint Looker"}</span>
          </button>
          <a
            href="https://lookerstudio.google.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ fontSize: "0.82rem" }}
          >
            Créer un rapport Looker
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", marginBottom: "1.4rem", paddingBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("embed")}
          className="chip"
          style={{
            background: activeTab === "embed" ? "rgba(99, 102, 241, 0.2)" : "transparent",
            borderColor: activeTab === "embed" ? "rgba(99, 102, 241, 0.4)" : "transparent",
            color: activeTab === "embed" ? "#ffffff" : "#94a3b8"
          }}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          Visualisation Interactive
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("schema")}
          className="chip"
          style={{
            background: activeTab === "schema" ? "rgba(99, 102, 241, 0.2)" : "transparent",
            borderColor: activeTab === "schema" ? "rgba(99, 102, 241, 0.4)" : "transparent",
            color: activeTab === "schema" ? "#ffffff" : "#94a3b8"
          }}
        >
          <Code className="w-4 h-4 text-indigo-400" />
          Schéma des Champs ({lookerFields.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("guide")}
          className="chip"
          style={{
            background: activeTab === "guide" ? "rgba(99, 102, 241, 0.2)" : "transparent",
            borderColor: activeTab === "guide" ? "rgba(99, 102, 241, 0.4)" : "transparent",
            color: activeTab === "guide" ? "#ffffff" : "#94a3b8"
          }}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          Guide de Connexion
        </button>
      </div>

      {/* Tab: Embed */}
      {activeTab === "embed" && (
        <div>
          <LookerStudioEmbed
            reportUrl="https://lookerstudio.google.com/embed/reporting/0B5XyvE4Y9kY5M05wV3Z5Z2c3a1U/page/1M"
            title="Tableau de Bord Exécutif Looker Studio"
          />
        </div>
      )}

      {/* Tab: Schema */}
      {activeTab === "schema" && (
        <div className="card">
          <div style={{ marginBottom: "1.2rem" }}>
            <h2 className="card-title">Champs Normalisés pour Looker Studio</h2>
            <p className="subtle" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>
              Tous les champs respectent les spécifications Google Looker Community Connector (dimensions, métriques et sémantique).
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "#94a3b8" }}>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Champ</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Libellé Looker</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Type Donnée</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Concept</th>
                  <th style={{ padding: "0.6rem 0.8rem" }}>Type Sémantique</th>
                </tr>
              </thead>
              <tbody>
                {lookerFields.map((f) => (
                  <tr key={f.name} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "0.6rem 0.8rem", fontFamily: "monospace", color: "#818cf8" }}>{f.name}</td>
                    <td style={{ padding: "0.6rem 0.8rem", fontWeight: 600 }}>{f.label}</td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      <span className="pill" style={{ background: "rgba(255,255,255,0.06)", fontSize: "0.7rem" }}>
                        {f.dataType}
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      <span
                        className="pill"
                        style={{
                          background: f.semantics.conceptType === "METRIC" ? "rgba(16, 185, 129, 0.15)" : "rgba(56, 189, 248, 0.15)",
                          color: f.semantics.conceptType === "METRIC" ? "#34d399" : "#38bdf8",
                          fontSize: "0.7rem",
                        }}
                      >
                        {f.semantics.conceptType}
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#94a3b8" }}>
                      {f.semantics.semanticType || "STANDARD"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Guide */}
      {activeTab === "guide" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: "0.8rem" }}>
              Comment brancher Looker Studio en 3 clics
            </h2>
            <ol style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.8rem", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
              <li>
                <strong>Étape 1 :</strong> Ouvrez Google Looker Studio et cliquez sur <em>Créer un rapport</em>.
              </li>
              <li>
                <strong>Étape 2 :</strong> Sélectionnez la source <em>Web / JSON Community Connector</em> ou <em>Custom API Webhook</em>.
              </li>
              <li>
                <strong>Étape 3 :</strong> Collez l'URL d'endpoint :
                <div style={{ background: "#060911", padding: "0.5rem 0.8rem", borderRadius: "6px", fontFamily: "monospace", color: "#38bdf8", marginTop: "0.3rem", wordBreak: "break-all" }}>
                  {endpointUrl}
                </div>
              </li>
              <li>
                <strong>Étape 4 :</strong> Looker Studio récupère instantanément les 16 dimensions et métriques normalisées (ROAS, CPA, Spend, Chiffre d'affaires).
              </li>
            </ol>
          </div>

          <div className="card">
            <h2 className="card-title" style={{ marginBottom: "0.8rem" }}>
              Avantages de la Solution All-in-One
            </h2>
            <ul style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.8rem", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
              <li>
                <strong>Alimentation continue :</strong> Supermetrics met à jour les données ad-networks, et Looker Studio s'actualise automatiquement.
              </li>
              <li>
                <strong>Calculs certifiés :</strong> Les agrégations de ROAS et de marges sont calculées côté serveur de façon déterministe.
              </li>
              <li>
                <strong>Accès IA immédiat :</strong> Les modèles AI (MCP) lisent exactement les mêmes données que vos graphiques Looker Studio.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
