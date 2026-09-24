"use client";

import React, { useState, useTransition } from "react";
import { Sparkles, X, Send, Bot, ShieldCheck } from "lucide-react";
import { envoyerMessageChat } from "@/lib/actions";

/**
 * Le Copilot IA, branché sur une vraie réponse.
 *
 * Répondait auparavant par un `if (texte.includes("roas"))` renvoyant des
 * paragraphes écrits en dur, sous un badge « Zéro hallucination » et un
 * compteur de jetons figé (« 18 450 / 25 000 »). Ce composant appelle
 * maintenant `envoyerMessageChat`, qui interroge réellement Claude, cadré
 * sur les métriques mesurées de la portée ouverte (lib/chat.ts). Sans clé
 * Anthropic enregistrée pour l'agence, l'appel échoue et l'erreur réelle
 * s'affiche — jamais une réponse de repli inventée pour combler le vide.
 */
export function AiChatDrawer({
  isOpen,
  onClose,
  clientId,
  initialClientName = "Toutes régies confondues",
}: {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  initialClientName?: string;
}) {
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string; time: string }>>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const heure = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const texte = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: texte, time: heure() }]);

    startTransition(async () => {
      try {
        const fd = new FormData();
        if (clientId) fd.append("clientId", clientId);
        fd.append("message", texte);
        const reponse = await envoyerMessageChat(fd);
        setMessages((prev) => [...prev, { role: "assistant", text: reponse.texte, time: heure() }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `⚠️ ${err instanceof Error ? err.message : "Le Copilot n'a pas pu répondre."}`,
            time: heure(),
          },
        ]);
      }
    });
  };

  return (
    <div className="ai-drawer-backdrop" onClick={onClose}>
      <div className="ai-drawer-panel" onClick={(e) => e.stopPropagation()}>
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
                <span>Cadré sur les métriques mesurées, rien d&apos;autre</span>
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

        <div style={{ padding: "0.75rem 1.4rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.4rem", overflowX: "auto" }}>
          {["Quel est le ROAS actuel ?", "Combien de conversions ?", "Quelle est la dépense engagée ?"].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setInput(q)}
              className="chip"
              style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="ai-drawer-body">
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <Sparkles className="w-7 h-7" style={{ color: "#a855f7", margin: "0 auto 0.6rem" }} />
              <p className="subtle" style={{ fontSize: "0.85rem" }}>
                Posez une question sur {initialClientName}. Les réponses ne citent que
                les métriques réellement mesurées ; une donnée absente est dite
                absente, jamais estimée.
              </p>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-drawer-bubble ${m.role}`}>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              <div style={{ fontSize: "0.68rem", color: m.role === "assistant" ? "#64748b" : "rgba(255,255,255,0.7)", marginTop: "0.4rem", textAlign: "right" }}>
                {m.time}
              </div>
            </div>
          ))}
          {isPending && (
            <div className="ai-drawer-bubble assistant" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bot className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="subtle" style={{ fontSize: "0.82rem" }}>Le Copilot réfléchit…</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="ai-drawer-foot">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question sur vos régies pub..."
            className="ai-drawer-input"
            disabled={isPending}
          />
          <button type="submit" className="ai-drawer-send" disabled={isPending || !input.trim()}>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
