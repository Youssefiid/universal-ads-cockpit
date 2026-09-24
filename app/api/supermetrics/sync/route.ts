import { NextResponse } from "next/server";
import { triggerSupermetricsSync, getConnectors } from "@/lib/supermetrics";
import { Platform } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    connectors: getConnectors(),
    status: "HEALTHY",
    lastCheck: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const platform = body.platform as Platform | undefined;

    const results = await triggerSupermetricsSync(platform);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      message: `Synchronisation Supermetrics exécutée avec succès (${results.length} régies mises à jour).`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Supermetrics sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
