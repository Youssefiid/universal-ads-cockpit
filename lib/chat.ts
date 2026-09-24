/**
 * Le Copilot IA, cadré sur des chiffres déjà mesurés — porté d'ads-dashboard.
 *
 * Remplace un `if (texte.includes("roas"))` qui renvoyait des paragraphes
 * écrits en dur sous un badge « Zéro hallucination », sans jamais consulter
 * ni un modèle ni les données réelles. La règle reste la même : le modèle ne
 * reçoit que les métriques listées ci-dessous, et n'a le droit de citer aucun
 * autre chiffre.
 */

export type ContexteChat = {
  portee: string;
  devise: string;
  totaux: {
    spend: number;
    revenue: number;
    conversions: number;
    roas: number;
  } | null;
  comparaisonPossible: boolean;
};

const MODELE = "claude-sonnet-5";
const MAX_TOKENS = 1024;

export function contexteChiffre(c: ContexteChat): string {
  const lignes: string[] = [`Portée : ${c.portee}`, `Devise : ${c.devise}`];
  if (!c.totaux) {
    lignes.push("Données mesurées : AUCUNE. Aucune métrique n'est encore disponible sur ce périmètre.");
    return lignes.join("\n");
  }
  lignes.push("Métriques mesurées, et elles seules :");
  lignes.push(`- dépense = ${c.totaux.spend} ${c.devise}`);
  lignes.push(`- chiffre d'affaires tracké = ${c.totaux.revenue} ${c.devise}`);
  lignes.push(`- conversions = ${c.totaux.conversions}`);
  lignes.push(`- ROAS = ${c.totaux.roas}x`);
  if (!c.comparaisonPossible) {
    lignes.push(
      "Aucune période de comparaison fiable : ne cite ni évolution, ni hausse, ni baisse, ni tendance.",
    );
  }
  return lignes.join("\n");
}

const CONSIGNE = `Tu assistes un traffic manager d'une agence média française sur son Cockpit Ads.

Règles absolues :
- Tu ne cites que les chiffres présents dans le bloc « Métriques mesurées ». Aucun autre nombre, même arrondi, même donné comme ordre de grandeur.
- Si la question porte sur une donnée absente du bloc (une tendance, un détail par créa, un historique), tu réponds que l'outil ne la mesure pas encore, et tu t'arrêtes là.
- Tu ne compares à aucun benchmark que tu n'as pas reçu.
- Tu réponds en français, brièvement, sans formule de politesse.`;

export async function repondre(
  cle: string,
  contexte: ContexteChat,
  historique: { role: "user" | "assistant"; content: string }[],
): Promise<{ texte: string; entree: number | null; sortie: number | null }> {
  const reponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cle,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELE,
      max_tokens: MAX_TOKENS,
      system: `${CONSIGNE}\n\n=== CONTEXTE CHIFFRÉ ===\n${contexteChiffre(contexte)}`,
      messages: historique.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => "");
    throw new Error(`Le fournisseur a refusé la requête (${reponse.status}). ${detail.slice(0, 300)}`);
  }

  const data = (await reponse.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const texte = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  return {
    texte: texte || "(réponse vide)",
    entree: data.usage?.input_tokens ?? null,
    sortie: data.usage?.output_tokens ?? null,
  };
}
