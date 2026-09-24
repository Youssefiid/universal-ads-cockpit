import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { listerUtilisateurs } from "@/lib/queries";
import { creerUtilisateur, assignerClient, retirerAssignation, reinitialiserMotDePasse, basculerActivationUtilisateur } from "@/lib/actions";
import { EquipeClient } from "@/components/EquipeClient";

export default async function EquipePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") notFound();

  const [utilisateurs, clients] = await Promise.all([
    listerUtilisateurs(prismaApp),
    prismaApp.client.findMany({ where: { archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <EquipeClient
      utilisateurs={utilisateurs}
      clients={clients}
      currentUserId={session.userId}
      createAction={creerUtilisateur}
      assignAction={assignerClient}
      unassignAction={retirerAssignation}
      resetPasswordAction={reinitialiserMotDePasse}
      toggleActivationAction={basculerActivationUtilisateur}
    />
  );
}

export const dynamic = "force-dynamic";
