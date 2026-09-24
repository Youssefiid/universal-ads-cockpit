import { NextResponse } from "next/server";
import { prismaApp } from "@/lib/prisma";

/**
 * Statut réel du connecteur Supermetrics — remplace un `POST` qui attendait
 * un délai artificiel puis tirait un nombre de lignes au hasard, renvoyé
 * comme une synchronisation réussie. Aucune route de ce cockpit ne
 * synchronise de données de campagne automatiquement ; celle-ci se contente
 * de dire si une clé est enregistrée, honnêtement.
 */
export async function GET() {
  const credential = await prismaApp.connectorCredential.findUnique({
    where: { provider: "supermetrics" },
    select: { hint: true, checkedAt: true, checkOk: true },
  });

  return NextResponse.json({
    configured: !!credential,
    checkOk: credential?.checkOk ?? null,
    checkedAt: credential?.checkedAt ?? null,
    note: "Cette route ne déclenche aucune synchronisation : l'import de données se fait par fichier. Utilisez /api/supermetrics/accounts pour découvrir les comptes réels d'une régie.",
  });
}

export const dynamic = "force-dynamic";
