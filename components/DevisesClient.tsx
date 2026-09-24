"use client";

import React, { useState, useTransition } from "react";

const DEVISES_CONNUES = ["EUR", "USD", "GBP", "CHF", "CAD"];

type Taux = { currency: string; rateToMad: number; updatedAt: Date | string };

/**
 * Taux de change vers le MAD, devise de reporting de l'agence — voir
 * lib/currency.ts et lib/queries.ts:getCockpitOverview. Une devise utilisée
 * par un client mais sans taux réglé est exclue des cumuls multi-clients,
 * jamais convertie à 1:1 par supposition ; elle apparaît ici comme
 * "non configuré" pour que ce soit visible avant que ça surprenne quelqu'un
 * sur le Cockpit.
 */
export function DevisesClient({
  taux,
  devisesUtilisees,
  saveAction,
}: {
  taux: Taux[];
  devisesUtilisees: string[];
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const parDevise = new Map(taux.map((t) => [t.currency, t]));
  const devises = [...new Set([...DEVISES_CONNUES, ...devisesUtilisees.filter((d) => d !== "MAD")])].sort();

  return (
    <div>
      <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", marginBottom: "0.3rem" }}>
        Devises
      </h1>
      <p className="subtle" style={{ fontSize: "0.85rem", marginBottom: "1.4rem", maxWidth: "700px" }}>
        Taux de conversion vers le MAD (dirham), devise de reporting de l&apos;agence. Utilisés pour cumuler les
        clients facturés dans des devises différentes sur le Cockpit Overview — jamais pour re-libeller les montants
        propres à chaque client, affichés dans leur devise de facturation.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "640px" }}>
        {devises.map((d) => (
          <LigneTaux key={d} currency={d} taux={parDevise.get(d) ?? null} saveAction={saveAction} enUsage={devisesUtilisees.includes(d)} />
        ))}
      </div>
    </div>
  );
}

function LigneTaux({
  currency,
  taux,
  enUsage,
  saveAction,
}: {
  currency: string;
  taux: Taux | null;
  enUsage: boolean;
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [valeur, setValeur] = useState(taux ? String(taux.rateToMad) : "");
  const [erreur, setErreur] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur(null);
    const fd = new FormData();
    fd.set("currency", currency);
    fd.set("rateToMad", valeur);
    startTransition(async () => {
      try {
        await saveAction(fd);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement.");
      }
    });
  };

  return (
    <div className="card" style={{ padding: "1.1rem 1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
        <span style={{ fontSize: "1rem", fontWeight: 800, color: "white" }}>1 {currency} =</span>
        <span className={`pill ${taux ? "pill-success" : enUsage ? "pill-on" : ""}`} style={{ fontSize: "0.7rem" }}>
          {taux ? "configuré" : enUsage ? "non configuré — utilisé par un client" : "non configuré"}
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        <input
          type="number"
          step="0.0001"
          min="0"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          placeholder="Ex : 10.5"
          style={{ ...inputStyle, flex: "1 1 160px" }}
        />
        <span className="subtle" style={{ fontSize: "0.85rem" }}>MAD</span>
        <button type="submit" disabled={isPending || !valeur} className="btn-secondary" style={{ fontSize: "0.8rem" }}>
          {isPending ? "…" : taux ? "Mettre à jour" : "Enregistrer"}
        </button>
      </form>

      {taux && (
        <p className="subtle" style={{ fontSize: "0.72rem", marginTop: "0.5rem" }}>
          Dernière mise à jour : {new Date(taux.updatedAt).toLocaleString("fr-FR")}
        </p>
      )}
      {erreur && <p style={{ color: "#fca5a5", fontSize: "0.78rem", marginTop: "0.5rem" }}>{erreur}</p>}
    </div>
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
