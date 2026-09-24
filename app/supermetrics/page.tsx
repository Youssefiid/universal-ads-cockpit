import { redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { SupermetricsHubClient } from "@/components/SupermetricsHubClient";

export default async function SupermetricsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const credential = await prismaApp.connectorCredential.findUnique({
    where: { provider: "supermetrics" },
    select: { hint: true, checkedAt: true, checkOk: true, checkNote: true },
  });

  const accounts = await prismaApp.platformAccount.groupBy({
    by: ["platform"],
    where: { active: true },
    _count: { _all: true },
  });

  return (
    <SupermetricsHubClient
      credential={credential}
      accountCounts={accounts.map((a) => ({ platform: a.platform, count: a._count._all }))}
      isAdmin={session.role === "admin"}
    />
  );
}

export const dynamic = "force-dynamic";
