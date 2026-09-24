import { login } from "@/lib/actions";

const ERREUR_LABEL: Record<string, string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  trop_de_tentatives: "Trop d'essais échoués sur cette adresse. Réessayez dans quelques minutes.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-page)",
        padding: "1.5rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.4rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
            }}
          >
            U
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "white" }}>
            Universal Ads Cockpit
          </span>
        </div>

        <h1 className="card-title" style={{ marginBottom: "0.3rem" }}>
          Connexion
        </h1>
        <p className="subtle" style={{ marginBottom: "1.2rem", fontSize: "0.85rem" }}>
          Accès réservé à l&apos;équipe de l&apos;agence.
        </p>

        {erreur && (
          <p
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              borderRadius: "8px",
              padding: "0.6rem 0.8rem",
              fontSize: "0.82rem",
              marginBottom: "1rem",
            }}
          >
            {ERREUR_LABEL[erreur] ?? "Connexion impossible."}
          </p>
        )}

        <form action={login} style={{ display: "grid", gap: "0.8rem" }}>
          <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.82rem" }}>
            <span className="subtle">Adresse</span>
            <input
              type="email"
              name="email"
              required
              autoFocus
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-light)",
                borderRadius: "8px",
                padding: "0.55rem 0.7rem",
                color: "white",
                fontSize: "0.9rem",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "0.3rem", fontSize: "0.82rem" }}>
            <span className="subtle">Mot de passe</span>
            <input
              type="password"
              name="password"
              required
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-light)",
                borderRadius: "8px",
                padding: "0.55rem 0.7rem",
                color: "white",
                fontSize: "0.9rem",
              }}
            />
          </label>
          <button type="submit" className="btn-primary" style={{ justifyContent: "center", marginTop: "0.4rem" }}>
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
