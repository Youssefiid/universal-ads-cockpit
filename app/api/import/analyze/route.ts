import { NextResponse } from "next/server";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { getClientVisiblePourPortee } from "@/lib/queries";
import { parserFichier } from "@/lib/import";
import { resoudreCleAnthropic } from "@/lib/aiKey";

/**
 * Analyse seule : parse le fichier et propose un mapping, n'écrit jamais
 * rien en base. La confirmation (app/api/import/confirm) est une requête
 * séparée, toujours après relecture humaine du mapping proposé.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const fichier = form.get("file");
  const clientId = String(form.get("clientId") ?? "");
  const platformAccountId = String(form.get("platformAccountId") ?? "");

  if (!(fichier instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });

  const client = await getClientVisiblePourPortee(prismaApp, clientId, session);
  if (!client) return NextResponse.json({ error: `Client '${clientId}' introuvable ou non assigné.` }, { status: 404 });

  const compte = await prismaApp.platformAccount.findUnique({ where: { id: platformAccountId } });
  if (!compte || compte.clientId !== clientId) {
    return NextResponse.json({ error: "Compte publicitaire introuvable pour ce client." }, { status: 404 });
  }

  let parsed;
  try {
    const buffer = Buffer.from(await fichier.arrayBuffer());
    parsed = await parserFichier(fichier.name, buffer);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Échec de lecture du fichier." }, { status: 422 });
  }

  if (parsed.rows.length === 0) {
    return NextResponse.json({ error: "Ce fichier ne contient aucune ligne de données exploitable." }, { status: 422 });
  }

  let suggestedMapping = {};
  let aiAvailable = false;
  let aiError: string | null = null;
  const cle = await resoudreCleAnthropic(session.userId);
  if (cle) {
    aiAvailable = true;
    try {
      const { suggererMapping } = await import("@/lib/importAI");
      suggestedMapping = await suggererMapping(cle.secret, parsed.headers, parsed.rows.slice(0, 10));
    } catch (e) {
      aiError = e instanceof Error ? e.message : "Échec de la suggestion IA.";
    }
  }

  return NextResponse.json({
    format: parsed.format,
    headers: parsed.headers,
    sampleRows: parsed.rows.slice(0, 10),
    totalRows: parsed.rows.length,
    suggestedMapping,
    aiAvailable,
    aiError,
  });
}
