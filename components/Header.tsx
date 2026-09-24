"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, Layers, ShieldCheck, ExternalLink, Activity } from "lucide-react";
import { SupermetricsSyncModal } from "./SupermetricsSyncModal";
import { AiChatDrawer } from "./AiChatDrawer";

export function Header() {
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <>
      <header
        style={{
          background: "rgba(11, 15, 25, 0.85)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "0.85rem 1.8rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
                fontSize: "1rem",
                boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)",
              }}
            >
              U
            </div>
            <div>
              <span style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.02em", color: "white" }}>
                Universal Ads Cockpit
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                <span className="pill-success" style={{ padding: "0 0.35rem", borderRadius: "4px", fontSize: "0.68rem" }}>
                  ● LIVE
                </span>
                <span>Looker Studio · Supermetrics · MCP Server</span>
              </div>
            </div>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Supermetrics quick sync */}
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="chip"
            title="Lancer la synchronisation multi-canaux"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sync Supermetrics</span>
          </button>

          {/* Looker Direct link */}
          <Link href="/looker" className="chip">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Looker Studio</span>
          </Link>

          {/* Copilot IA Drawer trigger */}
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="btn-primary"
            style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>Copilot IA</span>
          </button>
        </div>
      </header>

      <SupermetricsSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <AiChatDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </>
  );
}
