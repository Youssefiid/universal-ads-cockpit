import { redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { getVisibleClientIds } from "@/lib/queries";
import { ImportClient } from "@/components/ImportClient";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const visibleIds = await getVisibleClientIds(prismaApp, session);
  const filtreClient = visibleIds ? { id: { in: visibleIds } } : {};

  const clients = await prismaApp.client.findMany({
    where: { archivedAt: null, ...filtreClient },
    select: {
      id: true,
      name: true,
      currency: true,
      platformAccounts: { where: { active: true }, select: { id: true, platform: true, displayName: true } },
    },
    orderBy: { name: "asc" },
  });

  const imports = await prismaApp.importBatch.findMany({
    where: { ...(visibleIds ? { clientId: { in: visibleIds } } : {}) },
    orderBy: { importedAt: "desc" },
    take: 20,
    include: {
      client: { select: { name: true } },
      platformAccount: { select: { displayName: true, platform: true } },
      importedBy: { select: { email: true, name: true } },
    },
  });

  return <ImportClient clients={clients} imports={imports} />;
}

export const dynamic = "force-dynamic";
