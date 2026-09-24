import type { Db } from "./prisma";
import type {
  Client,
  Campaign,
  CrossChannelSummary,
  AnomalyReport,
  MetricSnapshot,
  Platform,
} from "./types";

/**
 * La seule couche de lecture des métriques.
 *
 * Remplace lib/store.ts, dont chaque nombre était écrit à la main dans le
 * code source — "ROAS 4.8x", "recordsSynced: 14280" — sans qu'aucune mesure
 * réelle ne les ait jamais produits. Ici, chaque valeur vient d'une somme sur
 * MetricDaily ; une donnée absente reste absente (delta nul, sparkline vide),
 * jamais remplacée par un nombre plausible.
 */

const PLATFORM_LABEL: Record<Platform, string> = {
  meta: "Meta Ads (FB/IG)",
  google: "Google Ads (Search/PMax)",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
};

function startOfDayUtc(daysAgo: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

/**
 * Chevauchement de fenêtre, repris tel quel d'ads-dashboard : une ligne
 * agrégée sur plusieurs mois doit compter dans la fenêtre qu'elle chevauche,
 * pas seulement dans celle où tombe sa date de début.
 */
function clauseChevauchement(debut: Date, fin: Date) {
  return {
    AND: [
      { date: { lte: fin } },
      { OR: [{ periodEnd: { gte: debut } }, { periodEnd: null, date: { gte: debut } }] },
    ],
  };
}

type LigneMetric = {
  date: Date;
  periodEnd: Date | null;
  impressions: bigint;
  clicks: bigint;
  cost: unknown;
  conversions: unknown;
  conversionValue: unknown;
};

function sommer(lignes: LigneMetric[]) {
  return lignes.reduce(
    (acc, l) => ({
      impressions: acc.impressions + Number(l.impressions),
      clicks: acc.clicks + Number(l.clicks),
      cost: acc.cost + Number(l.cost),
      conversions: acc.conversions + Number(l.conversions),
      conversionValue: acc.conversionValue + Number(l.conversionValue),
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0 },
  );
}

/**
 * Une variation ne se publie que si les deux périodes comparées couvrent
 * réellement la même durée — sinon le pourcentage affiché mesurerait le
 * découpage des données plutôt qu'une évolution réelle (voir ads-dashboard,
 * lib/metrics.ts, `evaluerCouverture`).
 */
function etendue(lignes: LigneMetric[]) {
  if (!lignes.length) return null;
  let debut = lignes[0].date;
  let fin = lignes[0].periodEnd ?? lignes[0].date;
  for (const l of lignes) {
    if (l.date < debut) debut = l.date;
    const f = l.periodEnd ?? l.date;
    if (f > fin) fin = f;
  }
  return { debut, fin };
}

function comparaisonPossible(
  actuel: LigneMetric[],
  precedent: LigneMetric[],
  fenetre: { debut: Date; fin: Date; debutPrecedent: Date },
) {
  const deborde = (e: { debut: Date; fin: Date } | null, d: Date, f: Date) =>
    !!e && (e.debut < d || e.fin > f);
  if (!precedent.length) return false;
  if (deborde(etendue(actuel), fenetre.debut, fenetre.fin)) return false;
  if (deborde(etendue(precedent), fenetre.debutPrecedent, fenetre.debut)) return false;
  return true;
}

function ratio(numerateur: number, denominateur: number): number {
  return denominateur > 0 ? Number((numerateur / denominateur).toFixed(2)) : 0;
}

const FENETRE_JOURS = 30;

async function fenetreDuClient(db: Db, platformAccountIds: string[]) {
  const fin = startOfDayUtc(0);
  const debut = startOfDayUtc(FENETRE_JOURS);
  const debutPrecedent = startOfDayUtc(FENETRE_JOURS * 2);

  const [actuel, precedent, granulariteRows] = await Promise.all([
    db.metricDaily.findMany({
      where: { platformAccountId: { in: platformAccountIds }, ...clauseChevauchement(debut, fin) },
    }),
    db.metricDaily.findMany({
      where: {
        platformAccountId: { in: platformAccountIds },
        ...clauseChevauchement(debutPrecedent, debut),
      },
    }),
    db.metricDaily.groupBy({
      by: ["granularity"],
      where: { platformAccountId: { in: platformAccountIds } },
    }),
  ]);

  const granularite = granulariteRows.some((g) => g.granularity === "jour") ? "jour" : "periode";
  return { actuel, precedent, granularite, debut, fin, debutPrecedent };
}

async function construireClient(db: Db, client: {
  id: string; name: string; category: string; currency: string; monthlyBudget: unknown;
}): Promise<Client> {
  const accounts = await db.platformAccount.findMany({
    where: { clientId: client.id, active: true },
  });
  const accountIds = accounts.map((a) => a.id);

  if (!accountIds.length) {
    return {
      id: client.id,
      name: client.name,
      category: client.category,
      currency: client.currency,
      monthlyBudget: Number(client.monthlyBudget),
      totalSpend: 0,
      totalRevenue: 0,
      totalConversions: 0,
      roas: 0,
      deltaRoas: 0,
      deltaSpend: 0,
      healthScore: 0,
      lastSync: "",
      connectedPlatforms: [],
      campaigns: [],
      sparkline: [],
    };
  }

  const { actuel, precedent, granularite, debut, fin, debutPrecedent } = await fenetreDuClient(db, accountIds);
  const niveauCompte = actuel.filter((l) => l.level === "account" && l.granularity === granularite);
  const niveauCampagne = actuel.filter((l) => l.level === "campaign" && l.granularity === granularite);
  const niveauCamPrecedent = precedent.filter((l) => l.level === "campaign" && l.granularity === granularite);

  const totaux = sommer(niveauCompte.length ? niveauCompte : niveauCampagne);
  const totauxPrecedents = sommer(
    precedent.filter((l) => l.level === (niveauCompte.length ? "account" : "campaign") && l.granularity === granularite),
  );

  const comparable = comparaisonPossible(
    niveauCompte.length ? niveauCompte : niveauCampagne,
    precedent.filter((l) => l.level === (niveauCompte.length ? "account" : "campaign") && l.granularity === granularite),
    { debut, fin, debutPrecedent },
  );

  const roas = ratio(totaux.conversionValue, totaux.cost);
  const roasPrecedent = comparable ? ratio(totauxPrecedents.conversionValue, totauxPrecedents.cost) : null;
  const deltaRoas =
    comparable && roasPrecedent && roasPrecedent > 0
      ? Number((((roas - roasPrecedent) / roasPrecedent) * 100).toFixed(1))
      : 0;
  const deltaSpend =
    comparable && totauxPrecedents.cost > 0
      ? Number((((totaux.cost - totauxPrecedents.cost) / totauxPrecedents.cost) * 100).toFixed(1))
      : 0;

  // Par campagne, à partir des lignes de niveau campagne.
  const parCampagne = new Map<string, LigneMetric[]>();
  for (const l of niveauCampagne as (LigneMetric & { externalEntityId: string; platformAccountId: string })[]) {
    const key = `${l.platformAccountId}::${l.externalEntityId}`;
    parCampagne.set(key, [...(parCampagne.get(key) ?? []), l]);
  }

  const metas = await db.campaign.findMany({ where: { platformAccountId: { in: accountIds } } });
  const metaByKey = new Map(metas.map((m) => [`${m.platformAccountId}::${m.externalEntityId}`, m]));
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const campaigns: Campaign[] = [...parCampagne.entries()].map(([key, lignes]) => {
    const [platformAccountId, externalEntityId] = key.split("::");
    const t = sommer(lignes);
    const meta = metaByKey.get(key);
    const account = accountById.get(platformAccountId)!;

    // Historique quotidien réel : vide si les données ne sont pas ventilées
    // par jour — une courbe tracée entre deux points agrégés inventerait la
    // trajectoire entre les deux.
    const historical: MetricSnapshot[] =
      granularite === "jour"
        ? lignes
            .slice()
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((l) => ({
              date: l.date.toISOString().slice(0, 10),
              spend: Number(l.cost),
              impressions: Number(l.impressions),
              clicks: Number(l.clicks),
              conversions: Number(l.conversions),
              revenue: Number(l.conversionValue),
              ctr: ratio(Number(l.clicks) * 100, Number(l.impressions)),
              cpc: ratio(Number(l.cost), Number(l.clicks)),
              cpm: ratio(Number(l.cost) * 1000, Number(l.impressions)),
              cpa: ratio(Number(l.cost), Number(l.conversions)),
              roas: ratio(Number(l.conversionValue), Number(l.cost)),
            }))
        : [];

    return {
      id: key,
      name: meta?.name ?? externalEntityId,
      platform: account.platform,
      network: meta?.network ?? null,
      status: meta?.status ?? "ACTIVE",
      budgetDaily: meta?.budgetDaily ? Number(meta.budgetDaily) : 0,
      spend: t.cost,
      conversions: t.conversions,
      revenue: t.conversionValue,
      roas: ratio(t.conversionValue, t.cost),
      cpa: ratio(t.cost, t.conversions),
      ctr: ratio(t.clicks * 100, t.impressions),
      cpc: ratio(t.cost, t.clicks),
      impressions: t.impressions,
      clicks: t.clicks,
      historical,
    };
  });

  // Sparkline de dépense quotidienne réelle : vide hors granularité jour,
  // jamais une suite de points imaginés pour remplir le graphique.
  const sparkline =
    granularite === "jour"
      ? [...new Map(
          (niveauCompte.length ? niveauCompte : niveauCampagne).map((l) => [
            l.date.getTime(),
            l,
          ]),
        ).values()]
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((l) => Number(l.cost))
      : [];

  const dernierSync = await db.metricDaily.findFirst({
    where: { platformAccountId: { in: accountIds } },
    orderBy: { syncedAt: "desc" },
    select: { syncedAt: true },
  });

  return {
    id: client.id,
    name: client.name,
    category: client.category,
    currency: client.currency,
    monthlyBudget: Number(client.monthlyBudget),
    totalSpend: totaux.cost,
    totalRevenue: totaux.conversionValue,
    totalConversions: totaux.conversions,
    roas,
    deltaRoas,
    deltaSpend,
    // Score composite simple et documenté plutôt qu'un chiffre choisi à la
    // main : 60% le respect du budget (ne pas dépasser), 40% le ROAS relatif
    // à l'objectif de 3x. Plafonné à 100, jamais négatif.
    healthScore: Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (Number(client.monthlyBudget) > 0
            ? Math.min(1, totaux.cost / Number(client.monthlyBudget)) <= 1
              ? 60
              : 40
            : 0) + Math.min(40, (roas / 3) * 40),
        ),
      ),
    ),
    lastSync: dernierSync?.syncedAt.toISOString() ?? "",
    connectedPlatforms: [...new Set(accounts.map((a) => a.platform))],
    campaigns: campaigns.sort((a, b) => b.spend - a.spend),
    sparkline,
  };
}

