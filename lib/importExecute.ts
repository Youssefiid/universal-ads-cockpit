import type { PrismaClient } from "@prisma/client";
import type { LigneBrute, Mapping } from "./importFields";
import { parserNombre, parserDate } from "./import";

export type LigneIgnoree = { ligne: number; raison: string };

export type ResultatImport = {
  rowsImported: number;
  rowsSkipped: number;
  skippedSamples: LigneIgnoree[];
  doublons: number;
};

function slugifier(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CHAMPS_METRIQUES = ["impressions", "clicks", "cost", "conversions", "conversionValue"] as const;

/**
 * Écrit les lignes d'un import dans MetricDaily, au niveau "jour" — jamais
 * un niveau agrégé plus large, qui prétendrait à une granularité que le
 * fichier importé n'a pas forcément. Toute ligne dont une valeur mappée est
 * illisible est écartée (jamais convertie en 0) ; une colonne simplement non
 * mappée devient 0, exactement comme une métrique jamais mesurée ailleurs
 * dans ce cockpit.
 */
export async function executerImport(
  db: PrismaClient,
  params: {
    platformAccountId: string;
    devise: string;
    mapping: Mapping;
    rows: LigneBrute[];
  },
): Promise<ResultatImport> {
  const { mapping, rows, platformAccountId, devise } = params;

  const colonneParChamp = new Map<string, string>();
  for (const [colonne, champ] of Object.entries(mapping)) {
    if (champ !== "ignore") colonneParChamp.set(champ, colonne);
  }

  const colDate = colonneParChamp.get("date");
  if (!colDate) throw new Error('Aucune colonne n\'est mappée sur "date" : import impossible.');

  const auMoinsUneMetrique = CHAMPS_METRIQUES.some((c) => colonneParChamp.has(c));
  if (!auMoinsUneMetrique) {
    throw new Error(
      "Aucune colonne n'est mappée sur une métrique mesurée (dépense, impressions, clics ou conversions) : rien à importer.",
    );
  }

  type LignePreparee = {
    date: Date;
    externalEntityId: string;
    entityName: string | null;
    impressions: bigint;
    clicks: bigint;
    cost: number;
    conversions: number;
    conversionValue: number;
    currency: string;
  };

  const colCampaignId = colonneParChamp.get("campaignId");
  const colCampaignName = colonneParChamp.get("campaignName");
  const colCurrency = colonneParChamp.get("currency");
  const level: "account" | "campaign" = colCampaignId || colCampaignName ? "campaign" : "account";

  const parCle = new Map<string, LignePreparee>();
  const skippedSamples: LigneIgnoree[] = [];
  let doublons = 0;

  rows.forEach((ligne, index) => {
    const numeroLigne = index + 2; // ligne 1 = en-têtes

    const dateBrute = ligne[colDate] ?? "";
    const date = parserDate(dateBrute);
    if (!date) {
      if (skippedSamples.length < 20) skippedSamples.push({ ligne: numeroLigne, raison: `Date illisible : "${dateBrute}"` });
      return;
    }

    let externalEntityId = "";
    let entityName: string | null = null;
    if (level === "campaign") {
      if (colCampaignName) entityName = (ligne[colCampaignName] ?? "").trim() || null;
      externalEntityId = colCampaignId ? (ligne[colCampaignId] ?? "").trim() : entityName ? slugifier(entityName) : "";
      if (!externalEntityId) {
        if (skippedSamples.length < 20) skippedSamples.push({ ligne: numeroLigne, raison: "Identifiant de campagne vide." });
        return;
      }
    }

    const valeurs: Record<string, number> = {};
    let ligneInvalide = false;
    for (const champ of CHAMPS_METRIQUES) {
      const colonne = colonneParChamp.get(champ);
      if (!colonne) {
        valeurs[champ] = 0;
        continue;
      }
      const brut = ligne[colonne] ?? "";
      if (brut.trim() === "") {
        valeurs[champ] = 0;
        continue;
      }
      const n = parserNombre(brut);
      if (n === null) {
        if (skippedSamples.length < 20) skippedSamples.push({ ligne: numeroLigne, raison: `Valeur illisible pour "${champ}" : "${brut}"` });
        ligneInvalide = true;
        break;
      }
      valeurs[champ] = n;
    }
    if (ligneInvalide) return;

    const currency = colCurrency ? (ligne[colCurrency] ?? "").trim().toUpperCase() || devise : devise;
    const cle = `${date.toISOString()}::${externalEntityId}`;
    if (parCle.has(cle)) doublons++;

    parCle.set(cle, {
      date,
      externalEntityId,
      entityName,
      impressions: BigInt(Math.round(valeurs.impressions ?? 0)),
      clicks: BigInt(Math.round(valeurs.clicks ?? 0)),
      cost: valeurs.cost ?? 0,
      conversions: valeurs.conversions ?? 0,
      conversionValue: valeurs.conversionValue ?? 0,
      currency,
    });
  });

  const lignesAEcrire = [...parCle.values()];

  if (level === "campaign") {
    const noms = new Map<string, string>();
    for (const l of lignesAEcrire) {
      if (l.entityName) noms.set(l.externalEntityId, l.entityName);
    }
    for (const [externalEntityId, name] of noms) {
      await db.campaign.upsert({
        where: { platformAccountId_externalEntityId: { platformAccountId, externalEntityId } },
        update: { name },
        create: { platformAccountId, externalEntityId, name },
      });
    }
  }

  const TAILLE_LOT = 200;
  for (let i = 0; i < lignesAEcrire.length; i += TAILLE_LOT) {
    const lot = lignesAEcrire.slice(i, i + TAILLE_LOT);
    await db.$transaction(
      lot.map((l) => {
        const externalEntityId = level === "account" ? "" : l.externalEntityId;
        return db.metricDaily.upsert({
          where: {
            platformAccountId_date_granularity_level_externalEntityId: {
              platformAccountId,
              date: l.date,
              granularity: "jour",
              level,
              externalEntityId,
            },
          },
          update: {
            impressions: l.impressions,
            clicks: l.clicks,
            cost: l.cost,
            conversions: l.conversions,
            conversionValue: l.conversionValue,
            currency: l.currency,
            entityName: l.entityName,
            syncedAt: new Date(),
          },
          create: {
            platformAccountId,
            date: l.date,
            granularity: "jour",
            level,
            externalEntityId,
            entityName: l.entityName,
            impressions: l.impressions,
            clicks: l.clicks,
            cost: l.cost,
            conversions: l.conversions,
            conversionValue: l.conversionValue,
            currency: l.currency,
          },
        });
      }),
    );
  }

  return {
    rowsImported: lignesAEcrire.length,
    rowsSkipped: rows.length - lignesAEcrire.length,
    skippedSamples,
    doublons,
  };
}
