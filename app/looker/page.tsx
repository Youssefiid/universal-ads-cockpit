import { redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { getCockpitOverview, getCrossChannelBreakdown } from "@/lib/queries";
import { LookerPageClient } from "@/components/LookerPageClient";

export default async function LookerStudioPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [overview, crossChannel] = await Promise.all([
    getCockpitOverview(prismaApp),
    getCrossChannelBreakdown(prismaApp),
  ]);

  return <LookerPageClient overview={overview} channels={crossChannel} />;
}

export const dynamic = "force-dynamic";
