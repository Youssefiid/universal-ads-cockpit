"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Layers,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  CheckCircle2,
  FileDown,
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { PlatformIcon } from "@/components/PlatformIcon";
import { libelleReseau } from "@/lib/networks";
import { AiChatDrawer } from "@/components/AiChatDrawer";
import type { Client } from "@/lib/types";

/**
 * Contenu visuel de la fiche client, inchangé — les deltas et sparklines
 * inventés par campagne fictive (client.roas, [3.6, 3.9, 4.2...]) sont
 * remplacés par ceux réellement calculés (lib/queries.ts), ou par un tiret
 * quand la comparaison n'a pas de sens.
 */
export function ClientDetailClient({ client }: { client: Client }) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const money = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: client.currency, maximumFractionDigits: 0 }).format(v);

  const spendPercent = client.monthlyBudget > 0
    ? Math.min(Math.round((client.totalSpend / client.monthlyBudget) * 100), 100)
    : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <Link
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au Cockpit Overview
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
              {client.name}
            </h1>
            <span className="pill pill-on" style={{ fontSize: "0.75rem" }}>
              {client.category}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Link
            href={`/looker?clientId=${client.id}`}
            className="btn-secondary"
            style={{ fontSize: "0.82rem" }}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Rapport Looker Studio
          </Link>
          <a
            href={`/api/clients/${client.id}/export-ppt`}
            className="btn-secondary"
            style={{ fontSize: "0.82rem" }}
            download
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            Exporter en PPT
          </a>
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="btn-primary"
            style={{ fontSize: "0.82rem" }}
          >
            <Sparkles className="w-4 h-4" />
            Copilot IA · {client.name.split(" ")[0]}
          </button>
        </div>
      </div>

      <div className="overview-kpi-grid">
        <KpiCard
          label="Budget Consommé"
          value={money(client.totalSpend)}
          delta={client.deltaSpend !== 0 ? `${client.deltaSpend >= 0 ? "+" : ""}${client.deltaSpend}%` : "—"}
          isGood={client.totalSpend <= client.monthlyBudget}
          subtitle={`Plafond : ${money(client.monthlyBudget)} (${spendPercent}%)`}
          sparkline={client.sparkline}
          icon={DollarSign}
        />
        <KpiCard
          label="Chiffre d'Affaires"
          value={money(client.totalRevenue)}
          delta={client.deltaRoas !== 0 ? `${client.deltaRoas >= 0 ? "+" : ""}${client.deltaRoas}%` : "—"}
          isGood={true}
          subtitle="Revenu tracké multi-sources"
          sparkline={[]}
          icon={TrendingUp}
        />
        <KpiCard
          label="ROAS Global Actuel"
          value={`${client.roas}x`}
          delta={client.deltaRoas !== 0 ? `${client.deltaRoas >= 0 ? "+" : ""}${client.deltaRoas}%` : "—"}
          isGood={client.roas >= 4.0}
          subtitle="Objectif cible : 4.0x"
          sparkline={[]}
          icon={Zap}
        />
        <KpiCard
          label="Score Santé Compte"
          value={`${client.healthScore}/100`}
          delta="—"
          isGood={client.healthScore >= 70}
          subtitle="Budget respecté + ROAS vs objectif"
          sparkline={[]}
          icon={Activity}
        />
      </div>

      <div className="card" style={{ marginBottom: "1.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <div>
            <h2 className="card-title">Campagnes Actives par Régie</h2>
            <p className="subtle" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>
              Mesuré à partir des exports importés et des comptes connectés
            </p>
          </div>
          <span className="pill pill-success" style={{ fontSize: "0.75rem" }}>
            {client.campaigns.length} Campagne{client.campaigns.length > 1 ? "s" : ""}
          </span>
        </div>

        {client.campaigns.length === 0 ? (
          <p className="subtle">Aucune campagne mesurée sur la période.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "#94a3b8" }}>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Régie & Nom de Campagne</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Statut</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Budget Engagé</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Conversions</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>CPA</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>CA Généré</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>ROAS</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>CTR / CPC</th>
                </tr>
              </thead>
              <tbody>
                {client.campaigns.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "0.75rem 0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <PlatformIcon platform={c.platform} className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <div style={{ fontWeight: 600, color: "white" }}>{c.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span>ID: {c.id}</span>
                            {libelleReseau(c.platform, c.network) && (
                              <span className="pill" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#a5b4fc", fontSize: "0.65rem", padding: "0.05rem 0.4rem" }}>
                                {libelleReseau(c.platform, c.network)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.8rem" }}>
                      <span
                        className="pill"
                        style={{
                          background: c.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                          color: c.status === "ACTIVE" ? "#34d399" : "#a5b4fc",
                          fontSize: "0.72rem",
                        }}
                      >
                        ● {c.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.8rem", fontWeight: 600 }}>{money(c.spend)}</td>
                    <td style={{ padding: "0.75rem 0.8rem", fontWeight: 600 }}>{c.conversions}</td>
                    <td style={{ padding: "0.75rem 0.8rem", color: "#cbd5e1" }}>
                      {c.conversions > 0 ? `${c.cpa.toFixed(2)} €` : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 0.8rem", fontWeight: 700, color: "white" }}>{money(c.revenue)}</td>
                    <td style={{ padding: "0.75rem 0.8rem" }}>
                      <span style={{ color: c.roas >= 4.0 ? "#10b981" : "#f59e0b", fontWeight: 800, fontSize: "0.95rem" }}>
                        {c.roas}x
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.8rem", fontSize: "0.78rem", color: "#94a3b8" }}>
                      {c.ctr}% · {c.cpc} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AiChatDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        clientId={client.id}
        initialClientName={client.name}
      />
    </div>
  );
}
