"use client";

import React, { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Share2, Layers, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { mockSupermetricsConnectors } from "@/lib/store";
import { SupermetricsSyncModal } from "@/components/SupermetricsSyncModal";
import { Platform } from "@/lib/types";

export default function SupermetricsPage() {
  const [connectors, setConnectors] = useState(mockSupermetricsConnectors);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncSingle = async (platformId: Platform) => {
    setSyncingId(platformId);
    await new Promise((r) => setTimeout(r, 600));

    setConnectors((prev) =>
      prev.map((c) => {
        if (c.id === platformId) {
          return {
            ...c,
            lastSyncTime: new Date().toISOString(),
            recordsSynced: c.recordsSynced + Math.floor(Math.random() * 250) + 50,
          };
        }
        return c;
      })
    );
    setSyncingId(null);
  };

  const totalRecords = connectors.reduce((acc, c) => acc + c.recordsSynced, 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span className="pill pill-on" style={{ fontSize: "0.75rem" }}>Passerelle Supermetrics</span>
            <span className="subtle" style={{ fontSize: "0.75rem" }}>Multi-Network Pipeline v3.4</span>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Hub de Connecteurs Supermetrics
          </h1>
          <p className="subtle" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Ingestion et normalisation des métriques publicitaires vers Looker Studio et le serveur MCP
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ fontSize: "0.82rem" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Synchronisation Globale
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.2rem", marginBottom: "1.6rem" }}>
        <div className="card" style={{ padding: "1.2rem" }}>
          <span className="subtle" style={{ fontSize: "0.75rem" }}>Régies Connectées</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: "0.3rem 0" }}>4 / 4</div>
          <span className="pill pill-success" style={{ fontSize: "0.7rem" }}>100% Opérationnel</span>
        </div>
        <div className="card" style={{ padding: "1.2rem" }}>
          <span className="subtle" style={{ fontSize: "0.75rem" }}>Lignes de Métriques Sync</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: "0.3rem 0" }}>{totalRecords.toLocaleString("fr-FR")}</div>
          <span className="subtle" style={{ fontSize: "0.7rem" }}>30 derniers jours</span>
        </div>
        <div className="card" style={{ padding: "1.2rem" }}>
          <span className="subtle" style={{ fontSize: "0.75rem" }}>Comptes Publicitaires Liés</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: "0.3rem 0" }}>11 Comptes</div>
          <span className="subtle" style={{ fontSize: "0.7rem" }}>Meta, Google, TikTok, LinkedIn</span>
        </div>
        <div className="card" style={{ padding: "1.2rem" }}>
          <span className="subtle" style={{ fontSize: "0.75rem" }}>Sortie Données</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#38bdf8", margin: "0.3rem 0" }}>Looker Studio</div>
          <span className="pill pill-on" style={{ fontSize: "0.7rem" }}>Feed JSON Actif</span>
        </div>
      </div>

      {/* Connectors Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
        {connectors.map((connector) => {
          const isSyncing = syncingId === connector.id;

          return (
            <div key={connector.id} className="card" style={{ padding: "1.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.06)", padding: "0.6rem", borderRadius: "10px" }}>
                    <PlatformIcon platform={connector.id} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>{connector.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "#10b981", marginTop: "0.15rem" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connecté · Token valide jusqu'en 2027</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.1rem", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span className="subtle">Comptes ad-networks gérés :</span>
                  <strong>{connector.accountCount} comptes</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span className="subtle">Lignes synchronisées :</span>
                  <strong style={{ color: "#a5b4fc" }}>{connector.recordsSynced.toLocaleString("fr-FR")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="subtle">Dernière actualisation :</span>
                  <span className="subtle">{new Date(connector.lastSyncTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="pill pill-success" style={{ fontSize: "0.72rem" }}>
                  ● Sync Auto 15m
                </span>
                <button
                  type="button"
                  onClick={() => handleSyncSingle(connector.id)}
                  disabled={isSyncing}
                  className="chip"
                  style={{ fontSize: "0.78rem" }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
                  <span>{isSyncing ? "Sync..." : "Forcer la synchro"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <SupermetricsSyncModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
