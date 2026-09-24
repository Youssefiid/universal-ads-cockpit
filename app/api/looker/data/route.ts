import { NextResponse } from "next/server";
import { getLookerStudioData } from "@/lib/lookerConnector";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const data = getLookerStudioData();

    // Optional filter by client ID if provided in query params
    let rows = data.rows;
    if (clientId) {
      rows = rows.filter((r) => r.values[1] === clientId);
    }

    return NextResponse.json(
      {
        ...data,
        rows,
        filteredClient: clientId || "ALL"
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate Looker Studio data feed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
