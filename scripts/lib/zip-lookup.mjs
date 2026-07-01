/**
 * zip-lookup.mjs — pure helpers for resolving a user-typed 5-digit ZIP into
 * (a) a human "you're in <neighborhood>, <City, ST>" label and (b) an
 * engine-ready { city, neighborhood } pair for resolveMatches().
 *
 * No side effects, no network, no app imports — `neighborhoods` and
 * `knownCities` are always injected as parameters so every decision here is
 * unit-testable offline (see scripts/test-zip-lookup.mjs). The only import is
 * the equally-pure place-name picker shared with the ingestion pipeline.
 */

import { pickPlaceName } from "./place-name.mjs";

// Re-exported so API routes get one import surface for ZIP resolution.
export { pickPlaceName };

export const ZIP_RE = /^\d{5}$/;

/** True when the trimmed input is exactly 5 digits. */
export function isZipLike(s) {
  return typeof s === "string" && ZIP_RE.test(s.trim());
}

/** Full state name (lowercase) → USPS abbreviation. Nominatim returns "Oregon";
 * the app speaks "Portland, OR". */
export const US_STATE_ABBR = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX",
  utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
  "district of columbia": "DC", "puerto rico": "PR",
};

/** "Oregon" → "OR" (case-insensitive); already-abbreviated "OR" passes through. */
export function stateAbbr(name) {
  if (typeof name !== "string") return null;
  const key = name.trim().toLowerCase();
  if (US_STATE_ABBR[key]) return US_STATE_ABBR[key];
  // Nominatim sometimes returns the abbreviation itself (e.g. from ISO codes).
  const upper = name.trim().toUpperCase();
  return Object.values(US_STATE_ABBR).includes(upper) ? upper : null;
}

/** "zcta-97209" → "97209"; seed ids like "stl-kirkwood" → null. */
export function zipFromId(id) {
  if (typeof id !== "string") return null;
  const m = id.match(/^zcta-(\d{5})$/);
  return m ? m[1] : null;
}

/** Exact ingested-record hit for a ZIP, or null. */
export function findNeighborhoodByZip(zip, neighborhoods) {
  if (!Array.isArray(neighborhoods)) return null;
  return neighborhoods.find((n) => zipFromId(n?.id) === zip) ?? null;
}

/** Great-circle distance in km between two {lat,lng} points. */
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Closest neighborhood record to a point, optionally restricted to one city.
 * @returns {{ neighborhood: object, distanceKm: number } | null}
 */
export function nearestNeighborhood(point, neighborhoods, city) {
  if (!point || !Array.isArray(neighborhoods)) return null;
  let best = null;
  for (const n of neighborhoods) {
    if (!n?.coords) continue;
    if (city && n.city !== city) continue;
    const d = haversineKm(point, n.coords);
    if (!best || d < best.distanceKm) best = { neighborhood: n, distanceKm: d };
  }
  return best;
}

/**
 * Pick the best neighborhood name from Overpass `place` nodes near a point
 * (the CI-safe alternative to Nominatim, which blocks cloud/CI IPs). More
 * specific place types win unless a broader one is much closer: we score by
 * distance + 0.25km penalty per priority step, so a `neighbourhood` beats a
 * `suburb` that is up to 500m nearer.
 *
 * @param {unknown} elements - `elements` array from an Overpass response for
 *   nodes tagged place=neighbourhood|quarter|suburb with a name.
 * @param {{lat:number,lng:number}} point - the ZIP/ZCTA centroid.
 * @param {{ exclude?: string[] }} [opts] - names to reject (the metro city).
 * @returns {string|null}
 */
export function pickNearestPlaceName(elements, point, opts = {}) {
  if (!Array.isArray(elements) || !point) return null;
  const PLACE_PRIORITY = { neighbourhood: 0, quarter: 1, suburb: 2 };
  const exclude = new Set((opts.exclude ?? []).map((s) => s.trim().toLowerCase()));
  let best = null;
  for (const el of elements) {
    const name = el?.tags?.name;
    const place = el?.tags?.place;
    const lat = Number(el?.lat);
    const lng = Number(el?.lon);
    if (typeof name !== "string" || !name.trim()) continue;
    if (!(place in PLACE_PRIORITY)) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (exclude.has(name.trim().toLowerCase())) continue;
    const score = haversineKm(point, { lat, lng }) + PLACE_PRIORITY[place] * 0.25;
    if (!best || score < best.score) best = { name: name.trim(), score };
  }
  return best ? best.name : null;
}

/**
 * Nearest city/town label from Overpass `place` nodes — the fallback city name
 * when no geocoder address is available. Towns/villages get a small distance
 * penalty so a proper city wins unless the town is meaningfully closer.
 * @returns {string|null}
 */
export function pickNearestCityName(elements, point) {
  if (!Array.isArray(elements) || !point) return null;
  const PENALTY_KM = { city: 0, town: 2, village: 4 };
  let best = null;
  for (const el of elements) {
    const name = el?.tags?.name;
    const place = el?.tags?.place;
    const lat = Number(el?.lat);
    const lng = Number(el?.lon);
    if (typeof name !== "string" || !name.trim()) continue;
    if (!(place in PENALTY_KM)) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const score = haversineKm(point, { lat, lng }) + PENALTY_KM[place];
    if (!best || score < best.score) best = { name: name.trim(), score };
  }
  return best ? best.name : null;
}

