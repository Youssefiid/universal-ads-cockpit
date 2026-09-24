"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Share2,
  Cpu,
  Users,
  Compass,
  UserCog,
  Plug,
  ShieldCheck,
  UploadCloud
} from "lucide-react";

export function Sidebar({ role }: { role: "admin" | "member" }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Cockpit Overview", href: "/", icon: LayoutDashboard },
    { label: "Looker Studio Live", href: "/looker", icon: Layers },
    { label: "Comptes Clients", href: "/clients", icon: Users },
    { label: "Importer des données", href: "/import", icon: UploadCloud },
    ...(role === "admin" ? [{ label: "Connecteurs", href: "/connecteurs", icon: Plug }] : []),
    { label: "Hub Supermetrics", href: "/supermetrics", icon: Share2 },
    { label: "Outils MCP Agent", href: "/mcp", icon: Cpu },
    { label: "Didacticiel Pas-à-Pas", href: "/onboarding", icon: Compass },
    { label: "Profil", href: "/profil", icon: UserCog },
    ...(role === "admin" ? [{ label: "Équipe", href: "/equipe", icon: ShieldCheck }] : []),
  ];

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "calc(100vh - 60px)",
        background: "rgba(11, 15, 25, 0.6)",
        borderRight: "1px solid var(--border)",
        padding: "1.4rem 1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", padding: "0 0.6rem 0.6rem", letterSpacing: "0.05em" }}>
          Cockpit Unifié
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "#94a3b8",
                background: isActive ? "rgba(99, 102, 241, 0.16)" : "transparent",
                border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <Icon className="w-4 h-4" style={{ color: isActive ? "#818cf8" : "#64748b" }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Integration Status Card */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(10, 15, 26, 0.9) 100%)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "0.9rem",
          fontSize: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span style={{ fontWeight: 700, color: "#f8fafc" }}>Brique All-in-One</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
        </div>
        <p className="subtle" style={{ fontSize: "0.72rem", marginBottom: "0.6rem", lineHeight: 1.4 }}>
          Passerelle Looker Studio, Supermetrics & MCP Server prête sur port 3001.
        </p>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <span className="pill pill-on" style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }}>
            JSON Feed
          </span>
          <span className="pill pill-on" style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }}>
            MCP Tool
          </span>
        </div>
      </div>
    </aside>
  );
}
