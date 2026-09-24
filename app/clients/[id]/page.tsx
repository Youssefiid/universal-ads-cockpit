"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Layers,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { PlatformIcon } from "@/components/PlatformIcon";
import { AiChatDrawer } from "@/components/AiChatDrawer";
import { getClientById, mockClients } from "@/lib/store";

export default function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const client = getClientById(resolvedParams.id);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  if (!client) {
    return notFound();
  }

  const money = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: client.currency, maximumFractionDigits: 0 }).format(v);

  const spendPercent = Math.min(Math.round((client.totalSpend / client.monthlyBudget) * 100), 100);

  return (
    <div>
      {/* Top Breadcrumb and Actions */}
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

      {/* KPI Grid */}
      <div className="overview-kpi-grid">
        <KpiCard
          label="Budget Consommé"
          value={money(client.totalSpend)}
          delta={`${client.deltaSpend >= 0 ? "+" : ""}${client.deltaSpend}%`}
          isGood={client.totalSpend <= client.monthlyBudget}
          subtitle={`Plafond : ${money(client.monthlyBudget)} (${spendPercent}%)`}
          sparkline={client.sparkline}
          icon={DollarSign}
        />
        <KpiCard
          label="Chiffre d'Affaires"
          value={money(client.totalRevenue)}
          delta={`+${client.deltaRoas}%`}
          isGood={true}
          subtitle="Revenu tracké multi-sources"
          sparkline={client.sparkline.map((v) => v * client.roas)}
          icon={TrendingUp}
        />
        <KpiCard
          label="ROAS Global Actuel"
          value={`${client.roas}x`}
          delta={`${client.deltaRoas >= 0 ? "+" : ""}${client.deltaRoas}%`}
          isGood={client.roas >= 4.0}
          subtitle="Objectif cible : 4.0x"
          sparkline={[3.6, 3.9, 4.2, 4.5, 4.8, client.roas]}
          icon={Zap}
        />
        <KpiCard
          label="Score Santé Compte"
          value={`${client.healthScore}/100`}
          delta="+3 pts"
          isGood={client.healthScore >= 90}
          subtitle="Tracking & pixel vérifiés"
          sparkline={[85, 88, 90, 92, 94]}
          icon={Activity}
        />
      </div>

      {/* Campaigns Table */}
      <div className="card" style={{ marginBottom: "1.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <div>
            <h2 className="card-title">Campagnes Actives par Régie</h2>
            <p className="subtle" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>
              Données directes synchronisées via Supermetrics et exposées au connecteur Looker Studio
            </p>
          </div>
          <span className="pill pill-success" style={{ fontSize: "0.75rem" }}>
            {client.campaigns.length} Campagnes Live
          </span>
        </div>

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
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>ID: {c.id}</div>
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
                  <td style={{ padding: "0.75rem 0.8rem", color: "#cbd5e1" }}>{c.cpa.toFixed(2)} €</td>
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
      </div>

      <AiChatDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        initialClientName={client.name}
      />
    </div>
  );
}
