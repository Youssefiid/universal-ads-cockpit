import "dotenv/config";
import { prisma } from "../lib/prisma";
import { getAllClients, getCockpitOverview, getCrossChannelBreakdown } from "../lib/queries";

/**
 * Vérifications de cohérence, reconstruites sur des faits.
 *
 * L'ancienne version vérifiait que `getCockpitOverview().totalSpend`
 * valait exactement 70750 — une assertion qui ne prouvait rien de réel,
 * puisque 70750 était lui même la somme des nombres inventés dans
 * lib/store.ts. Vérifier qu'une donnée fabriquée reproduit fidèlement sa
 * propre fabrication n'est pas un audit.
 *
 * Celui-ci vérifie des invariants qui restent vrais quelles que soient les
 * données réellement importées : la somme par client égale le total agence,
 * la somme par régie égale le même total, les parts de budget totalisent
 * 100 %, et aucun total n'est négatif.
 */

let echecs = 0;

function verifier(nom: string, condition: boolean, detail: string) {
  const icone = condition ? "✅" : "❌";
  console.log(`${icone} ${nom} : ${detail}`);
  if (!condition) echecs++;
}

async function main() {
  console.log("═".repeat(70));
  console.log("AUDIT DE COHÉRENCE — UNIVERSAL ADS COCKPIT");
  console.log("═".repeat(70));

  const clients = await getAllClients(prisma);
  const overview = await getCockpitOverview(prisma, clients);
  const breakdown = await getCrossChannelBreakdown(prisma, clients);

  const sommeParClient = clients.reduce((a, c) => a + c.totalSpend, 0);
  verifier(
    "Somme des dépenses clients = total agence",
    Math.abs(sommeParClient - overview.totalSpend) < 0.01,
    `${sommeParClient} vs ${overview.totalSpend}`,
  );

  const sommeParRegie = breakdown.reduce((a, c) => a + c.spend, 0);
  verifier(
    "Somme des dépenses par régie = total agence",
    Math.abs(sommeParRegie - overview.totalSpend) < 0.01,
    `${sommeParRegie} vs ${overview.totalSpend}`,
  );

  const sommeParts = breakdown.reduce((a, c) => a + c.share, 0);
  verifier(
    "Les parts de budget par régie totalisent ~100%",
    breakdown.length === 0 || Math.abs(sommeParts - 100) < 1,
    `${sommeParts.toFixed(1)}%`,
  );

  verifier("Aucun total négatif", overview.totalSpend >= 0 && overview.totalRevenue >= 0, "vérifié");

  verifier(
    "Aucune campagne ne prétend un ROAS sans dépense mesurée",
    clients.every((c) => c.campaigns.every((camp) => camp.spend > 0 || camp.roas === 0)),
    "vérifié",
  );

  console.log("\n" + "═".repeat(70));
  console.log(
    echecs === 0
      ? `✅ ${clients.length} client(s), 0 incohérence détectée.`
      : `❌ ${echecs} incohérence(s) détectée(s) — voir ci-dessus.`,
  );
  console.log("═".repeat(70));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
