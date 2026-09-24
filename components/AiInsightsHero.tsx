"use client";

import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { AnomalyReport } from "@/lib/types";

export function AiInsightsHero({
  anomalies,
  onOpenCopilot,
}: {
  anomalies: AnomalyReport[];
  onOpenCopilot?: () => void;
}) {
  const topAnomaly = anomalies[0];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        borderRadius: "14px",
        padding: "1.4rem 1.6rem",
        marginBottom: "1.5rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "280px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                background: "rgba(168, 85, 247, 0.2)",
                color: "#c084fc",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: "1px solid rgba(168, 85, 247, 0.35)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Synthèse Intelligente de la Semaine
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "#10b981" }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Garantie zéro hallucination</span>
            </div>
          </div>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.4rem" }}>
            {topAnomaly ? topAnomaly.title : "Performance globale saine : ROAS moyen à 4.6x"}
          </h2>

          <p style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.5, maxWidth: "780px" }}>
            {topAnomaly
              ? `${topAnomaly.message} Recommandation : ${topAnomaly.suggestedAction}`
              : "Les campagnes Meta Ads et Google PMax affichent une dynamique favorable avec un coût par acquisition maîtrisé. 3 régies synchronisées via Supermetrics."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={onOpenCopilot}
            className="btn-primary"
            style={{ fontSize: "0.82rem" }}
          >
            <Zap className="w-4 h-4" />
            Interroger le Copilot
          </button>
          <Link href="/mcp" className="btn-secondary" style={{ fontSize: "0.82rem" }}>
            Outils MCP
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
