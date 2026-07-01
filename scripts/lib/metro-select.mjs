/**
 * metro-select.mjs — pure helpers for choosing which metros + ZIPs to ingest,
 * entirely from Census APIs/files (no hand-picked lists). Unit-tested offline
 * in scripts/test-metro-select.mjs.
 */

// Trailing legal/statistical place-type words in Census gazetteer/ACS names.
const TYPE_SUFFIXES =
  /\s+(city|town|village|borough|municipality|CDP|comunidad|zona urbana|urbana|township|plantation|gore|grant|location)$/i;

// Consolidated city-county governments have unwieldy official names; normalize
// the famous ones to what a human types. This is name normalization, not data —
// the population/ZIP figures still come exclusively from the Census APIs.
const CONSOLIDATED = [
  [/^nashville-davidson\b.*/i, "Nashville"],
  [/^louisville\/jefferson county\b.*/i, "Louisville"],
  [/^lexington-fayette\b.*/i, "Lexington"],
  [/^urban honolulu\b.*/i, "Honolulu"],
  [/^augusta-richmond county\b.*/i, "Augusta"],
  [/^athens-clarke county\b.*/i, "Athens"],
  [/^macon-bibb county\b.*/i, "Macon"],
  [/^indianapolis\b.*/i, "Indianapolis"],
  [/^boise city$/i, "Boise"],
];

/**
 * Clean a Census place NAME ("Kirkwood city", "Nashville-Davidson metropolitan
 * government (balance)") to a display city name ("Kirkwood", "Nashville").
 */
export function cleanPlaceName(raw) {
  if (typeof raw !== "string") return null;
  let name = raw.trim();
  if (!name) return null;
  name = name.replace(/\s*\([^)]*\)\s*/g, " ").trim(); // drop "(balance)" etc.
  name = name
    .replace(/\s+(metropolitan government|metro government|unified government|consolidated government|urban county)\b/gi, "")
    .trim();
  name = name.replace(TYPE_SUFFIXES, "").trim();
  for (const [re, alias] of CONSOLIDATED) {
    if (re.test(name)) return alias;
  }
  return name || null;
}

/**
 * Rank a city's candidate ZCTAs by population and keep the biggest ones —
 * those are the neighborhoods people actually live in.
 * @param {string[]} zctas - ZCTAs overlapping the place (relationship file)
 * @param {Map<string, number>} popByZcta - ZCTA → population (ACS)
 * @param {number} max - keep at most this many
 * @returns {string[]}
 */
export function pickTopZctas(zctas, popByZcta, max) {
  if (!Array.isArray(zctas)) return [];
  return Array.from(new Set(zctas))
    .filter((z) => /^\d{5}$/.test(z) && (popByZcta.get(z) ?? 0) > 0)
    .sort((a, b) => (popByZcta.get(b) ?? 0) - (popByZcta.get(a) ?? 0))
    .slice(0, Math.max(0, max));
}

/**
 * Parse a Census ZCTA↔Place relationship file (pipe- or tab-delimited, with a
 * header row) into placeGeoid → Set(zcta). Column names per the 2020 rel files.
 * @returns {Map<string, Set<string>>}
 */
export function parseZctaPlaceRel(text) {
  const out = new Map();
  if (typeof text !== "string" || !text.trim()) return out;
  const rows = text.trim().split("\n");
  const delim = rows[0].includes("|") ? "|" : "\t";
  const header = rows[0].split(delim).map((h) => h.trim().toUpperCase());
  const zi = header.findIndex((h) => h.startsWith("GEOID_ZCTA5"));
  const pi = header.findIndex((h) => h.startsWith("GEOID_PLACE"));
  if (zi < 0 || pi < 0) return out;
  for (const row of rows.slice(1)) {
    const cols = row.split(delim);
    const zcta = (cols[zi] || "").trim();
    const place = (cols[pi] || "").trim();
    if (!/^\d{5}$/.test(zcta) || !place) continue;
    if (!out.has(place)) out.set(place, new Set());
    out.get(place).add(zcta);
  }
  return out;
}
