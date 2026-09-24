import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";

/**
 * Données de démonstration, mais mesurées : contrairement à lib/store.ts
 * (supprimé), aucun total n'est écrit à la main ici. Chaque client reçoit
 * des lignes MetricDaily jour par jour sur 60 jours ; le ROAS, le CPA, les
 * deltas et les sparklines affichés dans l'application sont calculés à
 * partir de ces lignes par lib/queries.ts, exactement comme ils le
 * seraient à partir d'un vrai import.
 */

const MOT_DE_PASSE_DEV = "cockpit-dev-2026";

function ligne(jour: number, base: { impressions: number; clicks: number; cost: number; conversions: number; conversionValue: number }, bruit: number) {
  const facteur = 1 + Math.sin(jour / 5) * bruit;
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - jour);
  return {
    date,
    granularity: "jour" as const,
    impressions: BigInt(Math.round(base.impressions * facteur)),
    clicks: BigInt(Math.round(base.clicks * facteur)),
    cost: Number((base.cost * facteur).toFixed(2)),
    conversions: Number((base.conversions * facteur).toFixed(2)),
    conversionValue: Number((base.conversionValue * facteur).toFixed(2)),
  };
}

async function seedClient(spec: {
  id: string; name: string; category: string; monthlyBudget: number;
  comptes: { platform: "meta" | "google" | "tiktok" | "linkedin"; externalAccountId: string; displayName: string }[];
  campagnes: { platform: "meta" | "google" | "tiktok" | "linkedin"; externalEntityId: string; name: string; status: "ACTIVE" | "PAUSED" | "OPTIMIZING"; budgetDaily: number; network?: string; base: { impressions: number; clicks: number; cost: number; conversions: number; conversionValue: number } }[];
}) {
  await prisma.client.upsert({
    where: { id: spec.id },
    update: {},
    create: { id: spec.id, name: spec.name, category: spec.category, monthlyBudget: spec.monthlyBudget },
  });

  const accountIdByPlatform = new Map<string, string>();
  for (const c of spec.comptes) {
    const account = await prisma.platformAccount.upsert({
      where: { platform_externalAccountId: { platform: c.platform, externalAccountId: c.externalAccountId } },
      update: { clientId: spec.id },
      create: { clientId: spec.id, platform: c.platform, externalAccountId: c.externalAccountId, displayName: c.displayName },
    });
    accountIdByPlatform.set(c.platform, account.id);
  }

  for (const camp of spec.campagnes) {
    const platformAccountId = accountIdByPlatform.get(camp.platform)!;

    await prisma.campaign.upsert({
      where: { platformAccountId_externalEntityId: { platformAccountId, externalEntityId: camp.externalEntityId } },
      update: { name: camp.name, status: camp.status, budgetDaily: camp.budgetDaily, network: camp.network ?? null },
      create: { platformAccountId, externalEntityId: camp.externalEntityId, name: camp.name, status: camp.status, budgetDaily: camp.budgetDaily, network: camp.network ?? null },
    });

    const lignesCampagne = [];
    const lignesCompte = [];
    for (let j = 0; j < 60; j++) {
      const l = ligne(j, camp.base, 0.18);
      lignesCampagne.push({ ...l, platformAccountId, level: "campaign" as const, externalEntityId: camp.externalEntityId, entityName: camp.name });
    }
    await prisma.metricDaily.createMany({ data: lignesCampagne, skipDuplicates: true });
  }

  // Niveau compte : la somme des campagnes du même compte, pour que la
  // lecture par compte (readDashboard) et par campagne s'accordent — même
  // principe qu'ads-dashboard.
  for (const [platform, platformAccountId] of accountIdByPlatform) {
    const campagnesDuCompte = spec.campagnes.filter((c) => c.platform === platform);
    const lignesCompte = [];
    for (let j = 0; j < 60; j++) {
      const total = campagnesDuCompte.reduce(
        (acc, camp) => {
          const l = ligne(j, camp.base, 0.18);
          return {
            impressions: acc.impressions + l.impressions,
            clicks: acc.clicks + l.clicks,
            cost: acc.cost + l.cost,
            conversions: acc.conversions + l.conversions,
            conversionValue: acc.conversionValue + l.conversionValue,
          };
        },
        { impressions: 0n, clicks: 0n, cost: 0, conversions: 0, conversionValue: 0 },
      );
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - j);
      lignesCompte.push({
        platformAccountId,
        date,
        granularity: "jour" as const,
        level: "account" as const,
        externalEntityId: "",
        ...total,
      });
    }
    await prisma.metricDaily.createMany({ data: lignesCompte, skipDuplicates: true });
  }
}