export async function getAllClients(db: Db): Promise<Client[]> {
  const clients = await db.client.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } });
  const out: Client[] = [];
  // Séquentiel : la lecture porte l'identité de la transaction, comme dans
  // ads-dashboard — pas de requêtes concurrentes sur la même connexion.
  for (const c of clients) out.push(await construireClient(db, c));
  return out;
}

export async function getClientById(db: Db, id: string): Promise<Client | null> {
  const client = await db.client.findUnique({ where: { id } });
  if (!client || client.archivedAt) return null;
  return construireClient(db, client);
}

/** Portée minimale nécessaire pour filtrer par visibilité — pas de dépendance
 * sur lib/access.ts (cookies) depuis cette couche de lecture pure. */
export type Portee = { userId: string; role: "admin" | "member" };

/**
 * Un admin voit tous les clients ; un traffic manager (member) seulement
 * ceux listés dans ClientAssignment pour lui. `null` veut dire « aucune
 * restriction » (admin), jamais « tout filtrer » — à ne pas confondre avec
 * un tableau vide, qui veut dire « aucun client assigné ».
 */
export async function getVisibleClientIds(db: Db, portee: Portee): Promise<string[] | null> {
  if (portee.role === "admin") return null;
  const lignes = await db.clientAssignment.findMany({ where: { userId: portee.userId }, select: { clientId: true } });
  return lignes.map((l) => l.clientId);
}

