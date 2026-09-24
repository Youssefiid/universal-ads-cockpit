import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/access";
import { prismaApp } from "@/lib/prisma";
import { enregistrerTauxChange } from "@/lib/actions";
import { DevisesClient } from "@/components/DevisesClient";

/** Réservé aux administrateurs : mêmes clés partagées par tout le staff que
 * les autres réglages d'agence (Connecteurs, Équipe). */
export default async function DevisesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") notFound();

  const [taux, devisesUtilisees] = await Promise.all([
    prismaApp.exchangeRate.findMany({ orderBy: { currency: "asc" } }),
    prismaApp.client.findMany({ where: { archivedAt: null }, select: { currency: true }, distinct: ["currency"] }),
  ]);

  return (
    <DevisesClient
      taux={taux.map((t) => ({ currency: t.currency, rateToMad: Number(t.rateToMad), updatedAt: t.updatedAt }))}
      devisesUtilisees={devisesUtilisees.map((d) => d.currency)}
      saveAction={enregistrerTauxChange}
    />
  );
}

export const dynamic = "force-dynamic";
