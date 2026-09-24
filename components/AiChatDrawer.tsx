"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Bot, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { mockClients, getCockpitOverview } from "@/lib/store";

export function AiChatDrawer({
  isOpen,
  onClose,
  initialClientName = "Toutes régies confondues",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialClientName?: string;
}) {
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string; time: string }>>([
    {
      role: "assistant",
      text: `Bonjour ! Je suis votre Copilot IA Ads connecté aux flux Looker Studio et Supermetrics. Le ROAS global du cockpit est de 4.6x pour un budget engagé de 70 750 €. Quelle analyse souhaitez-vous mener ?`,
      time: "Maintenant"
    }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
    ]);

    setIsThinking(true);

    // Simulate intelligent grounded response
    await new Promise((r) => setTimeout(r, 600));

    let reply = "";
    const lower = userText.toLowerCase();

    if (lower.includes("roas") || lower.includes("rentabilité")) {
      reply = `📊 Analyse de rentabilité : 
• Top performer : Lumina Cosmetics avec un ROAS de 5.2x (Reel UGC TikTok & Advantage+ Meta).
• Acme Corp suit avec 4.8x de ROAS et un chiffre d'affaires de 88 560 €.
• Point d'attention : TechFlow SaaS est à 3.6x avec un CPA LinkedIn élevé (103,30 €).`;
    } else if (lower.includes("supermetrics") || lower.includes("sync")) {
      reply = `🔄 Statut des flux de données Supermetrics :
• 4 régies connectées avec succès (Meta Graph v21, Google Ads v18, TikTok API, LinkedIn Campaign Mgr).
• Dernière synchro globale validée : 30 000+ métriques normalisées prêtes pour Looker Studio.`;
    } else if (lower.includes("looker") || lower.includes("studio")) {
      reply = `📈 Intégration Looker Studio :
• Les endpoints Community Connector JSON sont actifs sur /api/looker/data.
• 16 dimensions et métriques sont exposées avec typage strict (isDouble, semanticType EUR/PERCENT).`;
    } else if (lower.includes("mcp") || lower.includes("agent") || lower.includes("outil")) {
      reply = `🤖 Outils MCP disponibles :
• get_kpis : Extraction immédiate de KPIs consolidés.
• detect_anomalies : Audit des dérivations de CPA et de sous-performance budgétaire.
• trigger_sync : Ordre d'ingestion ad-network asynchrone.`;
    } else {
      reply = `✅ Analyse globale : Vos campagnes génèrent un total de 3 450 conversions pour un chiffre d'affaires cumulé de 309 680 €. Toutes les métriques proviennent directement de votre brique unifiée Supermetrics/Looker.`;
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
    ]);
    setIsThinking(false);
  };

  return (
    <div className="ai-drawer-backdrop" onClick={onClose}>
      <div className="ai-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="ai-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.2)", padding: "0.45rem", borderRadius: "10px" }}>
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "white" }}>
                Copilot IA · {initialClientName}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "#10b981" }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Métriques certifiées · Zéro hallucination</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Quota & Token Meter */}
        <div className="ai-drawer-quota">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.35rem" }}>
            <span className="subtle">Quota de diagnostic MCP / IA</span>
            <strong style={{ color: "#c084fc" }}>18 450 / 25 000 tokens</strong>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
            <div style={{ width: "74%", height: "100%", background: "linear-gradient(90deg, #6366f1, #a855f7)", borderRadius: "2px" }} />
          </div>
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: "0.75rem 1.4rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.4rem", overflowX: "auto" }}>
          {[
            { label: "Analyse ROAS", query: "Quel est l'état actuel de notre ROAS ?" },
            { label: "Détecter anomalies", query: "Y a-t-il des anomalies critiques ou des CPA élevés ?" },
            { label: "Looker Studio feed", query: "Comment fonctionne l'intégration Looker Studio ?" }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInput(item.query)}
              className="chip"
              style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="ai-drawer-body">
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-drawer-bubble ${m.role}`}>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              <div style={{ fontSize: "0.68rem", color: m.role === "assistant" ? "#64748b" : "rgba(255,255,255,0.7)", marginTop: "0.4rem", textAlign: "right" }}>
                {m.time}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="ai-drawer-bubble assistant" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bot className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="subtle" style={{ fontSize: "0.82rem" }}>Interrogation des sources de données...</span>
            </div>
          )}
        </div>

        {/* Foot Input */}
        <form onSubmit={handleSend} className="ai-drawer-foot">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question sur vos régies pub..."
            className="ai-drawer-input"
          />
          <button type="submit" className="ai-drawer-send">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
