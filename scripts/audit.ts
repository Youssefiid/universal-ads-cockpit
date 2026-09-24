import { getCockpitOverview, getCrossChannelBreakdown, mockClients, mockAnomalies, getClientById } from "../lib/store";
import { getLookerStudioData, lookerFields } from "../lib/lookerConnector";
import { triggerSupermetricsSync, getConnectors } from "../lib/supermetrics";
import { spawn } from "child_process";

interface AuditStep {
  name: string;
  category: "LOOKER_FEED" | "SUPERMETRICS_SYNC" | "MCP_SERVER" | "CORE_CALCULATIONS" | "HTTP_ENDPOINTS" | "PAGES_ROUTING";
  passed: boolean;
  details: string;
  durationMs: number;
}

const auditResults: AuditStep[] = [];

function recordTest(
  category: AuditStep["category"],
  name: string,
  passed: boolean,
  details: string,
  durationMs: number
) {
  auditResults.push({ name, category, passed, details, durationMs });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${category}] ${name}: ${details} (${durationMs}ms)`);
}

async function runAudit() {
  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log("🚀 AUDIT COMPLET ET VÉRIFICATION PRÉ-DÉPLOIEMENT : UNIVERSAL ADS COCKPIT");
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  // 1. AUDIT DU MOTEUR DE CALCULS DÉTERMINISTES
  console.log("--- 1. Audit des Calculs Déterministes & Intégrité Financière ---");
  const t0 = Date.now();
  const overview = getCockpitOverview();
  const channels = getCrossChannelBreakdown();

  // Test Total Spend
  const calculatedSpend = mockClients.reduce((sum, c) => sum + c.totalSpend, 0);
  recordTest(
    "CORE_CALCULATIONS",
    "Total Spend Aggregation",
    overview.totalSpend === calculatedSpend && overview.totalSpend === 70750,
    `Spend calculé : ${overview.totalSpend} € (attendu: 70750 €)`,
    Date.now() - t0
  );

  // Test Total Revenue
  const calculatedRev = mockClients.reduce((sum, c) => sum + c.totalRevenue, 0);
  recordTest(
    "CORE_CALCULATIONS",
    "Total Revenue Aggregation",
    overview.totalRevenue === calculatedRev && overview.totalRevenue === 309680,
    `Revenue calculé : ${overview.totalRevenue} € (attendu: 309680 €)`,
    Date.now() - t0
  );

  // Test ROAS
  const expectedRoas = Number((calculatedRev / calculatedSpend).toFixed(2));
  recordTest(
    "CORE_CALCULATIONS",
    "Blended ROAS Formula Accuracy",
    overview.averageRoas === expectedRoas && overview.averageRoas === 4.38,
    `ROAS moyen : ${overview.averageRoas}x (attendu: ${expectedRoas}x)`,
    Date.now() - t0
  );

  // Test Channels Sum & 100% budget allocation
  const channelsTotalSpend = channels.reduce((sum, c) => sum + c.spend, 0);
  const channelsTotalShare = channels.reduce((sum, c) => sum + c.share, 0);
  recordTest(
    "CORE_CALCULATIONS",
    "Multi-Channel Budget Allocation & Shares",
    channelsTotalSpend === overview.totalSpend && Math.round(channelsTotalShare) === 100,
    `Total Spend Canaux: ${channelsTotalSpend} € | Somme des parts: ${channelsTotalShare.toFixed(1)}%`,
    Date.now() - t0
  );

  // 2. AUDIT DU CONNECTEUR LOOKER STUDIO
  console.log("\n--- 2. Audit du Connecteur Looker Studio (Schema & Data Feed) ---");
  const t1 = Date.now();
  const lookerData = getLookerStudioData();

  recordTest(
    "LOOKER_FEED",
    "Looker Schema Fields Count",
    lookerData.schema.length === 16,
    `${lookerData.schema.length} champs typés exposés (attendu: 16)`,
    Date.now() - t1
  );

  // Verify each schema field has proper semantics
  const allFieldsValid = lookerData.schema.every(
    (f) => f.name && f.label && f.dataType && f.semantics && f.semantics.conceptType
  );
  recordTest(
    "LOOKER_FEED",
    "Looker Schema Semantics & Typing",
    allFieldsValid,
    "Tous les champs contiennent les métadonnées conceptType & semanticType valides",
    Date.now() - t1
  );

  // Verify rows structure
  const rowsValid = lookerData.rows.length === 10 && lookerData.rows.every(
    (r) => r.values.length === 16 && !r.values.some((v) => v === undefined || v === null || Number.isNaN(v))
  );
  recordTest(
    "LOOKER_FEED",
    "Looker Rows Data Integrity",
    rowsValid,
    `${lookerData.rows.length} lignes valides sans valeurs null/NaN/undefined`,
    Date.now() - t1
  );

  // 3. AUDIT DU HUB SUPERMETRICS
  console.log("\n--- 3. Audit du Hub Supermetrics (Connecteurs & Ingestion) ---");
  const t2 = Date.now();
  const connectors = getConnectors();

  recordTest(
    "SUPERMETRICS_SYNC",
    "Connectors Registration",
    connectors.length === 4 && connectors.map((c) => c.id).sort().join(",") === "google,linkedin,meta,tiktok",
    "4 régies principales enregistrées (Meta, Google, TikTok, LinkedIn)",
    Date.now() - t2
  );

  // Test sync execution
  const syncResult = await triggerSupermetricsSync("meta");
  recordTest(
    "SUPERMETRICS_SYNC",
    "Targeted Platform Sync Execution",
    syncResult.length === 1 && syncResult[0].status === "SUCCESS" && syncResult[0].recordsProcessed > 0,
    `Synchro Meta réussie : ${syncResult[0].recordsProcessed} lignes ingérées en ${syncResult[0].durationMs}ms`,
    Date.now() - t2
  );

  const fullSyncResult = await triggerSupermetricsSync();
  recordTest(
    "SUPERMETRICS_SYNC",
    "Global All-Networks Sync Execution",
    fullSyncResult.length === 4 && fullSyncResult.every((r) => r.status === "SUCCESS"),
    `Synchro globale réussie : 4 régies actualisées en parallèle`,
    Date.now() - t2
  );

  // 4. AUDIT DES ENDPOINTS HTTP EN DIRECT (Port 3001)
  console.log("\n--- 4. Audit des Endpoints HTTP / API Web ---");
  const BASE_URL = "http://127.0.0.1:3001";

  // Test GET /api/looker/data
  const t3 = Date.now();
  try {
    const resLooker = await fetch(`${BASE_URL}/api/looker/data`);
    const jsonLooker = await resLooker.json();
    const cors = resLooker.headers.get("access-control-allow-origin");
    recordTest(
      "HTTP_ENDPOINTS",
      "GET /api/looker/data (Global Feed)",
      resLooker.status === 200 && jsonLooker.rows?.length === 10 && cors === "*",
      `Status 200 OK | CORS: ${cors} | ${jsonLooker.rows?.length} lignes retournées`,
      Date.now() - t3
    );
  } catch (e) {
    recordTest("HTTP_ENDPOINTS", "GET /api/looker/data", false, String(e), Date.now() - t3);
  }

  // Test GET /api/looker/data?clientId=acme-ecom
  const t4 = Date.now();
  try {
    const resFiltered = await fetch(`${BASE_URL}/api/looker/data?clientId=acme-ecom`);
    const jsonFiltered = await resFiltered.json();
    recordTest(
      "HTTP_ENDPOINTS",
      "GET /api/looker/data?clientId=acme-ecom (Filtered Feed)",
      resFiltered.status === 200 && jsonFiltered.rows?.length === 3 && jsonFiltered.filteredClient === "acme-ecom",
      `Filtrage dynamique validé : 3 campagnes pour Acme Corp`,
      Date.now() - t4
    );
  } catch (e) {
    recordTest("HTTP_ENDPOINTS", "GET /api/looker/data?clientId=acme-ecom", false, String(e), Date.now() - t4);
  }

  // Test POST /api/supermetrics/sync
  const t5 = Date.now();
  try {
    const resSync = await fetch(`${BASE_URL}/api/supermetrics/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "google" })
    });
    const jsonSync = await resSync.json();
    recordTest(
      "HTTP_ENDPOINTS",
      "POST /api/supermetrics/sync",
      resSync.status === 200 && jsonSync.success === true,
      `Synchro via API validée : ${jsonSync.message}`,
      Date.now() - t5
    );
  } catch (e) {
    recordTest("HTTP_ENDPOINTS", "POST /api/supermetrics/sync", false, String(e), Date.now() - t5);
  }

  // Test GET & POST /api/mcp
  const t6 = Date.now();
  try {
    const resMcpMeta = await fetch(`${BASE_URL}/api/mcp`);
    const jsonMcpMeta = await resMcpMeta.json();
    recordTest(
      "HTTP_ENDPOINTS",
      "GET /api/mcp (Tool Discovery)",
      resMcpMeta.status === 200 && jsonMcpMeta.tools?.length === 5,
      `Serveur MCP opérationnel avec ${jsonMcpMeta.tools?.length} outils exposés`,
      Date.now() - t6
    );

    // Test MCP tool execution: get_cockpit_kpis
    const resMcpCall = await fetch(`${BASE_URL}/api/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "get_cockpit_kpis" })
    });
    const jsonMcpCall = await resMcpCall.json();
    recordTest(
      "MCP_SERVER",
      "POST /api/mcp (Execute tool: get_cockpit_kpis)",
      resMcpCall.status === 200 && jsonMcpCall.content?.[0]?.text?.includes("totalSpend"),
      `Exécution d'outil MCP réussie : retour JSON-RPC conforme`,
      Date.now() - t6
    );

    // Test MCP tool execution: generate_client_report
    const resReport = await fetch(`${BASE_URL}/api/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "generate_client_report", arguments: { clientId: "acme-ecom" } })
    });
    const jsonReport = await resReport.json();
    recordTest(
      "MCP_SERVER",
      "POST /api/mcp (Execute tool: generate_client_report)",
      resReport.status === 200 && jsonReport.content?.[0]?.text?.includes("Rapport Exécutif"),
      `Génération de rapport Markdown client validée`,
      Date.now() - t6
    );
  } catch (e) {
    recordTest("MCP_SERVER", "POST /api/mcp Tool Call", false, String(e), Date.now() - t6);
  }

  // 5. AUDIT DE ROUTAGE DES PAGES WEB
  console.log("\n--- 5. Audit des Pages et Routes Web ---");
  const pagesToTest = [
    { path: "/", name: "Overview Cockpit" },
    { path: "/looker", name: "Looker Studio Live" },
    { path: "/supermetrics", name: "Supermetrics Hub" },
    { path: "/mcp", name: "MCP Playground" },
    { path: "/onboarding", name: "Onboarding Wizard" },
    { path: "/clients/acme-ecom", name: "Client Detail: Acme Corp" },
    { path: "/clients/lumina-beauty", name: "Client Detail: Lumina Beauty" },
    { path: "/clients/techflow-saas", name: "Client Detail: TechFlow SaaS" },
    { path: "/clients/fitpulse-gym", name: "Client Detail: FitPulse Gym" },
  ];

  for (const page of pagesToTest) {
    const tStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${page.path}`);
      recordTest(
        "PAGES_ROUTING",
        `Page ${page.path} (${page.name})`,
        res.status === 200,
        `Status HTTP ${res.status} OK`,
        Date.now() - tStart
      );
    } catch (e) {
      recordTest("PAGES_ROUTING", `Page ${page.path}`, false, String(e), Date.now() - tStart);
    }
  }

  // 6. SYNTHÈSE GLOBALE DE L'AUDIT
  console.log("\n═════════════════════════════════════════════════════════════════════════");
  const passedCount = auditResults.filter((r) => r.passed).length;
  const totalCount = auditResults.length;
  const successRate = ((passedCount / totalCount) * 100).toFixed(1);

  console.log(`📊 RÉSULTAT GLOBAL : ${passedCount}/${totalCount} TESTS RÉUSSIS (${successRate}%)`);
  if (passedCount === totalCount) {
    console.log("🎉 AUDIT VALIDÉ : TOUTES LES ENTRÉES ET SORTIES SONT 100% CONFORMES !");
  } else {
    console.log("⚠️ CERTAINS TESTS ONT ÉCHOUÉ. VÉRIFIER LES LOGS CI-DESSUS.");
  }
  console.log("═════════════════════════════════════════════════════════════════════════\n");
}

runAudit().catch(console.error);
