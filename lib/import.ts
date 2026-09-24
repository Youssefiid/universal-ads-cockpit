import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";
import ExcelJS from "exceljs";
import type { LigneBrute } from "./importFields";

export type { LigneBrute, ChampCible, Mapping } from "./importFields";
export { CHAMPS_CIBLES } from "./importFields";

export type FormatFichier = "csv" | "xlsx" | "xml";

export type FichierParse = {
  format: FormatFichier;
  headers: string[];
  rows: LigneBrute[];
};

export function detecterFormat(nomFichier: string): FormatFichier {
  const ext = nomFichier.toLowerCase().split(".").pop() ?? "";
  if (ext === "csv" || ext === "tsv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "xml") return "xml";
  throw new Error(`Format de fichier non pris en charge : ".${ext}". Formats acceptés : CSV, XLSX, XML.`);
}

function parserCsv(texte: string): FichierParse {
  const resultat = Papa.parse<LigneBrute>(texte, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const headers = resultat.meta.fields ?? [];
  if (headers.length === 0) {
    throw new Error("Aucune colonne détectée dans ce fichier CSV : vérifiez qu'il a bien une ligne d'en-têtes.");
  }
  return { format: "csv", headers, rows: resultat.data };
}

async function parserXlsx(buffer: Buffer): Promise<FichierParse> {
  const classeur = new ExcelJS.Workbook();
  // exceljs déclare son propre type `Buffer extends ArrayBuffer` (non
  // exporté) dans ses .d.ts, incompatible avec le vrai Buffer générique de
  // @types/node — un bug de typage connu du paquet, sans effet à l'exécution.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await classeur.xlsx.load(buffer as any);
  const feuille = classeur.worksheets[0];
  if (!feuille) throw new Error("Ce classeur Excel ne contient aucune feuille.");

  const ligneEnTetes = feuille.getRow(1);
  const headers: string[] = [];
  ligneEnTetes.eachCell({ includeEmpty: false }, (cell, col) => {
    headers[col - 1] = String(cell.value ?? "").trim();
  });
  if (headers.filter(Boolean).length === 0) {
    throw new Error("Aucune colonne détectée sur la première ligne de ce fichier Excel.");
  }

  const rows: LigneBrute[] = [];
  feuille.eachRow((row, numeroLigne) => {
    if (numeroLigne === 1) return;
    const ligne: LigneBrute = {};
    let vide = true;
    headers.forEach((h, i) => {
      if (!h) return;
      const cell = row.getCell(i + 1);
      const valeur = celluleEnTexte(cell.value);
      ligne[h] = valeur;
      if (valeur !== "") vide = false;
    });
    if (!vide) rows.push(ligne);
  });

  return { format: "xlsx", headers: headers.filter(Boolean), rows };
}

function celluleEnTexte(valeur: ExcelJS.CellValue): string {
  if (valeur === null || valeur === undefined) return "";
  if (valeur instanceof Date) return valeur.toISOString().slice(0, 10);
  if (typeof valeur === "object") {
    // Formule (result), texte enrichi, ou lien hypertexte : on prend la
    // valeur affichée, jamais la formule elle-même.
    if ("result" in valeur && valeur.result !== undefined) return String(valeur.result);
    if ("text" in valeur) return String((valeur as { text: unknown }).text);
    if ("richText" in valeur) return (valeur as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
    return "";
  }
  return String(valeur);
}

/**
 * Aucun format XML de reporting publicitaire n'est universel : on cherche le
 * premier tableau d'objets plats dans le document (les lignes répétées d'un
 * export), sans jamais deviner une structure qu'on ne trouve pas. Un XML
 * dont on ne peut pas identifier les lignes est refusé plutôt qu'interprété
 * au hasard.
 */
function parserXml(texte: string): FichierParse {
  const parseur = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });
  const document = parseur.parse(texte);

  const tableau = trouverPremierTableauDeLignes(document);
  if (!tableau) {
    throw new Error(
      "Impossible d'identifier des lignes répétées dans ce fichier XML (un tableau d'éléments similaires). Essayez plutôt un export CSV ou Excel.",
    );
  }

  const headers = new Set<string>();
  const rows: LigneBrute[] = tableau.map((element) => {
    const ligne: LigneBrute = {};
    for (const [cle, valeur] of Object.entries(element)) {
      if (valeur !== null && typeof valeur === "object" && !Array.isArray(valeur)) continue; // sous-structure, pas une valeur de ligne
      const texte = Array.isArray(valeur) ? valeur.map(String).join("; ") : String(valeur ?? "");
      ligne[cle] = texte;
      headers.add(cle);
    }
    return ligne;
  });

  return { format: "xml", headers: [...headers], rows };
}

function trouverPremierTableauDeLignes(noeud: unknown, profondeur = 0): Record<string, unknown>[] | null {
  if (profondeur > 8 || noeud === null || typeof noeud !== "object") return null;

  if (Array.isArray(noeud) && noeud.length >= 1 && noeud.every((e) => e !== null && typeof e === "object" && !Array.isArray(e))) {
    return noeud as Record<string, unknown>[];
  }

  for (const valeur of Object.values(noeud as Record<string, unknown>)) {
    const trouve = trouverPremierTableauDeLignes(valeur, profondeur + 1);
    if (trouve) return trouve;
  }
  return null;
}

export async function parserFichier(nomFichier: string, buffer: Buffer): Promise<FichierParse> {
  const format = detecterFormat(nomFichier);
  if (format === "csv") return parserCsv(buffer.toString("utf8"));
  if (format === "xlsx") return parserXlsx(buffer);
  return parserXml(buffer.toString("utf8"));
}

/**
 * Nombre au format FR ("1 234,56", "1.234,56") ou US ("1,234.56") : le
 * dernier séparateur rencontré est traité comme décimal, l'autre comme
 * groupement de milliers. Renvoie null plutôt que de deviner sur une chaîne
 * qui n'a pas la forme d'un nombre — jamais un 0 silencieux à la place d'une
 * valeur illisible.
 */
export function parserNombre(brut: string): number | null {
  let s = brut.trim().replace(/[€$£%\s ]/g, "");
  if (s === "") return null;
  s = s.replace(/^-?\((.+)\)$/, "-$1"); // (123) comptable -> -123

  const dernierePoint = s.lastIndexOf(".");
  const derniereVirgule = s.lastIndexOf(",");
  if (dernierePoint !== -1 && derniereVirgule !== -1) {
    if (derniereVirgule > dernierePoint) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (derniereVirgule !== -1) {
    const decimales = s.length - derniereVirgule - 1;
    s = decimales === 3 && s.indexOf(",") === derniereVirgule ? s.replace(",", "") : s.replace(",", ".");
  }

  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * ISO (YYYY-MM-DD) toujours accepté. DD/MM/YYYY ou MM/DD/YYYY seulement
 * quand un seul des deux ordres donne une date valide (jour ou mois > 12) —
 * sinon l'ambiguïté est réelle et la ligne est rejetée plutôt que de
 * deviner un mauvais jour.
 */
export function parserDate(brut: string): Date | null {
  const s = brut.trim();

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return dateValide(d, Number(iso[1]), Number(iso[2]), Number(iso[3])) ? d : null;
  }

  const sepMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (sepMatch) {
    const [, aStr, bStr, yStr] = sepMatch;
    const a = Number(aStr);
    const b = Number(bStr);
    const y = Number(yStr);
    const commeJourMoisAnnee = a <= 31 && b <= 12;
    const commeMoisJourAnnee = b <= 31 && a <= 12;
    if (commeJourMoisAnnee && !commeMoisJourAnnee) return construireDate(y, b, a);
    if (commeMoisJourAnnee && !commeJourMoisAnnee) return construireDate(y, a, b);
    return null; // ambigu (ex: 03/04/2026) : on ne devine pas
  }

  return null;
}

function construireDate(annee: number, mois: number, jour: number): Date | null {
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  return dateValide(d, annee, mois, jour) ? d : null;
}

function dateValide(d: Date, annee: number, mois: number, jour: number): boolean {
  return d.getUTCFullYear() === annee && d.getUTCMonth() === mois - 1 && d.getUTCDate() === jour;
}
