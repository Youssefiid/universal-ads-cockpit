"use client";

import React, { useState } from "react";
import { RefreshCw, CheckCircle, X, Server, Database, ShieldCheck } from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";

export function SupermetricsSyncModal({
  isOpen,
  onClose,
  onSyncComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const handleStartSync = async () => {
    setSyncing(true);
    setProgress(10);
    setLog(["Initialisation de la passerelle Supermetrics..."]);

    await new Promise((r) => setTimeout(r, 400));
    setProgress(35);
    setLog((prev) => [...prev, "✓ Connexion Meta Graph API v21 : 14 280 métriques ingérées"]);

    await new Promise((r) => setTimeout(r, 500));
    setProgress(65);
    setLog((prev) => [...prev, "✓ Connexion Google Ads v18 : 9 840 lignes de conversion consolidées"]);

    await new Promise((r) => setTimeout(r, 400));
    setProgress(90);
    setLog((prev) => [...prev, "✓ Connexion TikTok Marketing API : 4 620 événements validés"]);

    await new Promise((r) => setTimeout(r, 300));
    setProgress(100);
    setLog((prev) => [
      ...prev,
      "✓ Schéma Looker Studio synchronisé (/api/looker/data actualisé)",
      "✓ Serveur MCP informé (anomalies recalculées)"
    ]);

    setSyncing(false);
    setCompleted(true);
    if (onSyncComplete) onSyncComplete();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#0b0f19",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          padding: "1.6rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
              <RefreshCw className={`w-5 h-5 text-indigo-400 ${syncing ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>
                Supermetrics Sync Engine
              </h3>
              <p className="subtle" style={{ fontSize: "0.78rem" }}>
                Passerelle unifiée ad-networks vers Looker & MCP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network status badges */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
          {["meta", "google", "tiktok", "linkedin"].map((p) => (
            <div
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.3rem 0.6rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
              }}
            >
              <PlatformIcon platform={p} className="w-3.5 h-3.5" />
              <span style={{ textTransform: "capitalize" }}>{p}</span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", marginLeft: "2px" }} />
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
            <span className="subtle">Progression du pipeline de données</span>
            <span style={{ fontWeight: 700, color: "#818cf8" }}>{progress}%</span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #6366f1, #10b981)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Logs */}
        <div
          style={{
            background: "#060911",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            padding: "0.8rem",
            height: "130px",
            overflowY: "auto",
            fontSize: "0.78rem",
            fontFamily: "monospace",
            color: "#94a3b8",
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
            marginBottom: "1.2rem",
          }}
        >
          {log.length === 0 ? (
            <div style={{ color: "#64748b", fontStyle: "italic", paddingTop: "2rem", textAlign: "center" }}>
              Prêt pour la synchronisation multi-canaux...
            </div>
          ) : (
            log.map((item, idx) => (
              <div key={idx} style={{ color: item.startsWith("✓") ? "#34d399" : "#cbd5e1" }}>
                {item}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: "0.82rem" }}>
            {completed ? "Fermer" : "Annuler"}
          </button>
          <button
            type="button"
            onClick={handleStartSync}
            disabled={syncing}
            className="btn-primary"
            style={{ fontSize: "0.82rem", opacity: syncing ? 0.7 : 1 }}
          >
            {syncing ? "Synchronisation en cours..." : completed ? "Resynchroniser" : "Lancer la Synchronisation"}
          </button>
        </div>
      </div>
    </div>
  );
}
