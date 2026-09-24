import type { Platform } from "./types";

/**
 * Libellés du sous-réseau d'une campagne (Campaign.network), par régie.
 *
 * Google : correspond au champ réel `campaign_advertising_channel_type` de
 * l'API Google Ads — une campagne Google a exactement un type, fixé à sa
 * création, donc cette valeur est une donnée stable, pas une estimation.
 *
 * Meta : n'a pas d'équivalent aussi stable. Le placement réel (Facebook vs
 * Instagram vs Audience Network) est une répartition par annonce/diffusion,
 * pas un attribut figé de campagne — Meta répartit lui-même le budget entre
 * surfaces selon les enchères. Les valeurs ci-dessous décrivent donc le mode
 * de diffusion déclaré à la création de la campagne (ex. Advantage+ Shopping
 * impose une diffusion automatique multi-surface), pas une mesure du budget
 * réellement dépensé sur chaque surface.
 */
export const RESEAU_GOOGLE: Record<string, string> = {
  search: "Search",
  display: "Display",
  video: "YouTube (Vidéo)",
  performance_max: "Performance Max",
  shopping: "Shopping",
  discovery: "Discovery",
};

export const RESEAU_META: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  audience_network: "Audience Network",
  cross_placement: "Facebook + Instagram (auto)",
};

const TABLES_PAR_PLATEFORME: Partial<Record<Platform, Record<string, string>>> = {
  google: RESEAU_GOOGLE,
  meta: RESEAU_META,
};

/** Retourne le libellé du sous-réseau, ou null si non classifié (ne jamais
 * inventer une valeur par défaut). */
export function libelleReseau(platform: Platform, network: string | null | undefined): string | null {
  if (!network) return null;
  return TABLES_PAR_PLATEFORME[platform]?.[network] ?? network;
}
