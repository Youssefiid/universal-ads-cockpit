"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { CrossChannelChart } from "@/components/CrossChannelChart";
import { AiInsightsHero } from "@/components/AiInsightsHero";
import { PlatformIcon } from "@/components/PlatformIcon";
import { AiChatDrawer } from "@/components/AiChatDrawer";
import { SupermetricsSyncModal } from "@/components/SupermetricsSyncModal";
import {
  getCockpitOverview,
  getCrossChannelBreakdown,
  mockClients,
  mockAnomalies
} from "@/lib/store";

export default function CockpitOverviewPage() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const overview = getCockpitOverview();
  const crossChannel = getCrossChannelBreakdown();

  const money = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  return (
    <div>
      {/* Top Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.6rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Cockpit Exécutif Multi-Comptes
          </h1>
          <p className="subtle" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Vue globale consolidée · 4 clients sous gestion · {overview.activeCampaignsCount} campagnes en temps réel
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="btn-secondary"
            style={{ fontSize: "0.82rem" }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            Supermetrics Sync
          </button>
          <Link href="/looker" className="btn-primary" style={{ fontSize: "0.82rem" }}>
            <Layers className="w-3.5 h-3.5" />
            Ouvrir Looker Studio Live
          </Link>
        </div>
      </div>

      {/* AI Insight Hero */}
      <AiInsightsHero
        anomalies={mockAnomalies}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* KPI Grid (Mockup 4) */}
      <div className="overview-kpi-grid">
        <KpiCard
          label="Budget Global Engagé"
          value={money(overview.totalSpend)}
          delta="8.2%"
          isGood={true}
          subtitle="Tous clients confondus"
          sparkline={[14000, 15500, 14900, 16200, 17800, 18450]}
          icon={DollarSign}
        />
        <KpiCard
          label="Chiffre d'Affaires Généré"
          value={money(overview.totalRevenue)}
          delta="18.5%"
          isGood={true}
          subtitle="Revenu tracké multi-sources"
          sparkline={[58000, 64000, 69000, 75000, 84000, 88560]}
          icon={TrendingUp}
        />
        <KpiCard
          label="ROAS Moyen Cockpit"
          value={`${overview.averageRoas}x`}
          delta="11.4%"
          isGood={true}
          subtitle="Objectif cible : 3.8x"
          sparkline={[3.8, 4.0, 4.1, 4.3, 4.5, 4.8]}
          icon={Zap}
        />
        <KpiCard
          label="Score Santé & Flux"
          value={`${overview.averageHealth}/100`}
          delta="2.1%"
          isGood={true}
          subtitle="Passerelle Supermetrics OK"
          sparkline={[88, 90, 91, 93, 94, 95]}
          icon={Activity}
        />
      </div>

      {/* Multi-Channel Spend Breakdown (Mockup 2) */}
      <CrossChannelChart channels={crossChannel} currency="EUR" />

      {/* Client Accounts Grid */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <div>
            <h2 className="card-title">Portefeuille Clients Actifs</h2>
            <p className="subtle" style={{ fontSize: "0.82rem", marginTop: "0.15rem" }}>
              Suivi individuel des budgets, ROAS et intégrations Looker directes
            </p>
          </div>
          <span className="pill pill-on">4 Comptes Connectés</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.2rem" }}>
          {mockClients.map((client) => {
            const spendPercent = Math.min(Math.round((client.totalSpend / client.monthlyBudget) * 100), 100);

            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="client-overview-card"
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white", marginBottom: "0.2rem" }}>
                        {client.name}
                      </h3>
                      <span className="subtle" style={{ fontSize: "0.75rem" }}>{client.category}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {client.connectedPlatforms.map((p) => (
                        <PlatformIcon key={p} platform={p} className="w-4 h-4" />
                      ))}
                    </div>
                  </div>

                  {/* Budget usage bar */}
                  <div style={{ marginBottom: "1.1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.35rem" }}>
                      <span className="subtle">Budget mensuel engagé</span>
                      <strong>{money(client.totalSpend)} / {money(client.monthlyBudget)} ({spendPercent}%)</strong>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${spendPercent}%`,
                          height: "100%",
                          background: spendPercent > 90 ? "#ef4444" : "linear-gradient(90deg, #6366f1, #38bdf8)",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Metrics preview row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", background: "rgba(255, 255, 255, 0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <div>
                      <span className="subtle" style={{ fontSize: "0.7rem", display: "block" }}>ROAS</span>
                      <strong style={{ color: client.roas >= 4 ? "#10b981" : "#f59e0b", fontSize: "0.95rem" }}>
                        {client.roas}x
                      </strong>
                    </div>
                    <div>
                      <span className="subtle" style={{ fontSize: "0.7rem", display: "block" }}>Conversions</span>
                      <strong style={{ color: "white", fontSize: "0.95rem" }}>{client.totalConversions}</strong>
                    </div>
                    <div>
                      <span className="subtle" style={{ fontSize: "0.7rem", display: "block" }}>CA Tracké</span>
                      <strong style={{ color: "white", fontSize: "0.95rem" }}>{money(client.totalRevenue)}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.8rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)", fontSize: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#10b981" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Score santé : {client.healthScore}/100</span>
                  </div>
                  <span style={{ color: "#818cf8", display: "flex", alignItems: "center", gap: "0.2rem", fontWeight: 600 }}>
                    Explorer <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Looker Studio API Integration Widget */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={{ background: "rgba(66, 133, 244, 0.15)", padding: "0.6rem", borderRadius: "10px" }}>
            <PlatformIcon platform="looker" className="w-6 h-6" />
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>
              Passerelle Looker Studio Directe Opérationnelle
            </h3>
            <p className="subtle" style={{ fontSize: "0.78rem" }}>
              Endpoint Community Connector actif sur <code>/api/looker/data</code> avec 16 dimensions/métriques typées.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link href="/looker" className="btn-secondary" style={{ fontSize: "0.8rem" }}>
            Voir le Dashboard Looker
          </Link>
          <a
            href="/api/looker/data"
            target="_blank"
            rel="noreferrer"
            className="chip"
            style={{ fontSize: "0.8rem" }}
          >
            Tester le flux JSON
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <AiChatDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <SupermetricsSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
}
