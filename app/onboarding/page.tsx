"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, ArrowLeft, X, Sparkles, Layers, Share2, Cpu, CheckCircle } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, label: "Régies Publicitaires", title: "Connectez vos sources de trafic" },
    { number: 2, label: "Looker Studio Feed", title: "Configurez l'export Looker Studio" },
    { number: 3, label: "Passerelle MCP IA", title: "Activez les outils pour vos agents" },
    { number: 4, label: "Validation Finale", title: "Votre Cockpit est prêt à l'emploi" },
  ];

  return (
    <div style={{ maxWidth: "840px", margin: "0 auto", padding: "1rem 0" }}>
      <div className="card" style={{ padding: "2rem" }}>
        {/* Wizard Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.6rem" }}>
          <div>
            <span className="pill pill-on" style={{ fontSize: "0.75rem", marginBottom: "0.4rem" }}>
              Didacticiel Pas-à-Pas
            </span>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "white" }}>
              {steps[currentStep - 1].title}
            </h1>
            <p className="subtle" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
              Configuration unifiée de la brique Universal Ads Cockpit
            </p>
          </div>
          <Link href="/" className="chip" style={{ fontSize: "0.75rem" }}>
            Passer le guide
          </Link>
        </div>

        {/* Stepper Steps Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", position: "relative" }}>
          {steps.map((s, idx) => {
            const isDone = s.number < currentStep;
            const isCurrent = s.number === currentStep;

            return (
              <div
                key={s.number}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.4rem",
                  zIndex: 2,
                  cursor: "pointer",
                }}
                onClick={() => setCurrentStep(s.number)}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    background: isDone
                      ? "#10b981"
                      : isCurrent
                      ? "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)"
                      : "rgba(255, 255, 255, 0.08)",
                    color: isDone || isCurrent ? "white" : "#94a3b8",
                    boxShadow: isCurrent ? "0 0 16px rgba(99, 102, 241, 0.5)" : undefined,
                  }}
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? "#ffffff" : isDone ? "#34d399" : "#64748b",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.6rem", marginBottom: "1.8rem" }}>
          {currentStep === 1 && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.6rem" }}>
                1. Sélection des régies publicitaires
              </h3>
              <p className="subtle" style={{ fontSize: "0.85rem", marginBottom: "1.2rem" }}>
                Posez une clé Supermetrics depuis le Hub, puis cherchez les comptes réels de
                chaque régie avant de les rattacher à un client :
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.8rem" }}>
                {[
                  { name: "Meta Ads (FB / IG)", sub: "Graph API", key: "meta" },
                  { name: "Google Ads (Search, PMax)", sub: "Google Ads API", key: "google" },
                  { name: "TikTok Ads", sub: "TikTok Marketing API", key: "tiktok" },
                  { name: "LinkedIn Ads", sub: "Campaign Manager API", key: "linkedin" },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: "0.8rem",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <PlatformIcon platform={item.key} className="w-5 h-5" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.name}</div>
                      <div className="subtle" style={{ fontSize: "0.72rem" }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/supermetrics" className="btn-secondary" style={{ fontSize: "0.8rem", marginTop: "1rem", display: "inline-flex" }}>
                Ouvrir le Hub Supermetrics
              </Link>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.6rem" }}>
                2. Flux Looker Studio Community Connector
              </h3>
              <p className="subtle" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
                Votre endpoint JSON direct est prêt et accessible sans aucune configuration externe :
              </p>
              <div style={{ background: "#060911", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "monospace", color: "#38bdf8", fontSize: "0.85rem", marginBottom: "1rem" }}>
                GET /api/looker/data
              </div>
              <p className="subtle" style={{ fontSize: "0.82rem" }}>
                ✓ 16 dimensions et métriques pré-calculées (Spend, Revenue, ROAS, CPA, CTR).
                <br />
                ✓ Prise en charge du filtrage direct par client via <code>?clientId=acme-ecom</code>.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.6rem" }}>
                3. Serveur MCP pour vos Agents IA
              </h3>
              <p className="subtle" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
                Vos modèles d'IA (Claude Desktop, Antigravity, Cursor) peuvent exécuter ces outils en un clic :
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "get_cockpit_kpis : KPIs mesurés (dépense, CA, ROAS, conversions)",
                  "detect_anomalies : campagnes dont le ROAS mesuré sort des seuils surveillés",
                  "list_supermetrics_accounts : comptes réellement visibles pour une régie",
                  "generate_client_report : synthèse Markdown à partir des métriques mesurées"
                ].map((tool, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#cbd5e1" }}>
                    <span style={{ color: "#818cf8" }}>⚡</span>
                    <code>{tool}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ display: "inline-flex", background: "rgba(16, 185, 129, 0.15)", padding: "1rem", borderRadius: "50%", marginBottom: "1rem" }}>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.4rem" }}>
                Le cockpit est prêt
              </h3>
              <p className="subtle" style={{ fontSize: "0.85rem", maxWidth: "480px", margin: "0 auto 1.4rem" }}>
                Le flux Looker Studio et le serveur MCP fonctionnent dès maintenant sur vos
                données mesurées. Le Copilot IA demande une clé Anthropic, la découverte de
                comptes une clé Supermetrics — les deux se posent depuis le Hub Supermetrics
                et l&apos;écran Profil.
              </p>
              <Link href="/" className="btn-primary" style={{ padding: "0.6rem 1.4rem", fontSize: "0.88rem" }}>
                Accéder au Cockpit Exécutif
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))}
            disabled={currentStep === 1}
            className="btn-secondary"
            style={{ opacity: currentStep === 1 ? 0.4 : 1, fontSize: "0.82rem" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Précédent
          </button>

          {currentStep < 4 && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(s + 1, 4))}
              className="btn-primary"
              style={{ fontSize: "0.82rem" }}
            >
              Suivant
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