async function main() {
  const passwordHash = await hashPassword(MOT_DE_PASSE_DEV);
  await prisma.user.upsert({
    where: { email: "admin@agence.test" },
    update: { passwordHash },
    create: { email: "admin@agence.test", passwordHash, role: "admin", name: "Admin Agence" },
  });

  // Le même identifiant "acme-ecom" que la maquette : le lien de la barre
  // latérale ("Comptes Clients") et l'exemple pré-rempli du testeur MCP
  // continuent de pointer vers un client qui existe réellement.
  await seedClient({
    id: "acme-ecom",
    name: "Acme Corp E-Commerce",
    category: "E-Commerce & Retail",
    monthlyBudget: 25000,
    comptes: [
      { platform: "meta", externalAccountId: "act_demo_acme_meta", displayName: "Acme · Meta" },
      { platform: "google", externalAccountId: "demo-acme-google", displayName: "Acme · Google" },
      { platform: "tiktok", externalAccountId: "demo-acme-tiktok", displayName: "Acme · TikTok" },
    ],
    campagnes: [
      // Pas de network : une campagne de retargeting catalogue peut être
      // limitée à une seule surface ou diffusée automatiquement selon le
      // réglage choisi — rien dans son nom ne le dit, donc on ne le devine
      // pas (contrairement à Advantage+ Shopping ci-dessous, qui impose la
      // diffusion automatique par construction).
      { platform: "meta", externalEntityId: "retargeting", name: "MOFU/BOFU - Dynamic Catalog Retargeting", status: "ACTIVE", budgetDaily: 250, base: { impressions: 13700, clicks: 380, cost: 250, conversions: 20, conversionValue: 1490 } },
      { platform: "google", externalEntityId: "pmax", name: "PMax - High Value SKU Multi-Asset", status: "ACTIVE", budgetDaily: 300, network: "performance_max", base: { impressions: 8900, clicks: 300, cost: 270, conversions: 19, conversionValue: 1188 } },
      { platform: "tiktok", externalEntityId: "ugc", name: "TOF - Viral Hook UGC Video Boost", status: "OPTIMIZING", budgetDaily: 100, base: { impressions: 11600, clicks: 230, cost: 96, conversions: 7, conversionValue: 274 } },
    ],
  });

  await seedClient({
    id: "lumina-beauty",
    name: "Lumina Cosmetics",
    category: "Beauty & D2C",
    monthlyBudget: 18000,
    comptes: [
      { platform: "meta", externalAccountId: "act_demo_lumina_meta", displayName: "Lumina · Meta" },
      { platform: "tiktok", externalAccountId: "demo-lumina-tiktok", displayName: "Lumina · TikTok" },
    ],
    campagnes: [
      // Advantage+ Shopping impose la diffusion automatique multi-surface
      // par construction (Meta ne propose pas de placement manuel pour ce
      // type de campagne) : network connu avec certitude, pas une supposition.
      { platform: "meta", externalEntityId: "lookalike", name: "Advantage+ Shopping - Lookalike 1% Buyers", status: "ACTIVE", budgetDaily: 350, network: "cross_placement", base: { impressions: 18000, clicks: 560, cost: 326, conversions: 24, conversionValue: 1893 } },
      { platform: "tiktok", externalEntityId: "creator", name: "Spark Ads - Influencer Collab", status: "ACTIVE", budgetDaily: 150, base: { impressions: 12700, clicks: 300, cost: 147, conversions: 9, conversionValue: 568 } },
    ],
  });

  await seedClient({
    id: "techflow-saas",
    name: "TechFlow Cloud B2B",
    category: "SaaS Enterprise",
    monthlyBudget: 35000,
    comptes: [
      { platform: "google", externalAccountId: "demo-techflow-google", displayName: "TechFlow · Google" },
      { platform: "linkedin", externalAccountId: "demo-techflow-linkedin", displayName: "TechFlow · LinkedIn" },
    ],
    campagnes: [
      { platform: "google", externalEntityId: "search-exact", name: "Exact Search - Enterprise Workflow Automation", status: "ACTIVE", budgetDaily: 500, network: "search", base: { impressions: 3700, clicks: 172, cost: 550, conversions: 10, conversionValue: 2571 } },
      { platform: "linkedin", externalEntityId: "csuite", name: "Sponsored Content - CTO & VP Engineering LeadGen", status: "OPTIMIZING", budgetDaily: 400, base: { impressions: 4200, clicks: 49, cost: 413, conversions: 4, conversionValue: 897 } },
    ],
  });

  console.log("Amorçage terminé : 3 clients, admin@agence.test /", MOT_DE_PASSE_DEV);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