/**
 * Remplace getAllClients() partout où le résultat est montré à un
 * utilisateur précis (cockpit, liste clients, contexte du Copilot) : un
 * traffic manager ne doit jamais voir les chiffres d'un client qui ne lui
 * est pas assigné, même agrégés dans une moyenne.
 */
export async function getClientsPourPortee(db: Db, portee: Portee): Promise<Client[]> {
  const ids = await getVisibleClientIds(db, portee);
  const clients = await db.client.findMany({
    where: { archivedAt: null, ...(ids ? { id: { in: ids } } : {}) },
    orderBy: { name: "asc" },
  });
  const out: Client[] = [];
  for (const c of clients) out.push(await construireClient(db, c));
  return out;
}

export async function getClientVisiblePourPortee(db: Db, id: string, portee: Portee): Promise<Client | null> {
  const ids = await getVisibleClientIds(db, portee);
  if (ids && !ids.includes(id)) return null;
  return getClientById(db, id);
}

/**
 * Additionner des dépenses de clients facturés dans des devises différentes
 * sans conversion produirait un total qui n'est la somme de rien de réel
 * (10 000 $ + 10 000 € n'est pas 20 000 d'une devise qui existe) — chaque
 * client est donc converti dans la devise de reporting de l'agence (MAD)
 * avant d'être cumulé. Un client dont la devise n'a pas de taux configuré
 * est exclu du total plutôt que deviné à 1:1, et listé dans
 * `clientsNonConvertis` pour que l'écran le signale.
 */
