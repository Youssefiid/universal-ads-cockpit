"use client";

import React, { useMemo, useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { CHAMPS_CIBLES, LIBELLE_CHAMP, type ChampCible, type LigneBrute, type Mapping } from "@/lib/importFields";

type PlatformAccountOption = { id: string; platform: string; displayName: string };
type ClientOption = { id: string; name: string; currency: string; platformAccounts: PlatformAccountOption[] };

type ImportHistoryRow = {
  id: string;
  fileName: string;
  format: string;
  remark: string | null;
  rowsImported: number;
  rowsSkipped: number;
  importedAt: string | Date;
  client: { name: string };
  platformAccount: { displayName: string; platform: string };
  importedBy: { email: string; name: string | null };
};

type AnalyseResultat = {
  format: string;
  headers: string[];
  sampleRows: LigneBrute[];
  totalRows: number;
  suggestedMapping: Mapping;
  aiAvailable: boolean;
  aiError: string | null;
};

type ConfirmResultat = {
  rowsImported: number;
  rowsSkipped: number;
  doublons: number;
  skippedSamples: { ligne: number; raison: string }[];
};

/**
 * Assistant d'import CSV/Excel/XML : upload -> analyse (parsing + suggestion
 * IA du mapping des colonnes, jamais appliquée sans relecture) -> relecture
 * humaine du mapping avec une remarque libre -> confirmation. Le fichier
 * n'est jamais écrit en base avant l'étape de confirmation explicite.
 */
export function ImportClient({ clients, imports }: { clients: ClientOption[]; imports: ImportHistoryRow[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const client = clients.find((c) => c.id === clientId);
  const [platformAccountId, setPlatformAccountId] = useState(client?.platformAccounts[0]?.id ?? "");

  const [fichier, setFichier] = useState<File | null>(null);
  const [analyse, setAnalyse] = useState<AnalyseResultat | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [remarque, setRemarque] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ConfirmResultat | null>(null);

  const comptesDuClient = client?.platformAccounts ?? [];

  function choisirClient(id: string) {
    setClientId(id);
    const c = clients.find((cl) => cl.id === id);
    setPlatformAccountId(c?.platformAccounts[0]?.id ?? "");
    reinitialiser();
  }

  function reinitialiser() {
    setFichier(null);
    setAnalyse(null);
    setMapping({});
    setRemarque("");
    setErreur(null);
    setResultat(null);
  }

  async function analyserFichier(f: File) {
    setFichier(f);
    setAnalyse(null);
    setResultat(null);
    setErreur(null);
    setEnCours(true);
    try {
      const fd = new FormData();
      fd.set("file", f);
      fd.set("clientId", clientId);
      fd.set("platformAccountId", platformAccountId);
      const res = await fetch("/api/import/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'analyse.");
      setAnalyse(data);
      setMapping(data.suggestedMapping ?? {});
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Échec de l'analyse.");
    } finally {
      setEnCours(false);
    }
  }

  async function confirmer() {
    if (!fichier) return;
    setEnCours(true);
    setErreur(null);
    try {
      const fd = new FormData();
      fd.set("file", fichier);
      fd.set("clientId", clientId);
      fd.set("platformAccountId", platformAccountId);
      fd.set("mapping", JSON.stringify(mapping));
      fd.set("remark", remarque);
      const res = await fetch("/api/import/confirm", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'import.");
      setResultat(data);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Échec de l'import.");
    } finally {
      setEnCours(false);
    }
  }

  const auMoinsUneMetriqueMappee = useMemo(
    () => Object.values(mapping).some((c) => ["cost", "impressions", "clicks", "conversions"].includes(c)),
    [mapping],
  );
  const dateMappee = useMemo(() => Object.values(mapping).includes("date"), [mapping]);
  const peutConfirmer = dateMappee && auMoinsUneMetriqueMappee && !enCours;

  return (
    <div>
      <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", marginBottom: "0.3rem" }}>
        Importer des données
      </h1>
      <p className="subtle" style={{ fontSize: "0.85rem", marginBottom: "1.4rem", maxWidth: "760px" }}>
        CSV, Excel (.xlsx) ou XML. L&apos;IA suggère à quels champs correspondent vos colonnes ; rien n&apos;est
        écrit en base tant que vous n&apos;avez pas relu et confirmé le mapping.
      </p>

      <div className="card" style={{ padding: "1.2rem 1.4rem", marginBottom: "1.4rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
          <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
            <span className="subtle">Client</span>
            <select value={clientId} onChange={(e) => choisirClient(e.target.value)} style={inputStyle}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem" }}>
            <span className="subtle">Compte publicitaire</span>
            <select value={platformAccountId} onChange={(e) => { setPlatformAccountId(e.target.value); reinitialiser(); }} style={inputStyle} disabled={comptesDuClient.length === 0}>
              {comptesDuClient.length === 0 && <option value="">Aucun compte connecté pour ce client</option>}
              {comptesDuClient.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
            </select>
          </label>
        </div>

        {!fichier && (
          <label
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem",
              border: "1px dashed var(--border-light)", borderRadius: "10px", padding: "2rem",
              cursor: comptesDuClient.length ? "pointer" : "not-allowed", opacity: comptesDuClient.length ? 1 : 0.5,
            }}
          >
            <UploadCloud className="w-8 h-8 text-indigo-400" />
            <span style={{ fontWeight: 600, color: "white" }}>Choisir un fichier CSV, Excel ou XML</span>
            <span className="subtle" style={{ fontSize: "0.75rem" }}>Une ligne d&apos;en-têtes est requise (CSV/Excel).</span>
            <input
              type="file"
              accept=".csv,.tsv,.xlsx,.xls,.xml"
              disabled={!comptesDuClient.length}
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) analyserFichier(f); }}
            />
          </label>
        )}

        {fichier && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileSpreadsheet className="w-4 h-4 text-sky-400" />
              <span style={{ fontSize: "0.85rem" }}>{fichier.name}</span>
            </div>
            <button type="button" onClick={reinitialiser} className="btn-secondary" style={{ fontSize: "0.78rem" }}>
              Changer de fichier
            </button>
          </div>
        )}

        {enCours && !analyse && <p className="subtle" style={{ fontSize: "0.82rem", marginTop: "0.8rem" }}>Analyse en cours…</p>}
        {erreur && (
          <p style={{ color: "#fca5a5", fontSize: "0.82rem", marginTop: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertTriangle className="w-4 h-4" /> {erreur}
          </p>
        )}
      </div>

      {analyse && !resultat && (
        <div className="card" style={{ padding: "1.2rem 1.4rem", marginBottom: "1.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 className="card-title">Mapping des colonnes ({analyse.totalRows} lignes détectées)</h2>
            {analyse.aiAvailable ? (
              <span className="pill pill-success" style={{ fontSize: "0.72rem" }}>Suggéré par l&apos;IA — à vérifier</span>
            ) : (
              <span className="pill pill-on" style={{ fontSize: "0.72rem" }}>Aucune clé IA : mapping manuel</span>
            )}
          </div>
          {analyse.aiError && <p className="subtle" style={{ fontSize: "0.78rem", marginBottom: "0.8rem" }}>Suggestion IA indisponible : {analyse.aiError}</p>}

          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "#94a3b8" }}>
                  <th style={{ padding: "0.5rem 0.6rem" }}>Colonne du fichier</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>Champ du cockpit</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>Exemple</th>
                </tr>
              </thead>
              <tbody>
                {analyse.headers.map((h) => (
                  <tr key={h} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.5rem 0.6rem", fontFamily: "monospace", color: "#818cf8" }}>{h}</td>
                    <td style={{ padding: "0.5rem 0.6rem" }}>
                      <select
                        value={mapping[h] ?? "ignore"}
                        onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value as ChampCible }))}
                        style={{ ...inputStyle, padding: "0.35rem 0.5rem", fontSize: "0.78rem" }}
                      >
                        {CHAMPS_CIBLES.map((c) => <option key={c} value={c}>{LIBELLE_CHAMP[c]}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "#94a3b8" }}>{analyse.sampleRows[0]?.[h] ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!dateMappee && <p style={{ color: "#f59e0b", fontSize: "0.78rem", marginBottom: "0.5rem" }}>Mappez une colonne sur « Date » pour continuer.</p>}
          {dateMappee && !auMoinsUneMetriqueMappee && (
            <p style={{ color: "#f59e0b", fontSize: "0.78rem", marginBottom: "0.5rem" }}>Mappez au moins une métrique (dépense, impressions, clics ou conversions).</p>
          )}

          <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.78rem", marginBottom: "1rem" }}>
            <span className="subtle">Remarque sur cet import (contexte, période partielle, particularités…)</span>
            <textarea
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" as const }}
              placeholder="Optionnel"
            />
          </label>

          <button type="button" onClick={confirmer} disabled={!peutConfirmer} className="btn-primary" style={{ fontSize: "0.85rem" }}>
            {enCours ? "Import en cours…" : "Confirmer l'import"}
          </button>
        </div>
      )}

      {resultat && (
        <div className="card" style={{ padding: "1.2rem 1.4rem", marginBottom: "1.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem" }}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="card-title">Import terminé</h2>
          </div>
          <p style={{ fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <strong>{resultat.rowsImported}</strong> ligne(s) importée(s), <strong>{resultat.rowsSkipped}</strong> ignorée(s)
            {resultat.doublons > 0 && `, ${resultat.doublons} doublon(s) (dernière occurrence conservée)`}.
          </p>
          {resultat.skippedSamples.length > 0 && (
            <details style={{ marginTop: "0.6rem" }}>
              <summary style={{ cursor: "pointer", fontSize: "0.78rem", color: "#94a3b8" }}>
                Voir les lignes ignorées ({resultat.skippedSamples.length}{resultat.rowsSkipped > resultat.skippedSamples.length ? "+" : ""})
              </summary>
              <ul style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "0.5rem", paddingLeft: "1.2rem" }}>
                {resultat.skippedSamples.map((s, i) => <li key={i}>Ligne {s.ligne} : {s.raison}</li>)}
              </ul>
            </details>
          )}
          <button type="button" onClick={reinitialiser} className="btn-secondary" style={{ fontSize: "0.82rem", marginTop: "1rem" }}>
            Importer un autre fichier
          </button>
        </div>
      )}

      {imports.length > 0 && (
        <div className="card" style={{ padding: "1.2rem 1.4rem" }}>
          <h2 className="card-title" style={{ marginBottom: "0.8rem" }}>Imports récents</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {imports.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.8rem", flexWrap: "wrap", gap: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <PlatformIcon platform={i.platformAccount.platform} className="w-4 h-4" />
                  <div>
                    <div style={{ color: "white", fontWeight: 600 }}>{i.fileName} <span className="subtle" style={{ fontWeight: 400 }}>· {i.client.name} · {i.platformAccount.displayName}</span></div>
                    {i.remark && <div className="subtle" style={{ fontSize: "0.75rem", marginTop: "0.1rem" }}>“{i.remark}”</div>}
                  </div>
                </div>
                <div className="subtle" style={{ fontSize: "0.75rem", textAlign: "right" }}>
                  {i.rowsImported} ligne(s) · {i.importedBy.name ?? i.importedBy.email} · {new Date(i.importedAt).toLocaleDateString("fr-FR")}
                </div>
              </div>
            ))}
          </div>
        </div>
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
