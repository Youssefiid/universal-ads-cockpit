"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prismaApp } from "./prisma";
import { createSessionToken, verifyPassword, SESSION_COOKIE, SESSION_MAX_AGE } from "./auth";
import { getSession } from "./access";

/**
 * Frein contre le brute force sur la connexion, repris d'ads-dashboard :
 * après 8 échecs sur une même adresse en 15 minutes, la connexion est
 * refusée sans même vérifier le mot de passe.
 */
const FENETRE_LOGIN_MINUTES = 15;
const SEUIL_ECHECS_LOGIN = 8;

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (email) {
    const depuis = new Date(Date.now() - FENETRE_LOGIN_MINUTES * 60_000);
    const echecsRecents = await prismaApp.accessLog.count({
      where: { action: "login_failed", target: email, at: { gte: depuis } },
    });
    if (echecsRecents >= SEUIL_ECHECS_LOGIN) {
      redirect("/login?erreur=trop_de_tentatives");
    }
  }

  const user = email ? await prismaApp.user.findUnique({ where: { email } }) : null;
  const valide = user && !user.deactivatedAt && (await verifyPassword(password, user.passwordHash));

  if (!valide || !user) {
    if (email) {
      await prismaApp.accessLog.create({
        data: { action: "login_failed", target: email },
      });
    }
    redirect("/login?erreur=identifiants");
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  await prismaApp.accessLog.create({ data: { userId: user.id, action: "login_success" } });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

/**
 * Le Copilot IA : une vraie réponse de Claude, cadrée sur les chiffres
 * mesurés de la portée demandée (un client, ou l'agence entière si aucun
 * n'est précisé). Remplace le générateur à mots-clés qui répondait toujours
 * la même chose sous un badge « Zéro hallucination ».
 */
export async function envoyerMessageChat(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("NOT_FOUND");

  const clientId = String(formData.get("clientId") ?? "") || null;
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { texte: "" };

  const { getClientVisiblePourPortee, getCockpitOverview, getClientsPourPortee } = await import("./queries");

  // Clé personnelle d'abord (Profil), clé d'agence en repli — même règle
  // qu'annoncée sur le hub Connecteurs.
  const clePersonnelle = await prismaApp.userConnectorCredential.findUnique({
    where: { userId_provider: { userId: session.userId, provider: "anthropic" } },
  });
  const cleAgence = clePersonnelle ?? (await prismaApp.connectorCredential.findUnique({ where: { provider: "anthropic" } }));
  if (!cleAgence) {
    throw new Error(
      "Aucune clé Anthropic n'est enregistrée (ni personnelle, ni d'agence) : le Copilot ne peut pas répondre tant qu'elle n'est pas posée dans Connecteurs ou dans votre Profil.",
    );
  }

  const { repondre } = await import("./chat");

  let contexte;
  if (clientId) {
    const client = await getClientVisiblePourPortee(prismaApp, clientId, session);
    contexte = {
      portee: client ? client.name : "client inconnu ou non assigné",
      devise: client?.currency ?? "EUR",
      totaux: client
        ? { spend: client.totalSpend, revenue: client.totalRevenue, conversions: client.totalConversions, roas: client.roas }
        : null,
      comparaisonPossible: client ? client.deltaRoas !== 0 || client.deltaSpend !== 0 : false,
    };
  } else {
    const clients = await getClientsPourPortee(prismaApp, session);
    const overview = await getCockpitOverview(prismaApp, clients);
    contexte = {
      portee: session.role === "admin" ? "toutes régies et tous clients confondus" : "les clients qui vous sont assignés",
      devise: "EUR",
      totaux: {
        spend: overview.totalSpend,
        revenue: overview.totalRevenue,
        conversions: overview.totalConversions,
        roas: overview.averageRoas,
      },
      comparaisonPossible: false,
    };
  }

  const reponse = await repondre(cleAgence.secret, contexte, [{ role: "user", content: message }]);
  return { texte: reponse.texte };
}

const FOURNISSEURS_IA = ["anthropic", "openai", "google"] as const;
type FournisseurConnecteur = "supermetrics" | (typeof FOURNISSEURS_IA)[number];

async function eprouverCle(provider: FournisseurConnecteur, cle: string): Promise<{ ok: boolean | null; note: string }> {
  if (provider === "anthropic") {
    const reponse = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "anthropic-version": "2023-06-01", "X-Api-Key": cle },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    if (reponse && (reponse.status === 401 || reponse.status === 403)) {
      throw new Error("Clé Anthropic refusée par le fournisseur.");
    }
    return { ok: reponse?.ok ?? null, note: reponse?.ok ? "Clé éprouvée auprès d'Anthropic." : "Clé enregistrée sans être éprouvée." };
  }
  if (provider === "supermetrics") {
    const { listerComptesSupermetrics, ErreurSupermetrics } = await import("./supermetrics");
    try {
      const comptes = await listerComptesSupermetrics(cle, "google");
      return { ok: true, note: `Clé éprouvée : ${comptes.length} compte(s) Google Ads visible(s).` };
    } catch (e) {
      if (e instanceof ErreurSupermetrics && e.statut === 401) throw new Error(e.message);
      return { ok: false, note: `Clé enregistrée sans être éprouvée : ${e instanceof Error ? e.message : "erreur inconnue"}.` };
    }
  }
  // openai / google (Gemini) : pas encore branchés à une fonctionnalité du
  // cockpit — on enregistre la clé sans prétendre l'avoir vérifiée.
  return { ok: null, note: "Clé enregistrée sans vérification : ce fournisseur n'est pas encore branché à une fonctionnalité du cockpit." };
}

