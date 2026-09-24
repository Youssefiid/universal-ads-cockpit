import { redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { getClientsPourPortee, getCockpitOverview, getCrossChannelBreakdown, getAnomalies } from "@/lib/queries";
import { CockpitOverviewClient } from "@/components/CockpitOverviewClient";

export default async function CockpitOverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Une seule lecture des clients, réutilisée pour les trois agrégats : les
  // calculer séparément aurait relu et recalculé la même chose trois fois.
  // Scopée à la portée de session : un traffic manager ne voit que ses
  // clients assignés, un admin voit tout.
  const clients = await getClientsPourPortee(prismaApp, session);
  const [overview, crossChannel, anomalies] = await Promise.all([
    getCockpitOverview(prismaApp, clients),
    getCrossChannelBreakdown(prismaApp, clients),
    getAnomalies(prismaApp, clients),
  ]);

  return <CockpitOverviewClient overview={overview} crossChannel={crossChannel} anomalies={anomalies} />;
}

export const dynamic = "force-dynamic";