/** Nominatim address object → "City, ST" in the app's format, or null. */
export function cityLabelFromAddress(address) {
  if (!address || typeof address !== "object") return null;
  const city =
    address.city ?? address.town ?? address.village ?? address.municipality;
  const st = stateAbbr(address.state);
  if (typeof city !== "string" || !city.trim() || !st) return null;
  return `${city.trim()}, ${st}`;
}

/**
 * When the resolved city isn't a dataset city, still rescue nearby suburbs:
 * a ZIP within this many km of a known neighborhood gets matched to it
 * (e.g. 63122 → "Kirkwood, MO" municipality → our St. Louis "Kirkwood").
 */
export const MAX_MATCH_KM = 30;

/**
 * Engine-ready { city, neighborhood } for a point: nearest record within the
 * resolved city if it's live, else the global-nearest within MAX_MATCH_KM.
 * @returns {{city: string, neighborhood: string} | null}
 */
export function matchableNear(point, cityLabel, neighborhoods, knownCities) {
  if (cityLabel && knownCities?.has?.(cityLabel)) {
    const near = nearestNeighborhood(point, neighborhoods, cityLabel);
    if (near) return { city: near.neighborhood.city, neighborhood: near.neighborhood.name };
  }
  const near = nearestNeighborhood(point, neighborhoods);
  if (near && near.distanceKm <= MAX_MATCH_KM) {
    return { city: near.neighborhood.city, neighborhood: near.neighborhood.name };
  }
  return null;
}

/**
 * Data path: resolve a ZIP entirely from ingested records (id "zcta-<zip>").
 * @returns {object|null} ZipDetection (see zip-lookup.d.mts) or null.
 */
export function resolveZipLocally(zip, neighborhoods) {
  const rec = findNeighborhoodByZip(zip, neighborhoods);
  if (!rec) return null;
  return {
    zip,
    detected: { name: rec.name, city: rec.city },
    matchable: { city: rec.city, neighborhood: rec.name },
    source: "data",
  };
}

/**
 * Live path: shape Nominatim search (+ optional reverse) JSON into a
 * ZipDetection. All decisions live here so they're offline-testable; the API
 * route only fetches. Null-safe: returns null instead of throwing on any
 * malformed input.
 *
 * @param {string} zip
 * @param {unknown} searchJson  - Nominatim /search response (array)
 * @param {unknown} reverseJson - Nominatim /reverse response (object) or null
 * @param {object[]} neighborhoods - full dataset records
 * @param {Set<string>} knownCities - cities with live data ("City, ST")
 */
export function shapeNominatimResult(zip, searchJson, reverseJson, neighborhoods, knownCities) {
  const hit = Array.isArray(searchJson) ? searchJson[0] : null;
  if (!hit || typeof hit !== "object") return null;
  const point = { lat: Number(hit.lat), lng: Number(hit.lon) };
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;

  // Prefer the finer-grained reverse-geocode address; fall back to the search hit's.
  const reverseAddr =
    reverseJson && typeof reverseJson === "object" ? reverseJson.address : null;
  const searchAddr =
    hit.address && typeof hit.address === "object" ? hit.address : null;
  const cityLabel =
    cityLabelFromAddress(reverseAddr) ?? cityLabelFromAddress(searchAddr);
  const cityPart = cityLabel ? cityLabel.split(",")[0].trim() : null;
  const exclude = cityPart ? [cityPart] : [];
  const name =
    pickPlaceName(reverseAddr, { exclude }) ??
    pickPlaceName(searchAddr, { exclude }) ??
    cityPart ??
    `ZIP ${zip}`;

  const matchable = matchableNear(point, cityLabel, neighborhoods, knownCities);

  return {
    zip,
    detected: { name, city: cityLabel ?? matchable?.city ?? `ZIP ${zip}` },
    matchable,
    source: "nominatim",
  };
}

/**
 * Resolve a ZIP from a LOCAL centroid (data/zip-centroids.generated.json) —
 * the resilient path: matching needs no external service at all, and the
 * optional Nominatim address / Overpass place nodes only improve the label.
 *
 * @param {string} zip
 * @param {{lat:number,lng:number}} point - the ZIP's gazetteer centroid
 * @param {unknown} address - Nominatim reverse `address` object, or null
 * @param {unknown} placeElements - Overpass place-node elements, or null
 * @param {object[]} neighborhoods
 * @param {Set<string>} knownCities
 */
export function shapeCentroidResult(zip, point, address, placeElements, neighborhoods, knownCities) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;
  const cityLabel = cityLabelFromAddress(address);
  const cityPart = cityLabel ? cityLabel.split(",")[0].trim() : null;
  const exclude = cityPart ? [cityPart] : [];
  const matchable = matchableNear(point, cityLabel, neighborhoods, knownCities);
  const name =
    pickPlaceName(address && typeof address === "object" ? address : null, { exclude }) ??
    pickNearestPlaceName(placeElements, point, { exclude }) ??
    matchable?.neighborhood ??
    `ZIP ${zip}`;
  const city =
    cityLabel ??
    matchable?.city ??
    pickNearestCityName(placeElements, point) ??
    `ZIP ${zip}`;
  return { zip, detected: { name, city }, matchable, source: "centroid" };
}
