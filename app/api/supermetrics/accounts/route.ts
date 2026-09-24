import { NextResponse } from "next/server";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { cleSupermetrics, listerComptesSupermetrics, ErreurSupermetrics } from "@/lib/supermetrics";
import type { Platform } from "@/lib/types";

const PLATEFORMES: Platform[] = ["meta", "google", "tiktok", "linkedin"];

/**
 * Découverte réelle des comptes Supermetrics — remplace la modale de
 * synchronisation qui affichait des lignes de journal écrites en dur
 * ("14 280 métriques ingérées") sans jamais contacter Supermetrics.
 *
 * Ne synchronise aucune donnée de campagne : ni ce cockpit ni ads-dashboard
 * n'ont encore d'ingestion automatique branchée. Cette route ne fait que
 * lister les comptes réellement visibles avec la clé enregistrée, pour
 * qu'un compte se rattache par son vrai nom plutôt qu'un identifiant copié
 * à la main.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") as Platform | null;
  if (!platform || !PLATEFORMES.includes(platform)) {
    return NextResponse.json({ error: "unsupported_platform" }, { status: 400 });
  }

  const cle = await cleSupermetrics(prismaApp);
  if (!cle) {
    return NextResponse.json(
      { error: "no_key", message: "Aucune clé Supermetrics enregistrée." },
      { status: 404 },
    );
  }

  try {
    const accounts = await listerComptesSupermetrics(cle, platform);
    return NextResponse.json({ accounts });
  } catch (e) {
    if (e instanceof ErreurSupermetrics) {
      return NextResponse.json({ error: "upstream", message: e.message }, { status: e.statut || 502 });
    }
    return NextResponse.json({ error: "unknown", message: String(e) }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
