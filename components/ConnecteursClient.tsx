"use client";

import React, { useState, useTransition } from "react";

type Provider = "supermetrics" | "anthropic" | "openai" | "google";

type Credential = {
  provider: string;
  hint: string;
  label: string | null;
  checkedAt: Date | null;
  checkOk: boolean | null;
  checkNote: string | null;
};

const CATALOGUE: { id: Provider; nom: string; desc: string }[] = [
  { id: "supermetrics", nom: "Supermetrics", desc: "Connecteur de données publicitaires multi régies." },
  { id: "anthropic", nom: "Claude (Anthropic)", desc: "Alimente le Copilot IA du cockpit, cadré sur les métriques mesurées." },
  { id: "openai", nom: "GPT (OpenAI)", desc: "Fournisseur alternatif pour les mêmes fonctions IA." },
  { id: "google", nom: "Gemini (Google)", desc: "Fournisseur alternatif pour les mêmes fonctions IA." },
];

/**
 * Hub de connecteurs de l'agence : une clé par fournisseur, partagée par
 * tout le staff. Supermetrics et Claude sont réellement éprouvés (un appel
 * au fournisseur avant d'être enregistrés) ; GPT et Gemini ne sont pas
 * branchés à une fonctionnalité du cockpit pour l'instant — leur statut le
 * dit explicitement plutôt que de prétendre une vérification qui n'existe
 * pas.
 */
export function ConnecteursClient({
  credentials,
  saveAction,
}: {
  credentials: Credential[];
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const parProvider = new Map(credentials.map((c) => [c.provider, c]));

  return (
    <div>
      <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", marginBottom: "0.3rem" }}>
        Connecteurs de l&apos;agence
      </h1>
      <p className="subtle" style={{ fontSize: "0.85rem", marginBottom: "1.4rem", maxWidth: "720px" }}>
        Clés partagées par tout le staff. Les fournisseurs IA peuvent en plus être réglés en propre par chaque
        utilisateur depuis sa page de profil ; tant qu&apos;il ne l&apos;a pas fait, ses actions IA utilisent la
        clé d&apos;agence ci-dessous.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {CATALOGUE.map((p) => (
          <ConnecteurRow key={p.id} provider={p.id} nom={p.nom} desc={p.desc} credential={parProvider.get(p.id) ?? null} saveAction={saveAction} />
        ))}
      </div>
    </div>
  );
}

function ConnecteurRow({
  provider,
  nom,
  desc,
  credential,
  saveAction,
}: {
  provider: Provider;
  nom: string;
  desc: string;
  credential: Credential | null;
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [cle, setCle] = useState("");
  const [label, setLabel] = useState(credential?.label ?? "");

  const relie = !!credential;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur(null);
    const fd = new FormData();
    fd.set("provider", provider);
    fd.set("cle", cle);
    fd.set("label", label);
    startTransition(async () => {
      try {
        await saveAction(fd);
        setCle("");
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement.");
      }
    });
  };

  return (
    <div className="card" style={{ padding: "1.2rem 1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <span style={{ fontSize: "1rem", fontWeight: 800, color: "white", marginRight: "0.5rem" }}>{nom}</span>
          <span className="subtle" style={{ fontSize: "0.8rem" }}>{desc}</span>
        </div>
        <span className={`pill ${credential?.checkOk ? "pill-success" : relie ? "pill-on" : ""}`} style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
          {relie ? (credential?.checkOk === false ? "non éprouvée" : credential?.checkOk === null ? "non vérifiable" : "relié") : "non relié"}
        </span>
      </div>

      {credential && (
        <p className="subtle" style={{ fontSize: "0.78rem", marginBottom: "0.7rem" }}>
          Se terminant par …{credential.hint}.{credential.checkNote ? " " + credential.checkNote : ""}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.75rem", flex: "1 1 260px" }}>
          <span className="subtle">Clé d&apos;accès</span>
          <input
            type="password"
            value={cle}
            onChange={(e) => setCle(e.target.value)}
            placeholder={relie ? "Remplacer la clé…" : "Coller la clé…"}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.75rem", flex: "1 1 160px" }}>
          <span className="subtle">Libellé</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optionnel" style={inputStyle} />
        </label>
        <button type="submit" className="btn-primary" disabled={isPending || cle.length < 8} style={{ fontSize: "0.82rem" }}>
          {isPending ? "Connexion…" : "Connecter"}
        </button>
      </form>

      {erreur && (
        <p style={{ color: "#fca5a5", fontSize: "0.78rem", marginTop: "0.6rem" }}>{erreur}</p>
      )}
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
