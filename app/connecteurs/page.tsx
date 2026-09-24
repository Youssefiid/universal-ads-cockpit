import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { enregistrerCleConnecteur } from "@/lib/actions";
import { ConnecteursClient } from "@/components/ConnecteursClient";

/**
 * Réservé aux administrateurs : ces clés sont partagées par tout le staff
 * et servent de repli pour les actions IA de chacun (voir /profil). Un
 * traffic manager qui pourrait les remplacer casserait la connectivité de
 * toute l'agence, ou y substituerait une clé qu'il contrôle seul.
 */
export default async function ConnecteursPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") notFound();

  const credentials = await prismaApp.connectorCredential.findMany({
    select: { provider: true, hint: true, label: true, checkedAt: true, checkOk: true, checkNote: true },
  });

  return <ConnecteursClient credentials={credentials} saveAction={enregistrerCleConnecteur} />;
}

export const dynamic = "force-dynamic";
