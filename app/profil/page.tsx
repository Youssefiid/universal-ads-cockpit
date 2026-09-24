import { redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { enregistrerClePersonnelle } from "@/lib/actions";

const FOURNISSEURS: { id: "anthropic" | "openai" | "google"; nom: string; desc: string }[] = [
  { id: "anthropic", nom: "Claude (Anthropic)", desc: "Alimente le Copilot IA du cockpit, cadré sur les métriques mesurées." },
  { id: "openai", nom: "GPT (OpenAI)", desc: "Fournisseur alternatif pour les mêmes fonctions IA." },
  { id: "google", nom: "Gemini (Google)", desc: "Fournisseur alternatif pour les mêmes fonctions IA." },
];

export default async function ProfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cles = await prismaApp.userConnectorCredential.findMany({
    where: { userId: session.userId },
    select: { provider: true, hint: true, checkedAt: true, checkOk: true, checkNote: true },
  });
  const cleParFournisseur = new Map(cles.map((c) => [c.provider, c]));

  return (
    <div>
      <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "white", marginBottom: "0.3rem" }}>
        Profil & Clés Personnelles
      </h1>
      <p className="subtle" style={{ fontSize: "0.85rem", marginBottom: "1.2rem", maxWidth: "640px" }}>
        Une clé posée ici est utilisée à la place de la clé d&apos;agence pour vos propres actions IA (Copilot,
        etc.). Tant que vous n&apos;en posez pas, vos actions IA utilisent la clé partagée par le staff, réglée
        dans <a href="/connecteurs" style={{ color: "#818cf8" }}>Connecteurs</a>.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "640px" }}>
        {FOURNISSEURS.map((f) => {
          const cle = cleParFournisseur.get(f.id);
          return (
            <div key={f.id} className="card" style={{ padding: "1.2rem 1.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                <div>
                  <h2 className="card-title" style={{ marginBottom: "0.15rem" }}>{f.nom}</h2>
                  <p className="subtle" style={{ fontSize: "0.78rem" }}>{f.desc}</p>
                </div>
                <span className={`pill ${cle ? "pill-success" : "pill-on"}`} style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                  {cle ? "Clé personnelle posée" : "Clé d'agence utilisée"}
                </span>
              </div>
              {cle && (
                <p className="subtle" style={{ fontSize: "0.78rem", marginBottom: "0.7rem" }}>
                  Se terminant par …{cle.hint}.{cle.checkNote ? " " + cle.checkNote : ""}
                </p>
              )}
              <form action={enregistrerClePersonnelle} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <input type="hidden" name="provider" value={f.id} />
                <input
                  type="password"
                  name="cle"
                  placeholder={cle ? "Remplacer votre clé personnelle…" : "Coller votre clé personnelle…"}
                  style={{
                    flex: "1 1 260px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                    padding: "0.55rem 0.7rem",
                    color: "white",
                    fontSize: "0.85rem",
                  }}
                />
                <button type="submit" className="btn-secondary" style={{ fontSize: "0.82rem" }}>
                  {cle ? "Remplacer" : "Enregistrer"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
