"use client";

import React from "react";
import { PlatformIcon } from "./PlatformIcon";
import { CrossChannelSummary } from "@/lib/types";

export function CrossChannelChart({
  channels,
  currency = "EUR",
}: {
  channels: CrossChannelSummary[];
  currency?: string;
}) {
  if (!channels || channels.length === 0) return null;

  const maxSpend = Math.max(...channels.map((c) => c.spend), 1);
  const totalSpend = channels.reduce((acc, c) => acc + c.spend, 0);

  const money = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);

  return (
    <section className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 className="card-title">Comparatif Multi-Canaux</h2>
          <p className="subtle" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>
            Répartition des budgets, volumes de conversions et rentabilité ROAS par régie
          </p>
        </div>
        <span className="pill pill-on" style={{ fontSize: "0.8rem" }}>
          Budget total investi : {money(totalSpend)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {channels.map((c) => {
          const share = totalSpend > 0 ? (c.spend / totalSpend) * 100 : 0;
          const barWidth = (c.spend / maxSpend) * 100;

          return (
            <div
              key={c.platformKey}
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 220px",
                gap: "1.2rem",
                alignItems: "center",
                padding: "0.4rem 0"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <PlatformIcon platform={c.platformKey} className="w-5 h-5 flex-shrink-0" />
                <span style={{ fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.platform}
                </span>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "6px", height: "14px", overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    width: `${Math.max(barWidth, 4)}%`,
                    height: "100%",
                    background: c.platformKey === "meta"
                      ? "linear-gradient(90deg, #0081FB 0%, #38bdf8 100%)"
                      : c.platformKey === "google"
                      ? "linear-gradient(90deg, #4285F4 0%, #34A853 100%)"
                      : c.platformKey === "tiktok"
                      ? "linear-gradient(90deg, #EE1D52 0%, #a855f7 100%)"
                      : "linear-gradient(90deg, #0A66C2 0%, #6366f1 100%)",
                    borderRadius: "6px",
                    transition: "width 0.8s ease",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem", fontSize: "0.85rem" }}>
                <span style={{ fontWeight: 700 }}>{money(c.spend)}</span>
                <span className="subtle" style={{ fontSize: "0.75rem" }}>({share.toFixed(0)}%)</span>
                <span style={{ color: c.roas >= 4 ? "#10b981" : c.roas >= 2.5 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>
                  {c.roas.toFixed(1)}x ROAS
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
