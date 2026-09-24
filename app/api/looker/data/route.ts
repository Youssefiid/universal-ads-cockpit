import { NextResponse } from "next/server";
import { getLookerStudioData } from "@/lib/lookerConnector";
import { jetonConnecteurValide } from "@/lib/connectorAuth";

/**
 * Pas de session de navigateur ici : Looker Studio appelle ce flux serveur
 * à serveur. À la place, un jeton dédié (CONNECTOR_API_KEY, distinct de la
 * session du cockpit) est exigé en en-tête Authorization — ce flux sert de
 * vraies mesures de clients, il ne doit pas être lisible par n'importe qui
 * connaissant l'URL.
 */
export async function GET(request: Request) {
  if (!jetonConnecteurValide(request)) {
    return NextResponse.json({ error: "Jeton connecteur manquant ou invalide." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const data = await getLookerStudioData();

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