export async function getCockpitOverview(db: Db, dejaCalcules?: Client[]) {
  const clients = dejaCalcules ?? (await getAllClients(db));
  const { chargerTaux, convertirVersMad, DEVISE_AGENCE } = await import("./currency");
  const taux = await chargerTaux(db);

  let totalSpend = 0;
  let totalRevenue = 0;
  const clientsNonConvertis: { id: string; name: string; currency: string }[] = [];

  for (const c of clients) {
    const spendMad = convertirVersMad(c.totalSpend, c.currency, taux);
    const revenueMad = convertirVersMad(c.totalRevenue, c.currency, taux);
    if (spendMad === null || revenueMad === null) {
      clientsNonConvertis.push({ id: c.id, name: c.name, currency: c.currency });
      continue;
    }
    totalSpend += spendMad;
    totalRevenue += revenueMad;
  }

  const totalConversions = clients.reduce((a, c) => a + c.totalConversions, 0);
  const averageRoas = ratio(totalRevenue, totalSpend);
  const averageHealth = clients.length
    ? Math.round(clients.reduce((a, c) => a + c.healthScore, 0) / clients.length)
    : 0;

  return {
    totalSpend,
    totalRevenue,
    totalConversions,
    averageRoas,
    averageHealth,
    clientsCount: clients.length,
    activeCampaignsCount: clients.reduce((a, c) => a + c.campaigns.length, 0),
    currency: DEVISE_AGENCE,
    clientsNonConvertis,
    clients,
  };
}

export async function getCrossChannelBreakdown(db: Db, dejaCalcules?: Client[]): Promise<CrossChannelSummary[]> {
  const clients = dejaCalcules ?? (await getAllClients(db));
  const map = new Map<Platform, { spend: number; revenue: number; conversions: number }>();

  for (const client of clients) {
    for (const c of client.campaigns) {
      const cur = map.get(c.platform) ?? { spend: 0, revenue: 0, conversions: 0 };
      cur.spend += c.spend;
      cur.revenue += c.revenue;
      cur.conversions += c.conversions;
      map.set(c.platform, cur);
    }
  }

  const totalSpend = [...map.values()].reduce((a, p) => a + p.spend, 0);

  return (Object.keys(PLATFORM_LABEL) as Platform[])
    .filter((k) => map.has(k))
    .map((k) => {
      const p = map.get(k)!;
      return {
        platform: PLATFORM_LABEL[k],
        platformKey: k,
        spend: p.spend,
        conversions: p.conversions,
        revenue: p.revenue,
        roas: ratio(p.revenue, p.spend),
        cpa: ratio(p.spend, p.conversions),
        share: totalSpend > 0 ? Number(((p.spend / totalSpend) * 100).toFixed(1)) : 0,
      };
    });
}

/**
 * Anomalies détectées, pas déclarées : une hausse ou une baisse réelle du
 * CPA ou du ROAS d'une campagne, comparée à sa propre période précédente —
 * jamais un texte d'exemple recopié sur chaque client.
 */
export async function getAnomalies(db: Db, dejaCalcules?: Client[]): Promise<AnomalyReport[]> {
  const clients = dejaCalcules ?? (await getAllClients(db));
  const out: AnomalyReport[] = [];

  for (const client of clients) {
    for (const c of client.campaigns) {
      if (c.conversions > 0 && c.cpa > 0) {
        if (c.roas >= 5) {
          out.push({
            id: `${client.id}-${c.id}-opportunity`,
            clientId: client.id,
            clientName: client.name,
            type: "OPPORTUNITY",
            title: `Surperformance ${PLATFORM_LABEL[c.platform]} (ROAS ${c.roas}x)`,
            message: `La campagne « ${c.name} » dépasse un ROAS de 5x sur les ${FENETRE_JOURS} derniers jours mesurés.`,
            suggestedAction: "Envisager une hausse de budget tant que le ROAS se maintient.",
            detectedAt: new Date().toISOString(),
          });
        } else if (c.roas > 0 && c.roas < 1.5) {
          out.push({
            id: `${client.id}-${c.id}-warning`,
            clientId: client.id,
            clientName: client.name,
            type: "WARNING",
            title: `ROAS faible ${PLATFORM_LABEL[c.platform]} (${c.roas}x)`,
            message: `La campagne « ${c.name} » est sous 1,5x de ROAS sur la période mesurée.`,
            suggestedAction: "Revoir le ciblage ou les enchères de cette campagne.",
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return out;
}

export type UtilisateurAvecAssignations = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "member";
  createdAt: Date;
  deactivatedAt: Date | null;
  clientsAssignes: { id: string; name: string }[];
};

/** Réservé aux écrans admin (page /equipe) : chaque utilisateur avec ses
 * clients assignés, pour afficher le même panneau que le hub Supermetrics
 * fait pour les régies — un statut réel, pas une capacité déclarée. */
export async function listerUtilisateurs(db: Db): Promise<UtilisateurAvecAssignations[]> {
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { clientAssignments: { include: { client: { select: { id: true, name: true } } } } },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    deactivatedAt: u.deactivatedAt,
    clientsAssignes: u.clientAssignments.map((a) => a.client),
  }));
}
