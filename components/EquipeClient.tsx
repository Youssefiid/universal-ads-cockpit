"use client";

import React, { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import type { UtilisateurAvecAssignations } from "@/lib/queries";

type ClientOption = { id: string; name: string };

/**
 * Utilisateurs de l'agence : un admin voit tous les clients sans assignation
 * (accès global), un traffic manager (member) ne voit que les clients
 * listés ici pour lui. Les assignations sont réelles (table
 * ClientAssignment), pas une case à cocher qui ne fait rien.
 */
export function EquipeClient({
  utilisateurs,
  clients,
  currentUserId,
  createAction,
  assignAction,
  unassignAction,
  resetPasswordAction,
  toggleActivationAction,
}: {
  utilisateurs: UtilisateurAvecAssignations[];
  clients: ClientOption[];
  currentUserId: string;
  createAction: (formData: FormData) => Promise<void>;
  assignAction: (formData: FormData) => Promise<void>;
  unassignAction: (formData: FormData) => Promise<void>;
  resetPasswordAction: (formData: FormData) => Promise<void>;
  toggleActivationAction: (formData: FormData) => Promise<void>;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Équipe
          </h1>
          <p className="subtle" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Utilisateurs de l&apos;agence, leur rôle et les clients qui leur sont assignés
          </p>
        </div>
        <button type="button" onClick={() => setIsFormOpen((v) => !v)} className="btn-primary" style={{ fontSize: "0.82rem" }}>
          <Plus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {isFormOpen && <CreerUtilisateurForm action={createAction} onDone={() => setIsFormOpen(false)} />}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {utilisateurs.map((u) => (
          <UtilisateurCard
            key={u.id}
            utilisateur={u}
            clients={clients}
            estSoiMeme={u.id === currentUserId}
            assignAction={assignAction}
            unassignAction={unassignAction}
            resetPasswordAction={resetPasswordAction}
            toggleActivationAction={toggleActivationAction}
          />
        ))}
      </div>
    </div>
  );
}

function UtilisateurCard({
  utilisateur,
  clients,
  estSoiMeme,
  assignAction,
  unassignAction,
  resetPasswordAction,
  toggleActivationAction,
}: {
  utilisateur: UtilisateurAvecAssignations;
  clients: ClientOption[];
  estSoiMeme: boolean;
  assignAction: (formData: FormData) => Promise<void>;
  unassignAction: (formData: FormData) => Promise<void>;
  resetPasswordAction: (formData: FormData) => Promise<void>;
  toggleActivationAction: (formData: FormData) => Promise<void>;
}) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [clientChoisi, setClientChoisi] = useState("");

  const assignesIds = new Set(utilisateur.clientsAssignes.map((c) => c.id));
  const disponibles = clients.filter((c) => !assignesIds.has(c.id));
  const estAdmin = utilisateur.role === "admin";
  const desactive = !!utilisateur.deactivatedAt;

  const run = (fd: FormData, action: (fd: FormData) => Promise<void>, onOk?: () => void) => {
    setErreur(null);
    startTransition(async () => {
      try {
        await action(fd);
        onOk?.();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Échec de l'opération.");
      }
    });
  };

  return (
    <div className="card" style={{ padding: "1.2rem 1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
        <div>
          <span style={{ fontSize: "1.02rem", fontWeight: 800, color: "white", marginRight: "0.6rem" }}>
            {utilisateur.name ?? utilisateur.email}
          </span>
          <span className="subtle" style={{ fontSize: "0.82rem" }}>{utilisateur.email}</span>
        </div>
        <span className={`pill ${estAdmin ? "pill-on" : "pill-success"}`} style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
          {estAdmin ? "Administrateur" : "Traffic manager"}
        </span>
      </div>

      {desactive && (
        <p style={{ color: "#f59e0b", fontSize: "0.78rem", marginBottom: "0.5rem" }}>Compte désactivé.</p>
      )}

      {estAdmin ? (
        <p className="subtle" style={{ fontSize: "0.82rem", marginBottom: "0.6rem" }}>
          Administrateur : accès à tous les clients, sans assignation.
        </p>
      ) : (
        <div style={{ marginBottom: "0.6rem" }}>
          <span className="subtle" style={{ fontSize: "0.8rem" }}>Clients assignés</span>
          {utilisateur.clientsAssignes.length === 0 ? (
            <p className="subtle" style={{ fontSize: "0.82rem", marginTop: "0.15rem" }}>Aucun pour l&apos;instant.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.35rem" }}>
              {utilisateur.clientsAssignes.map((c) => (
                <span key={c.id} className="chip" style={{ fontSize: "0.75rem", gap: "0.4rem" }}>
                  {c.name}
                  <button
                    type="button"
                    onClick={() => run(mkFd({ userId: utilisateur.id, clientId: c.id }), unassignAction)}
                    disabled={isPending}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}
                    title="Retirer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <details open={isAssignOpen} onToggle={(e) => setIsAssignOpen(e.currentTarget.open)} style={{ marginTop: "0.5rem" }}>
            <summary style={{ cursor: "pointer", fontSize: "0.78rem", color: "#94a3b8" }}>
              + Assigner un client ({disponibles.length} disponible{disponibles.length > 1 ? "s" : ""})
            </summary>
            {disponibles.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <select value={clientChoisi} onChange={(e) => setClientChoisi(e.target.value)} style={inputStyle}>
                  <option value="">Choisir un client…</option>
                  {disponibles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button
                  type="button"
                  disabled={!clientChoisi || isPending}
                  onClick={() => run(mkFd({ userId: utilisateur.id, clientId: clientChoisi }), assignAction, () => setClientChoisi(""))}
                  className="btn-secondary"
                  style={{ fontSize: "0.78rem" }}
                >
                  Assigner
                </button>
              </div>
            )}
          </details>
        </div>
      )}

      <details open={isResetOpen} onToggle={(e) => setIsResetOpen(e.currentTarget.open)} style={{ marginBottom: "0.8rem" }}>
        <summary style={{ cursor: "pointer", fontSize: "0.78rem", color: "#94a3b8" }}>Réinitialiser le mot de passe</summary>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="password"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            placeholder="Nouveau mot de passe (10 caractères min.)"
            style={{ ...inputStyle, flex: "1 1 240px" }}
          />
          <button
            type="button"
            disabled={nouveauMotDePasse.length < 10 || isPending}
            onClick={() => run(mkFd({ userId: utilisateur.id, password: nouveauMotDePasse }), resetPasswordAction, () => setNouveauMotDePasse(""))}
            className="btn-secondary"
            style={{ fontSize: "0.78rem" }}
          >
            Réinitialiser
          </button>
        </div>
      </details>

      {!estSoiMeme && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(mkFd({ userId: utilisateur.id }), toggleActivationAction)}
          className="btn-secondary"
          style={{ fontSize: "0.8rem", borderColor: desactive ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)", color: desactive ? "#34d399" : "#f87171" }}
        >
          {desactive ? "Réactiver ce compte" : "Désactiver ce compte"}
        </button>
      )}

      {erreur && <p style={{ color: "#fca5a5", fontSize: "0.78rem", marginTop: "0.5rem" }}>{erreur}</p>}
    </div>
  );
}

function mkFd(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function CreerUtilisateurForm({
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
      <h2 className="card-title">Nouvel utilisateur</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
          <span className="subtle">Nom</span>
          <input name="name" style={inputStyle} placeholder="Ex : Traffic Manager" />
        </label>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
          <span className="subtle">Adresse</span>
          <input name="email" type="email" required style={inputStyle} placeholder="ex@agence.test" />
        </label>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
          <span className="subtle">Mot de passe (10 caractères min.)</span>
          <input name="password" type="password" required minLength={10} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
          <span className="subtle">Rôle</span>
          <select name="role" defaultValue="member" style={inputStyle}>
            <option value="member">Traffic manager</option>
            <option value="admin">Administrateur</option>
          </select>
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button type="button" onClick={onDone} className="btn-secondary" style={{ fontSize: "0.82rem" }}>Annuler</button>
        <button type="submit" disabled={isPending} className="btn-primary" style={{ fontSize: "0.82rem" }}>
          {isPending ? "Création…" : "Créer l'utilisateur"}
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
