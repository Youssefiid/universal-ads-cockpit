import { NextResponse } from "next/server";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { getClientVisiblePourPortee } from "@/lib/queries";
import { parserFichier, CHAMPS_CIBLES, type Mapping } from "@/lib/import";
import { executerImport } from "@/lib/importExecute";

/**
 * Réimporte le même fichier avec le mapping confirmé par l'utilisateur (pas
 * celui suggéré par l'IA, sauf s'il l'a laissé tel quel) : le fichier est
 * reparsé ici plutôt que de faire confiance à des lignes renvoyées par le
 * navigateur, qui pourraient avoir été modifiées entre l'analyse et la
 * confirmation.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const fichier = form.get("file");
  const clientId = String(form.get("clientId") ?? "");
  const platformAccountId = String(form.get("platformAccountId") ?? "");
  const remark = String(form.get("remark") ?? "").trim() || null;
  const mappingBrut = String(form.get("mapping") ?? "{}");

  if (!(fichier instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });

  const client = await getClientVisiblePourPortee(prismaApp, clientId, session);
  if (!client) return NextResponse.json({ error: `Client '${clientId}' introuvable ou non assigné.` }, { status: 404 });

  const compte = await prismaApp.platformAccount.findUnique({ where: { id: platformAccountId } });
  if (!compte || compte.clientId !== clientId) {
    return NextResponse.json({ error: "Compte publicitaire introuvable pour ce client." }, { status: 404 });
  }

  let mapping: Mapping;
  try {
    const brut = JSON.parse(mappingBrut) as Record<string, unknown>;
    mapping = {};
    for (const [colonne, champ] of Object.entries(brut)) {
      if (typeof champ === "string" && (CHAMPS_CIBLES as readonly string[]).includes(champ)) {
        mapping[colonne] = champ as Mapping[string];
      }
    }
  } catch {
    return NextResponse.json({ error: "Mapping invalide." }, { status: 400 });
  }

  let parsed;
  try {
    const buffer = Buffer.from(await fichier.arrayBuffer());
    parsed = await parserFichier(fichier.name, buffer);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Échec de lecture du fichier." }, { status: 422 });
  }

  let resultat;
  try {
    resultat = await executerImport(prismaApp, {
      platformAccountId,
      devise: client.currency,
      mapping,
      rows: parsed.rows,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Échec de l'import." }, { status: 422 });
  }

  await prismaApp.importBatch.create({
    data: {
      clientId,
      platformAccountId,
      fileName: fichier.name,
      format: parsed.format,
      mapping,
      remark,
      rowsImported: resultat.rowsImported,
      rowsSkipped: resultat.rowsSkipped,
      skippedSamples: resultat.skippedSamples,
      importedByUserId: session.userId,
    },
  });

  return NextResponse.json({
    rowsImported: resultat.rowsImported,
    rowsSkipped: resultat.rowsSkipped,
    doublons: resultat.doublons,
    skippedSamples: resultat.skippedSamples,
  });
}
