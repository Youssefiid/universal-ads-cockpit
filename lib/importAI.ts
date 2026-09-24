import { CHAMPS_CIBLES, type ChampCible, type LigneBrute, type Mapping } from "./importFields";

const MODELE = "claude-sonnet-5";

const CONSIGNE = `Tu associes les colonnes d'un fichier d'export publicitaire (CSV/Excel/XML) aux champs mesurés d'un cockpit ads.

Champs cibles possibles, un et un seul par colonne : ${CHAMPS_CIBLES.join(", ")}.
- "ignore" pour toute colonne qui n'est aucun de ces champs (ex: nom de compte, ID interne, notes).
- Ne propose jamais deux colonnes différentes pour le même champ cible, sauf "ignore" qui peut être répété.
- Réponds UNIQUEMENT avec un objet JSON {"NomDeColonne": "champ_cible", ...}, une entrée par colonne fournie, rien d'autre — pas de texte autour, pas de bloc markdown.`;

/**
 * Suggestion de mapping, jamais une décision : le résultat est toujours
 * revu et modifiable par l'utilisateur avant tout import réel (voir
 * app/api/import/analyze). Toute clé ou valeur que le modèle inventerait
 * hors de la liste réelle des colonnes ou des champs cibles est rejetée
 * ici, jamais transmise telle quelle.
 */
export async function suggererMapping(cle: string, headers: string[], echantillon: LigneBrute[]): Promise<Mapping> {
  const apercu = echantillon
    .slice(0, 5)
    .map((ligne) => headers.map((h) => `${h}=${ligne[h] ?? ""}`).join(" | "))
    .join("\n");

  const reponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cle,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELE,
      max_tokens: 1024,
      system: CONSIGNE,
      messages: [
        {
          role: "user",
          content: `Colonnes : ${headers.join(", ")}\n\nExemples de lignes :\n${apercu}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => "");
    throw new Error(`Le fournisseur IA a refusé la requête (${reponse.status}). ${detail.slice(0, 300)}`);
  }

  const data = (await reponse.json()) as { content?: { type: string; text?: string }[] };
  const texte = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  return validerMapping(texte, headers);
}

const ENSEMBLE_CHAMPS = new Set<string>(CHAMPS_CIBLES);

function validerMapping(texteBrut: string, headers: string[]): Mapping {
  const sansMarkdown = texteBrut.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  let brut: unknown;
  try {
    brut = JSON.parse(sansMarkdown);
  } catch {
    return {};
  }
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return {};

  const ensembleHeaders = new Set(headers);
  const dejaUtilises = new Set<ChampCible>();
  const mapping: Mapping = {};

  for (const [colonne, champ] of Object.entries(brut as Record<string, unknown>)) {
    if (!ensembleHeaders.has(colonne)) continue; // colonne inventée par le modèle : ignorée
    if (typeof champ !== "string" || !ENSEMBLE_CHAMPS.has(champ)) continue;
    const c = champ as ChampCible;
    if (c !== "ignore" && dejaUtilises.has(c)) continue; // doublon proposé par le modèle : on garde le premier
    if (c !== "ignore") dejaUtilises.add(c);
    mapping[colonne] = c;
  }

  return mapping;
}
