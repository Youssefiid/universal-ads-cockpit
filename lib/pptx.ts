import pptxgen from "pptxgenjs";
import type { Client } from "./types";
import { libelleReseau } from "./networks";

const PLATFORM_LABEL: Record<string, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PAUSED: "En pause",
  LEARNING: "Apprentissage",
  OPTIMIZING: "Optimisation",
};

const ENCRE = "0F172A";
const ACCENT = "6366F1";
const GRIS = "64748B";

function formateur(devise: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise, maximumFractionDigits: 0 });
}

/** Les conversions sont des Decimal Postgres sommés côté JS : arrondir à une
 * décimale évite d'afficher le bruit binaire ("620.2300000000001") dans un
 * document destiné à être partagé tel quel. */
function conv(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n);
}

function pied(slide: pptxgen.Slide, genereLe: Date) {
  slide.addText(
    `Généré le ${genereLe.toLocaleDateString("fr-FR")} à partir des métriques mesurées, sans estimation ni donnée simulée.`,
    { x: 0.4, y: 5.25, w: 9.2, h: 0.3, fontSize: 8, color: GRIS, italic: true, align: "left" },
  );
}

/**
 * Rapport de performance d'un client, en PPTX, à partir des mêmes chiffres
 * que la page /clients/[id] — jamais une donnée composée pour l'export. Un
 * client sans campagne mesurée le dit explicitement plutôt que de laisser
 * une diapositive vide sans explication.
 */
export async function genererRapportClientPptx(client: Client): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Universal Ads Cockpit";
  pptx.title = `Rapport de performance — ${client.name}`;

  const money = formateur(client.currency);
  const genereLe = new Date();
  const spendPercent = client.monthlyBudget > 0 ? Math.round((client.totalSpend / client.monthlyBudget) * 100) : 0;

  // Slide 1 — Titre
  const titre = pptx.addSlide();
  titre.background = { color: ENCRE };
  titre.addText("Rapport de Performance", { x: 0.6, y: 1.7, w: 8.8, h: 0.7, fontSize: 30, bold: true, color: "FFFFFF" });
  titre.addText(client.name, { x: 0.6, y: 2.35, w: 8.8, h: 0.6, fontSize: 22, color: ACCENT, bold: true });
  titre.addText(client.category, { x: 0.6, y: 2.85, w: 8.8, h: 0.4, fontSize: 14, color: "CBD5E1" });
  titre.addText(
    `Fenêtre mesurée : 30 derniers jours · Devise : ${client.currency}`,
    { x: 0.6, y: 3.3, w: 8.8, h: 0.4, fontSize: 12, color: "94A3B8" },
  );
  titre.addText(`Généré le ${genereLe.toLocaleDateString("fr-FR")}`, { x: 0.6, y: 5.0, w: 8.8, h: 0.3, fontSize: 10, color: "64748B" });

  // Slide 2 — KPIs mesurés
  const kpi = pptx.addSlide();
  kpi.addText("KPIs mesurés", { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: ENCRE });

  const cartes: { label: string; valeur: string; sousTexte?: string }[] = [
    { label: "Dépense (30j)", valeur: money.format(client.totalSpend) },
    { label: "Chiffre d'affaires tracké", valeur: money.format(client.totalRevenue) },
    { label: "ROAS", valeur: `${client.roas}x` },
    { label: "Conversions", valeur: conv(client.totalConversions) },
    { label: "Score de santé", valeur: `${client.healthScore}/100` },
    { label: "Budget mensuel engagé", valeur: `${spendPercent}%`, sousTexte: `${money.format(client.totalSpend)} / ${money.format(client.monthlyBudget)}` },
  ];

  const colWidth = 2.9;
  const rowHeight = 1.5;
  cartes.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * (colWidth + 0.15);
    const y = 1.0 + row * (rowHeight + 0.15);
    kpi.addShape("roundRect", { x, y, w: colWidth, h: rowHeight, fill: { color: "F1F5F9" }, line: { color: "E2E8F0", width: 1 }, rectRadius: 0.08 });
    kpi.addText(c.label, { x: x + 0.15, y: y + 0.15, w: colWidth - 0.3, h: 0.35, fontSize: 11, color: GRIS });
    kpi.addText(c.valeur, { x: x + 0.15, y: y + 0.5, w: colWidth - 0.3, h: 0.55, fontSize: 22, bold: true, color: ENCRE });
    if (c.sousTexte) {
      kpi.addText(c.sousTexte, { x: x + 0.15, y: y + 1.05, w: colWidth - 0.3, h: 0.35, fontSize: 9, color: GRIS });
    }
  });
  pied(kpi, genereLe);

  // Slide 3 — Campagnes mesurées
  const camp = pptx.addSlide();
  camp.addText("Campagnes mesurées", { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: ENCRE });

  if (client.campaigns.length === 0) {
    camp.addText("Aucune campagne mesurée sur la période.", { x: 0.4, y: 1.2, w: 9.2, h: 0.5, fontSize: 13, color: GRIS, italic: true });
  } else {
    const enTete: pptxgen.TableRow = [
      { text: "Campagne", options: { bold: true, fill: { color: ENCRE }, color: "FFFFFF", fontSize: 10 } },
      { text: "Régie", options: { bold: true, fill: { color: ENCRE }, color: "FFFFFF", fontSize: 10 } },
      { text: "Statut", options: { bold: true, fill: { color: ENCRE }, color: "FFFFFF", fontSize: 10 } },
      { text: "Dépense", options: { bold: true, fill: { color: ENCRE }, color: "FFFFFF", fontSize: 10 } },
      { text: "Conversions", options: { bold: true, fill: { color: ENCRE }, color: "FFFFFF", fontSize: 10 } },
      { text: "ROAS", options: { bold: true, fill: { color: ENCRE }, color: "FFFFFF", fontSize: 10 } },
      { text: "CPA", options: { bold: true, fill: { color: ENCRE }, color: "FFFFFF", fontSize: 10 } },
    ];

    const lignes: pptxgen.TableRow[] = client.campaigns.map((c) => [
      { text: c.name, options: { fontSize: 9 } },
      {
        text: libelleReseau(c.platform, c.network)
          ? `${PLATFORM_LABEL[c.platform] ?? c.platform} · ${libelleReseau(c.platform, c.network)}`
          : PLATFORM_LABEL[c.platform] ?? c.platform,
        options: { fontSize: 9 },
      },
      { text: STATUS_LABEL[c.status] ?? c.status, options: { fontSize: 9 } },
      { text: money.format(c.spend), options: { fontSize: 9, align: "right" } },
      { text: conv(c.conversions), options: { fontSize: 9, align: "right" } },
      { text: c.conversions > 0 ? `${c.roas}x` : "—", options: { fontSize: 9, align: "right" } },
      { text: c.conversions > 0 ? money.format(c.cpa) : "—", options: { fontSize: 9, align: "right" } },
    ]);

    camp.addTable([enTete, ...lignes], {
      x: 0.4,
      y: 1.0,
      w: 9.2,
      colW: [2.6, 1.3, 1.3, 1.2, 1.0, 0.9, 0.9],
      border: { type: "solid", color: "E2E8F0", pt: 0.5 },
      autoPage: true,
    });
  }
  pied(camp, genereLe);

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return buffer as Buffer;
}
