import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/access";

export const metadata: Metadata = {
  title: "Universal Ads Cockpit · Looker Studio & Supermetrics MCP",
  description: "Unified high-performance Ads Cockpit connecting Looker Studio, Supermetrics, and AI agents via MCP.",
};

/**
 * La maquette Antigravity n'avait pas d'écran de connexion : le chrome
 * (Header + Sidebar) s'affichait partout sans condition. Avec une vraie
 * session, /login doit rester un écran nu — sinon la barre latérale et le
 * bouton de déconnexion s'affichent autour du formulaire avant même que le
 * visiteur soit identifié.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="fr" data-theme="dark">
      <body>
        {session ? (
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Header />
            <div style={{ display: "flex", flex: 1 }}>
              <Sidebar role={session.role} />
              <main style={{ flex: 1, padding: "1.8rem 2.2rem", overflowX: "hidden" }}>
                {children}
              </main>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
