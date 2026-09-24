"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Plus } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import type { Client } from "@/lib/types";

const CATEGORIES_SUGGEREES = ["E-Commerce & Retail", "Beauty & D2C", "SaaS Enterprise", "Services B2B", "Santé", "Immobilier"];
const DEVISES = ["EUR", "USD", "GBP", "CHF", "CAD"];

/**
 * Liste de tous les clients visibles pour la session en cours (tous pour un
 * admin, seulement les assignés pour un traffic manager — lib/queries.ts,
 * getClientsPourPortee), avec la possibilité d'en ajouter un. Reprend telle
 * quelle la carte client de l'écran d'accueil, dans une grille dédiée.
 */
export function ClientsListClient({
  clients,
  createAction,
}: {
  clients: Client[];
  createAction: (formData: FormData) => Promise<void>;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const money = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Comptes Clients
          </h1>
          <p className="subtle" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
            {clients.length} client{clients.length > 1 ? "s" : ""} suivi{clients.length > 1 ? "s" : ""}
          </p>
        </div>
        <button type="button" onClick={() => setIsFormOpen((v) => !v)} className="btn-primary" style={{ fontSize: "0.82rem" }}>
          <Plus className="w-4 h-4" />
          Ajouter un client
        </button>
      </div>

      {isFormOpen && <CreerClientForm action={createAction} onDone={() => setIsFormOpen(false)} />}

      {clients.length === 0 && (
        <div className="card">
          <p className="subtle">Aucun client pour l&apos;instant. Ajoutez-en un pour commencer.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.2rem" }}>
        {clients.map((client) => {
          const spendPercent = client.monthlyBudget > 0
            ? Math.min(Math.round((client.totalSpend / client.monthlyBudget) * 100), 100)
            : 0;

          return (
            <Link key={client.id} href={`/clients/${client.id}`} className="client-overview-card">
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
    </div>
  );
}

function CreerClientForm({
  action,
  onDone,
}: {
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(fd);
        onDone();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Échec de la création.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: "1.2rem 1.4rem", marginBottom: "1.4rem", display: "grid", gap: "0.8rem", maxWidth: "640px" }}>
      <h2 className="card-title">Nouveau client</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
          <span className="subtle">Nom du client</span>
          <input name="name" required style={inputStyle} placeholder="Ex : Acme Corp" />
        </label>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
          <span className="subtle">Catégorie</span>
          <input name="category" required list="categories-suggerees" style={inputStyle} placeholder="Ex : E-Commerce & Retail" />
          <datalist id="categories-suggerees">
            {CATEGORIES_SUGGEREES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
          <span className="subtle">Budget mensuel</span>
          <input name="monthlyBudget" type="number" min="1" step="0.01" required style={inputStyle} placeholder="Ex : 25000" />
        </label>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
          <span className="subtle">Devise</span>
          <select name="currency" defaultValue="EUR" style={inputStyle}>
            {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button type="button" onClick={onDone} className="btn-secondary" style={{ fontSize: "0.82rem" }}>Annuler</button>
        <button type="submit" disabled={isPending} className="btn-primary" style={{ fontSize: "0.82rem" }}>
          {isPending ? "Création…" : "Créer le client"}
        </button>
      </div>
      {erreur && <p style={{ color: "#fca5a5", fontSize: "0.78rem" }}>{erreur}</p>}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border-light)",
  borderRadius: "8px",
  padding: "0.55rem 0.7rem",
  color: "white",
  fontSize: "0.85rem",
};
