import { mockSupermetricsConnectors } from "./store";
import { Platform, SupermetricsConnector } from "./types";

export interface SyncResult {
  platform: Platform;
  status: "SUCCESS" | "FAILED";
  recordsProcessed: number;
  durationMs: number;
  syncedAt: string;
}

export async function triggerSupermetricsSync(platform?: Platform): Promise<SyncResult[]> {
  // Simulate remote ad network API ingestion with Supermetrics
  await new Promise((resolve) => setTimeout(resolve, 800));

  const targets = platform 
    ? mockSupermetricsConnectors.filter((c) => c.id === platform)
    : mockSupermetricsConnectors;

  return targets.map((c) => {
    c.lastSyncTime = new Date().toISOString();
    c.status = "CONNECTED";
    const newRecords = Math.floor(Math.random() * 300) + 120;
    c.recordsSynced += newRecords;

    return {
      platform: c.id,
      status: "SUCCESS" as const,
      recordsProcessed: newRecords,
      durationMs: Math.floor(Math.random() * 400) + 200,
      syncedAt: c.lastSyncTime
    };
  });
}

export function getConnectors(): SupermetricsConnector[] {
  return mockSupermetricsConnectors;
}
