export type Platform = "meta" | "google" | "tiktok" | "linkedin";

export interface MetricSnapshot {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  roas: number;
}

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: "ACTIVE" | "PAUSED" | "LEARNING" | "OPTIMIZING";
  budgetDaily: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  ctr: number;
  cpc: number;
  impressions: number;
  clicks: number;
  historical: MetricSnapshot[];
}

export interface Client {
  id: string;
  name: string;
  category: string;
  currency: string;
  monthlyBudget: number;
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  roas: number;
  deltaRoas: number;
  deltaSpend: number;
  healthScore: number;
  lastSync: string;
  connectedPlatforms: Platform[];
  campaigns: Campaign[];
  sparkline: number[];
}

export interface CrossChannelSummary {
  platform: string;
  platformKey: Platform;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  share: number;
}

export interface LookerSchemaField {
  name: string;
  label: string;
  dataType: "STRING" | "NUMBER";
  semantics: {
    conceptType: "DIMENSION" | "METRIC";
    semanticType?: string;
    isDouble?: boolean;
  };
}

export interface SupermetricsConnector {
  id: Platform;
  name: string;
  status: "CONNECTED" | "SYNCING" | "ERROR" | "IDLE";
  lastSyncTime: string;
  accountCount: number;
  recordsSynced: number;
  tokenExpiry: string;
}

export interface AnomalyReport {
  id: string;
  clientId: string;
  clientName: string;
  type: "CRITICAL" | "WARNING" | "OPPORTUNITY";
  title: string;
  message: string;
  suggestedAction: string;
  detectedAt: string;
}
