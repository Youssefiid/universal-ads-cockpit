import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";

/**
 * Crée le tout premier compte admin d'un déploiement neuf — sans lui,
 * personne ne pourrait jamais se connecter (aucune inscription publique,
 * /equipe exige déjà une session admin). N'écrit rien si un utilisateur
 * existe déjà : rejouable sans risque à chaque déploiement, n'écrase jamais
 * un compte réel.
 *
 * Le mot de passe vient de INITIAL_ADMIN_PASSWORD (généré une fois par
 * Render, jamais choisi ni vu par Claude) : ce script ne l'affiche jamais
 * dans les logs de build. Visible uniquement dans l'onglet Environment du
 * service, dans le tableau de bord Render du propriétaire du compte.
 */
async function main() {
  const dejaDesUtilisateurs = (await prisma.user.count()) > 0;
  if (dejaDesUtilisateurs) {
    console.log("bootstrap-admin: au moins un utilisateur existe déjà, rien à faire.");
    return;
  }

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("bootstrap-admin: INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD absents, aucun compte créé.");
    return;
  }

  await prisma.user.create({
    data: { email: email.toLowerCase(), role: "admin", passwordHash: await hashPassword(password) },
  });
  console.log(`bootstrap-admin: premier compte admin créé pour ${email} (mot de passe dans les variables d'environnement du service, jamais affiché ici).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