/** Clé d'agence, partagée par tout le staff — hub Connecteurs. */
export async function enregistrerCleConnecteur(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("NOT_FOUND");

  const provider = String(formData.get("provider") ?? "") as FournisseurConnecteur;
  if (!["supermetrics", ...FOURNISSEURS_IA].includes(provider)) throw new Error("Fournisseur inconnu.");

  const cle = String(formData.get("cle") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || null;
  if (cle.length < 8) throw new Error("Cette clé semble trop courte pour être valide.");

  const { ok, note } = await eprouverCle(provider, cle);

  await prismaApp.connectorCredential.upsert({
    where: { provider },
    update: { secret: cle, hint: cle.slice(-4), label, checkedAt: new Date(), checkOk: ok, checkNote: note },
    create: { provider, secret: cle, hint: cle.slice(-4), label, checkedAt: new Date(), checkOk: ok, checkNote: note },
  });
}

/** Clé personnelle d'un membre du staff (page Profil), prioritaire sur la
 * clé d'agence pour ses propres actions IA. */
export async function enregistrerClePersonnelle(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("NOT_FOUND");

  const provider = String(formData.get("provider") ?? "") as (typeof FOURNISSEURS_IA)[number];
  if (!FOURNISSEURS_IA.includes(provider)) throw new Error("Fournisseur inconnu.");

  const cle = String(formData.get("cle") ?? "").trim();
  if (cle.length < 8) throw new Error("Cette clé semble trop courte pour être valide.");

  const { ok, note } = await eprouverCle(provider, cle);

  await prismaApp.userConnectorCredential.upsert({
    where: { userId_provider: { userId: session.userId, provider } },
    update: { secret: cle, hint: cle.slice(-4), checkedAt: new Date(), checkOk: ok, checkNote: note },
    create: { userId: session.userId, provider, secret: cle, hint: cle.slice(-4), checkedAt: new Date(), checkOk: ok, checkNote: note },
  });
}

function slugifier(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ajoute un nouveau client suivi par l'agence. */
export async function creerClient(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("NOT_FOUND");

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const currency = String(formData.get("currency") ?? "EUR").trim().toUpperCase();
  const monthlyBudget = Number(formData.get("monthlyBudget"));

  if (!name || !category) throw new Error("Le nom et la catégorie sont obligatoires.");
  if (!Number.isFinite(monthlyBudget) || monthlyBudget <= 0) throw new Error("Le budget mensuel doit être un nombre positif.");

  const id = slugifier(name);
  if (!id) throw new Error("Ce nom ne produit aucun identifiant valide.");

  const existant = await prismaApp.client.findUnique({ where: { id } });
  if (existant) throw new Error(`Un client avec l'identifiant "${id}" existe déjà : choisissez un nom légèrement différent.`);

  await prismaApp.client.create({ data: { id, name, category, currency, monthlyBudget } });

  // Un traffic manager qui crée un client se l'assigne automatiquement,
  // sinon il viendrait de créer un client qu'il ne peut plus voir.
  if (session.role === "member") {
    await prismaApp.clientAssignment.create({ data: { userId: session.userId, clientId: id } });
  }
}

/** Réservé aux administrateurs : assigne un client à un traffic manager. */
export async function assignerClient(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("NOT_FOUND");

  const userId = String(formData.get("userId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!userId || !clientId) throw new Error("PARAMETRES_INVALIDES");

  await prismaApp.clientAssignment.upsert({
    where: { userId_clientId: { userId, clientId } },
    update: {},
    create: { userId, clientId },
  });
}

/** Réservé aux administrateurs : retire un client assigné à un traffic manager. */
export async function retirerAssignation(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("NOT_FOUND");

  const userId = String(formData.get("userId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!userId || !clientId) throw new Error("PARAMETRES_INVALIDES");

  await prismaApp.clientAssignment.deleteMany({ where: { userId, clientId } });
}

/** Réservé aux administrateurs : ajoute un membre du staff. */
export async function creerUtilisateur(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("NOT_FOUND");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "member") === "admin" ? "admin" : "member";
  if (!email || password.length < 10) throw new Error("PARAMETRES_INVALIDES");

  const { hashPassword } = await import("./auth");
  await prismaApp.user.create({
    data: { email, name, role, passwordHash: await hashPassword(password) },
  });
}

/** Réservé aux administrateurs : impose un nouveau mot de passe à un membre du staff. */
export async function reinitialiserMotDePasse(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("NOT_FOUND");

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId || password.length < 10) throw new Error("Le mot de passe doit faire au moins 10 caractères.");

  const { hashPassword } = await import("./auth");
  await prismaApp.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
}

/** Réservé aux administrateurs : active ou désactive un compte du staff. */
export async function basculerActivationUtilisateur(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("NOT_FOUND");

  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("PARAMETRES_INVALIDES");
  if (userId === session.userId) throw new Error("Vous ne pouvez pas désactiver votre propre compte.");

  const user = await prismaApp.user.findUnique({ where: { id: userId }, select: { deactivatedAt: true } });
  if (!user) throw new Error("Utilisateur introuvable.");

  await prismaApp.user.update({
    where: { id: userId },
    data: { deactivatedAt: user.deactivatedAt ? null : new Date() },
  });
}
