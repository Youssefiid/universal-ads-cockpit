import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Universal Ads Cockpit · Looker Studio & Supermetrics MCP",
  description: "Unified high-performance Ads Cockpit connecting Looker Studio, Supermetrics, and AI agents via MCP.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-theme="dark">
      <body>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Header />
          <div style={{ display: "flex", flex: 1 }}>
            <Sidebar />
            <main style={{ flex: 1, padding: "1.8rem 2.2rem", overflowX: "hidden" }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
