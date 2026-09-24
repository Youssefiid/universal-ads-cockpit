import { redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { getClientsPourPortee } from "@/lib/queries";
import { creerClient } from "@/lib/actions";
import { ClientsListClient } from "@/components/ClientsListClient";

export default async function ClientsListPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const clients = await getClientsPourPortee(prismaApp, session);

  return <ClientsListClient clients={clients} createAction={creerClient} />;
}

export const dynamic = "force-dynamic";
