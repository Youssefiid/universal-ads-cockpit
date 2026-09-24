import { Client, CrossChannelSummary, AnomalyReport, SupermetricsConnector, Platform } from "./types";

// In-memory persistent data for the Universal Ads Cockpit
export const mockClients: Client[] = [
  {
    id: "acme-ecom",
    name: "Acme Corp E-Commerce",
    category: "E-Commerce & Retail",
    currency: "EUR",
    monthlyBudget: 25000,
    totalSpend: 18450,
    totalRevenue: 88560,
    totalConversions: 1420,
    roas: 4.8,
    deltaRoas: 14.2,
    deltaSpend: 8.5,
    healthScore: 94,
    lastSync: new Date().toISOString(),
    connectedPlatforms: ["meta", "google", "tiktok"],
    sparkline: [2200, 2400, 2100, 2800, 3100, 2900, 3400, 3650],
    campaigns: [
      {
        id: "acme-meta-retargeting",
        name: "MOFU/BOFU - Dynamic Catalog Retargeting (Meta)",
        platform: "meta",
        status: "ACTIVE",
        budgetDaily: 250,
        spend: 7450,
        conversions: 620,
        revenue: 44700,
        roas: 6.0,
        cpa: 12.01,
        ctr: 2.85,
        cpc: 0.65,
        impressions: 412000,
        clicks: 11460,
        historical: []
      },
      {
        id: "acme-google-pmax",
        name: "PMax - High Value SKU Multi-Asset (Google)",
        platform: "google",
        status: "ACTIVE",
        budgetDaily: 300,
        spend: 8100,
        conversions: 580,
        revenue: 35640,
        roas: 4.4,
        cpa: 13.96,
        ctr: 3.42,
        cpc: 0.88,
        impressions: 268000,
        clicks: 9200,
        historical: []
      },
      {
        id: "acme-tiktok-ugc",
        name: "TOF - Viral Hook UGC Video Boost (TikTok)",
        platform: "tiktok",
        status: "OPTIMIZING",
        budgetDaily: 100,
        spend: 2900,
        conversions: 220,
        revenue: 8220,
        roas: 2.83,
        cpa: 13.18,
        ctr: 1.95,
        cpc: 0.42,
        impressions: 350000,
        clicks: 6900,
        historical: []
      }
    ]
  },
  {
    id: "lumina-beauty",
    name: "Lumina Cosmetics",
    category: "Beauty & D2C",
    currency: "EUR",
    monthlyBudget: 18000,
    totalSpend: 14200,
    totalRevenue: 73840,
    totalConversions: 980,
    roas: 5.2,
    deltaRoas: 18.7,
    deltaSpend: 5.1,
    healthScore: 98,
    lastSync: new Date().toISOString(),
    connectedPlatforms: ["meta", "tiktok"],
    sparkline: [1400, 1600, 1550, 1800, 2100, 2300, 2550, 2700],
    campaigns: [
      {
        id: "lumina-meta-lookalike",
        name: "Advantage+ Shopping - Lookalike 1% Buyers",
        platform: "meta",
        status: "ACTIVE",
        budgetDaily: 350,
        spend: 9800,
        conversions: 710,
        revenue: 56800,
        roas: 5.8,
        cpa: 13.8,
        ctr: 3.1,
        cpc: 0.58,
        impressions: 540000,
        clicks: 16900,
        historical: []
      },
      {
        id: "lumina-tiktok-creator",
        name: "Spark Ads - Influencer Collab #GlowRoutine",
        platform: "tiktok",
        status: "ACTIVE",
        budgetDaily: 150,
        spend: 4400,
        conversions: 270,
        revenue: 17040,
        roas: 3.87,
        cpa: 16.3,
        ctr: 2.4,
        cpc: 0.49,
        impressions: 380000,
        clicks: 8980,
        historical: []
      }
    ]
  },
  {
    id: "techflow-saas",
    name: "TechFlow Cloud B2B",
    category: "SaaS Enterprise",
    currency: "EUR",
    monthlyBudget: 35000,
    totalSpend: 28900,
    totalRevenue: 104040,
    totalConversions: 410,
    roas: 3.6,
    deltaRoas: -4.2,
    deltaSpend: 12.0,
    healthScore: 88,
    lastSync: new Date().toISOString(),
    connectedPlatforms: ["google", "linkedin"],
    sparkline: [3100, 3400, 3200, 3600, 3900, 4200, 4100, 4350],
    campaigns: [
      {
        id: "techflow-google-search",
        name: "Exact Search - 'Enterprise Workflow Automation'",
        platform: "google",
        status: "ACTIVE",
        budgetDaily: 500,
        spend: 16500,
        conversions: 290,
        revenue: 77140,
        roas: 4.67,
        cpa: 56.9,
        ctr: 4.8,
        cpc: 3.2,
        impressions: 110000,
        clicks: 5150,
        historical: []
      },
      {
        id: "techflow-linkedin-csuite",
        name: "Sponsored Content - CTO & VP Engineering LeadGen",
        platform: "linkedin",
        status: "OPTIMIZING",
        budgetDaily: 400,
        spend: 12400,
        conversions: 120,
        revenue: 26900,
        roas: 2.17,
        cpa: 103.3,
        ctr: 1.15,
        cpc: 8.5,
        impressions: 125000,
        clicks: 1460,
        historical: []
      }
    ]
  },
  {
    id: "fitpulse-gym",
    name: "FitPulse Nutrition",
    category: "Health & Fitness",
    currency: "EUR",
    monthlyBudget: 12000,
    totalSpend: 9200,
    totalRevenue: 43240,
    totalConversions: 640,
    roas: 4.7,
    deltaRoas: 9.3,
    deltaSpend: 3.4,
    healthScore: 92,
    lastSync: new Date().toISOString(),
    connectedPlatforms: ["meta", "google", "tiktok"],
    sparkline: [900, 1100, 1050, 1200, 1400, 1350, 1500, 1620],
    campaigns: [
      {
        id: "fitpulse-meta-broad",
        name: "Meta Advantage+ Broad - Whey Protein Hydration",
        platform: "meta",
        status: "ACTIVE",
        budgetDaily: 150,
        spend: 4600,
        conversions: 330,
        revenue: 23920,
        roas: 5.2,
        cpa: 13.9,
        ctr: 2.9,
        cpc: 0.62,
        impressions: 220000,
        clicks: 7420,
        historical: []
      },
      {
        id: "fitpulse-google-brand",
        name: "Google Search - Brand + Top Flavors",
        platform: "google",
        status: "ACTIVE",
        budgetDaily: 100,
        spend: 3100,
        conversions: 240,
        revenue: 16120,
        roas: 5.2,
        cpa: 12.9,
        ctr: 6.8,
        cpc: 0.95,
        impressions: 48000,
        clicks: 3260,
        historical: []
      },
      {
        id: "fitpulse-tiktok-challenges",
        name: "TikTok Creator Challenge #FitFuel",
        platform: "tiktok",
        status: "PAUSED",
        budgetDaily: 50,
        spend: 1500,
        conversions: 70,
        revenue: 3200,
        roas: 2.13,
        cpa: 21.4,
        ctr: 1.8,
        cpc: 0.45,
        impressions: 180000,
        clicks: 3330,
        historical: []
      }
    ]
  }
];

