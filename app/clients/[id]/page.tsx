import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { getClientVisiblePourPortee } from "@/lib/queries";
import { ClientDetailClient } from "@/components/ClientDetailClient";

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const client = await getClientVisiblePourPortee(prismaApp, id, session);
  if (!client) notFound();

  return <ClientDetailClient client={client} />;
}

export const dynamic = "force-dynamic";
