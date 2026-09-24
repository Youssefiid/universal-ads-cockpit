"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { SupermetricsSyncModal } from "@/components/SupermetricsSyncModal";
import type { Platform } from "@/lib/types";

const PLATEFORMES: { key: Platform; label: string }[] = [
  { key: "meta", label: "Meta Ads Graph API (Facebook & Instagram)" },
  { key: "google", label: "Google Ads API (Search, PMax, YouTube)" },
  { key: "tiktok", label: "TikTok Marketing Partner API" },
  { key: "linkedin", label: "LinkedIn Campaign Manager API" },
];

/**
 * Le hub Supermetrics, reconstruit sur des faits.
 *
 * L'écran précédent affichait "4/4 régies connectées, 100% opérationnel",
 * "11 comptes publicitaires liés" et "Token valide jusqu'en 2027" sur
 * chacune des quatre régies, sans qu'aucune clé ne soit jamais enregistrée
 * nulle part. Ici : une clé réellement enregistrée ou non, un nombre de
 * comptes réellement rattachés par régie, et une recherche qui interroge
 * Supermetrics pour de vrai plutôt que de rejouer un journal figé.
 */
export function SupermetricsHubClient({
  credential,
  accountCounts,
  isAdmin,
}: {
  credential: { hint: string; checkedAt: Date | null; checkOk: boolean | null; checkNote: string | null } | null;
  accountCounts: { platform: Platform; count: number }[];
  isAdmin: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const countByPlatform = new Map(accountCounts.map((a) => [a.platform, a.count]));
  const totalComptes = accountCounts.reduce((a, c) => a + c.count, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span className={`pill ${credential?.checkOk ? "pill-success" : "pill-on"}`} style={{ fontSize: "0.75rem" }}>
              {credential ? (credential.checkOk ? "Clé éprouvée" : "Clé enregistrée, non éprouvée") : "Aucune clé"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Hub de Connecteurs Supermetrics
          </h1>
          <p className="subtle" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Découverte de comptes réels · aucune ingestion automatique branchée (import par fichier)
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ fontSize: "0.82rem" }}
            disabled={!credential}
            title={credential ? undefined : "Enregistrez une clé d'abord"}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Chercher des comptes
          </button>
        </div>
      </div>

      {/* Statut de clé — la clé elle-même se pose depuis Connecteurs */}
      <div className="card" style={{ marginBottom: "1.4rem", padding: "1.2rem 1.4rem" }}>
        <h2 className="card-title" style={{ marginBottom: "0.4rem" }}>Clé Supermetrics de l&apos;agence</h2>
        <p className="subtle" style={{ fontSize: "0.82rem", marginBottom: "0.9rem" }}>
          {credential
            ? `Clé en place, se terminant par …${credential.hint}.${credential.checkNote ? " " + credential.checkNote : ""}`
            : "Aucune clé enregistrée : la découverte de comptes restera indisponible tant qu'une clé n'est pas posée."}
        </p>
        {isAdmin ? (
          <Link href="/connecteurs" className="btn-secondary" style={{ fontSize: "0.82rem", display: "inline-flex" }}>
            {credential ? "Remplacer la clé dans Connecteurs" : "Poser la clé dans Connecteurs"}
          </Link>
        ) : (
          <p className="subtle" style={{ fontSize: "0.78rem" }}>
            Seul un administrateur peut poser ou remplacer cette clé, depuis Connecteurs.
          </p>
        )}
      </div>

      {/* Summary KPI Banner — chiffres réels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginBottom: "1.6rem" }}>
        <div className="card" style={{ padding: "1.2rem" }}>
          <span className="subtle" style={{ fontSize: "0.75rem" }}>Comptes publicitaires liés</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: "0.3rem 0" }}>{totalComptes}</div>
          <span className="subtle" style={{ fontSize: "0.7rem" }}>Tous clients, toutes régies confondues</span>
        </div>
        <div className="card" style={{ padding: "1.2rem" }}>
          <span className="subtle" style={{ fontSize: "0.75rem" }}>Sortie Données</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#38bdf8", margin: "0.3rem 0" }}>Looker Studio</div>
          <span className="pill pill-on" style={{ fontSize: "0.7rem" }}>Feed JSON actif</span>
        </div>
      </div>

      {/* Connectors Grid — statut réel par régie */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
        {PLATEFORMES.map((p) => {
          const nb = countByPlatform.get(p.key) ?? 0;
          return (
            <div key={p.key} className="card" style={{ padding: "1.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.06)", padding: "0.6rem", borderRadius: "10px" }}>
                    <PlatformIcon platform={p.key} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>{p.label}</h3>
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem",
                        color: credential?.checkOk ? "#10b981" : "#f59e0b", marginTop: "0.15rem",
                      }}
                    >
                      {credential?.checkOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{credential?.checkOk ? "Clé éprouvée pour l'agence" : "Clé non éprouvée"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="subtle">Comptes rattachés à un client :</span>
                  <strong>{nb}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SupermetricsSyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