export const mockSupermetricsConnectors: SupermetricsConnector[] = [
  {
    id: "meta",
    name: "Meta Ads Graph API (Facebook & Instagram)",
    status: "CONNECTED",
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    accountCount: 4,
    recordsSynced: 14280,
    tokenExpiry: "2027-01-01T00:00:00Z"
  },
  {
    id: "google",
    name: "Google Ads API v18 (Search, PMax, YouTube)",
    status: "CONNECTED",
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    accountCount: 3,
    recordsSynced: 9840,
    tokenExpiry: "2027-01-01T00:00:00Z"
  },
  {
    id: "tiktok",
    name: "TikTok Marketing Partner API",
    status: "CONNECTED",
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    accountCount: 3,
    recordsSynced: 4620,
    tokenExpiry: "2026-12-31T00:00:00Z"
  },
  {
    id: "linkedin",
    name: "LinkedIn Campaign Manager API",
    status: "CONNECTED",
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    accountCount: 1,
    recordsSynced: 1250,
    tokenExpiry: "2026-11-30T00:00:00Z"
  }
];

export const mockAnomalies: AnomalyReport[] = [
  {
    id: "ano-1",
    clientId: "techflow-saas",
    clientName: "TechFlow Cloud B2B",
    type: "WARNING",
    title: "CPA LinkedIn élevé (103.30 €)",
    message: "Le coût par acquisition a augmenté de +24% au cours des 48 dernières heures sur la campagne C-Suite.",
    suggestedAction: "Raffiner le ciblage par taille d'entreprise ou réallouer 2 000 € vers Google Exact Search.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: "ano-2",
    clientId: "acme-ecom",
    clientName: "Acme Corp E-Commerce",
    type: "OPPORTUNITY",
    title: "Surperformance Meta Retargeting (ROAS 6.0x)",
    message: "La campagne Dynamic Catalog dépasse l'objectif de rentabilité de 25%. Budget actuel plafonné à 250 €/j.",
    suggestedAction: "Augmenter le budget journalier de +20% (vers 300 €/j) sans dégradation du ROAS.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  },
  {
    id: "ano-3",
    clientId: "lumina-beauty",
    clientName: "Lumina Cosmetics",
    type: "OPPORTUNITY",
    title: "Pic de conversion TikTok UGC (+38%)",
    message: "Le format Spark Ads avec l'influenceur @beautyGlow a généré 110 ventes supplémentaires en 3 jours.",
    suggestedAction: "Déployer la créa sur Meta Reels et étendre la fenêtre de scaling.",
    detectedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  }
];

// Helper functions for aggregations
export function getCockpitOverview() {
  const totalSpend = mockClients.reduce((acc, c) => acc + c.totalSpend, 0);
  const totalRevenue = mockClients.reduce((acc, c) => acc + c.totalRevenue, 0);
  const totalConversions = mockClients.reduce((acc, c) => acc + c.totalConversions, 0);
  const averageRoas = totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : 0;
  const averageHealth = Math.round(mockClients.reduce((acc, c) => acc + c.healthScore, 0) / mockClients.length);

  return {
    totalSpend,
    totalRevenue,
    totalConversions,
    averageRoas,
    averageHealth,
    clientsCount: mockClients.length,
    activeCampaignsCount: mockClients.reduce((acc, c) => acc + c.campaigns.length, 0),
    currency: "EUR"
  };
}

export function getCrossChannelBreakdown(): CrossChannelSummary[] {
  const platformMap: Record<Platform, { name: string; spend: number; revenue: number; conversions: number }> = {
    meta: { name: "Meta Ads (FB/IG)", spend: 0, revenue: 0, conversions: 0 },
    google: { name: "Google Ads (Search/PMax)", spend: 0, revenue: 0, conversions: 0 },
    tiktok: { name: "TikTok Ads", spend: 0, revenue: 0, conversions: 0 },
    linkedin: { name: "LinkedIn Ads", spend: 0, revenue: 0, conversions: 0 }
  };

  for (const client of mockClients) {
    for (const campaign of client.campaigns) {
      if (platformMap[campaign.platform]) {
        platformMap[campaign.platform].spend += campaign.spend;
        platformMap[campaign.platform].revenue += campaign.revenue;
        platformMap[campaign.platform].conversions += campaign.conversions;
      }
    }
  }

  const totalSpend = Object.values(platformMap).reduce((acc, p) => acc + p.spend, 0);

  return (Object.keys(platformMap) as Platform[]).map((key) => {
    const p = platformMap[key];
    const roas = p.spend > 0 ? Number((p.revenue / p.spend).toFixed(2)) : 0;
    const cpa = p.conversions > 0 ? Number((p.spend / p.conversions).toFixed(2)) : 0;
    const share = totalSpend > 0 ? Number(((p.spend / totalSpend) * 100).toFixed(1)) : 0;

    return {
      platform: p.name,
      platformKey: key,
      spend: p.spend,
      conversions: p.conversions,
      revenue: p.revenue,
      roas,
      cpa,
      share
    };
  });
}

export function getClientById(id: string): Client | undefined {
  return mockClients.find((c) => c.id === id);
}
