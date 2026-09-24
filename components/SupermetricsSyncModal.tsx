"use client";

import React, { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import type { Platform } from "@/lib/types";

const PLATEFORMES: { key: Platform; label: string }[] = [
  { key: "meta", label: "Meta" },
  { key: "google", label: "Google" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
];

type CompteTrouve = { id: string; name: string; group: string | null };

/**
 * Découverte réelle des comptes Supermetrics.
 *
 * Remplaçait une simulation : quatre lignes de journal écrites en dur
 * ("✓ Connexion Meta Graph API v21 : 14 280 métriques ingérées"...),
 * affichées à l'identique à chaque ouverture, qu'une clé soit enregistrée ou
 * non. Ici, le bouton appelle réellement Supermetrics
 * (`/api/supermetrics/accounts`) et affiche les comptes qu'il renvoie — ou
 * l'erreur réelle si la clé est absente ou refusée.
 *
 * Ne synchronise aucune donnée de campagne : cette brique n'a pas
 * d'ingestion automatique branchée, ici ni dans ads-dashboard. L'import se
 * fait par fichier, sur l'écran Supermetrics.
 */
export function SupermetricsSyncModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [plateforme, setPlateforme] = useState<Platform>("meta");
  const [etat, setEtat] = useState<"repos" | "chargement" | "erreur" | "resultat">("repos");
  const [comptes, setComptes] = useState<CompteTrouve[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!isOpen) return null;

  const chercher = async (p: Platform) => {
    setPlateforme(p);
    setEtat("chargement");
    try {
      const r = await fetch(`/api/supermetrics/accounts?platform=${p}`);
      const corps = await r.json();
      if (!r.ok) {
        setErreur(corps.message ?? "Aucune clé Supermetrics enregistrée. Réglez-la depuis le Hub Supermetrics.");
        setEtat("erreur");
        return;
      }
      setComptes(corps.accounts ?? []);
      setEtat("resultat");
    } catch {
      setErreur("Supermetrics n'a pas pu être joint depuis le serveur.");
      setEtat("erreur");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0b0f19",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          padding: "1.6rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.5rem", borderRadius: "10px" }}>
              <RefreshCw className={`w-5 h-5 text-indigo-400 ${etat === "chargement" ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>
                Découverte des comptes Supermetrics
              </h3>
              <p className="subtle" style={{ fontSize: "0.78rem" }}>
                Liste les comptes réels d&apos;une régie, ne synchronise aucune donnée
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Choix de la régie */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
          {PLATEFORMES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => chercher(p.key)}
              className="chip"
              style={{
                fontSize: "0.78rem",
                borderColor: plateforme === p.key ? "#6366f1" : undefined,
              }}
            >
              <PlatformIcon platform={p.key} className="w-3.5 h-3.5" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Résultat */}
        <div
          style={{
            background: "#060911",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            padding: "0.8rem",
            minHeight: "130px",
            maxHeight: "220px",
            overflowY: "auto",
            fontSize: "0.82rem",
            marginBottom: "1.2rem",
          }}
        >
          {etat === "repos" && (
            <div style={{ color: "#64748b", fontStyle: "italic", paddingTop: "2rem", textAlign: "center" }}>
              Choisissez une régie pour lister ses comptes réels.
            </div>
          )}
          {etat === "chargement" && (
            <div style={{ color: "#94a3b8", paddingTop: "2rem", textAlign: "center" }}>Recherche en cours…</div>
          )}
          {etat === "erreur" && (
            <div style={{ color: "#fca5a5", paddingTop: "1rem" }}>{erreur}</div>
          )}
          {etat === "resultat" && (
            <div style={{ display: "grid", gap: "0.4rem" }}>
              {comptes.length === 0 ? (
                <div style={{ color: "#64748b", fontStyle: "italic" }}>Aucun compte visible avec cette clé.</div>
              ) : (
                comptes.map((c) => (
                  <div
                    key={c.id}
                    style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", color: "#cbd5e1" }}
                  >
                    <span>{c.name}{c.group ? ` · ${c.group}` : ""}</span>
                    <span style={{ color: "#64748b", fontFamily: "monospace", fontSize: "0.75rem" }}>{c.id}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: "0.82rem" }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
