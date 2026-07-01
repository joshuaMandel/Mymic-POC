/**
 * place-name.mjs — pure helpers for turning an OpenStreetMap/Nominatim reverse
 * geocode result into a human neighborhood name. No side effects, no network —
 * kept separate so it can be unit-tested without a Census key or internet
 * (see scripts/test-place-name.mjs).
 */

// Nominatim `address` keys, most-specific "neighborhood-like" first. We prefer a
// true neighbourhood/quarter, then fall back to broader districts. We deliberately
// stop before `city`/`town`/`municipality` — those name the whole metro, not a
// neighborhood within it.
export const NEIGHBORHOOD_KEYS = [
  "neighbourhood",
  "quarter",
  "suburb",
  "city_district",
  "borough",
  "residential",
  "allotments",
  "hamlet",
];

/**
 * Pick the best neighborhood name from a Nominatim address object.
 * @param {Record<string,string>|null|undefined} address - the `address` object
 *   from a Nominatim reverse-geocode response (addressdetails=1).
 * @param {{ exclude?: string[] }} [opts] - names to reject (e.g. the metro's own
 *   city, so we don't label a ZIP "Portland" inside "Portland, OR").
 * @returns {string|null} a trimmed name, or null if nothing usable was found.
 */
export function pickPlaceName(address, opts = {}) {
  if (!address || typeof address !== "object") return null;
  const exclude = new Set((opts.exclude ?? []).map((s) => s.trim().toLowerCase()));
  for (const key of NEIGHBORHOOD_KEYS) {
    const raw = address[key];
    if (typeof raw !== "string") continue;
    const name = raw.trim();
    if (!name) continue;
    if (exclude.has(name.toLowerCase())) continue;
    return name;
  }
  return null;
}

/**
 * Ensure a name is unique within a metro. If `name` was already used, suffix it
 * with the ZIP so the two entries stay distinguishable (adjacent ZIPs can share
 * the same OSM suburb). Mutates `used` to record the returned label.
 * @param {string} name
 * @param {string} zip
 * @param {Set<string>} used - names already taken in this metro
 * @returns {string}
 */
export function dedupeName(name, zip, used) {
  let label = name;
  if (used.has(label.toLowerCase())) label = `${name} (${zip})`;
  used.add(label.toLowerCase());
  return label;
}
