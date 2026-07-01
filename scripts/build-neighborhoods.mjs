/**
 * build-neighborhoods.mjs — ingest real US data into the MyMik neighborhood
 * schema so the matching engine can cover real cities. All sources are FREE.
 *
 * DATA SOURCES (per ZIP/ZCTA):
 *   - OpenStreetMap via the Overpass API → real POI counts within ~1 mile:
 *       • Amenities  = shops + restaurants/cafes/groceries/pharmacies/banks
 *       • Nightlife  = bars + pubs + nightclubs
 *       • Outdoors   = parks + gardens + nature reserves + natural features
 *       • Walkability = total POI density (proxy; EPA index is the gold standard)
 *   - US Census ACS 5-year → Schools proxy (share of adults with a bachelor's+).
 *   - OpenStreetMap place nodes (via Overpass) → nearest neighbourhood/quarter/
 *       suburb node names each ZIP (e.g. "Pearl District"); falls back to
 *       "ZIP <code>". (Nominatim blocks CI/cloud IPs, so Overpass it is.)
 *   Each metric is normalized to 0-100 WITHIN its metro so cities are comparable,
 *   then written to data/neighborhoods.generated.json in the exact shape of
 *   lib/neighborhoods.ts `Neighborhood[]`.
 *
 * STILL TODO for full production quality (documented, not hidden):
 *   - Walkability → EPA National Walkability Index (per block group).
 *   - Schools     → GreatSchools API (paid) or NCES test scores (finer than education).
 *
 * USAGE:
 *   1. Free Census key: https://api.census.gov/data/key_signup.html → export CENSUS_API_KEY=xxxx
 *   2. Download + unzip the ZCTA gazetteer (it's a .zip) to data/gaz_zcta.txt:
 *      https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2022_Gazetteer/2022_Gaz_zcta_national.zip
 *   3. Edit scripts/metros.json with the metros + ZIPs you want
 *   4. node scripts/build-neighborhoods.mjs
 *   5. Merge data/neighborhoods.generated.json into lib/neighborhoods.ts
 *      (see README → "Scaling to real US cities").
 *
 * Requires Node 18+ (global fetch) and network access. Overpass is rate-limited,
 * so this is paced (~1.2s/POI query) and best run for a handful of metros at a time.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dedupeName } from "./lib/place-name.mjs";
import { pickNearestPlaceName } from "./lib/zip-lookup.mjs";

const YEAR = 2022;
const KEY = process.env.CENSUS_API_KEY;
if (!KEY) {
  console.error("Set CENSUS_API_KEY (free: https://api.census.gov/data/key_signup.html)");
  process.exit(1);
}

// Overpass mirrors — rotate across them when one rejects (406/429/5xx) so a
// single overloaded endpoint doesn't drop half the ZIPs.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const RADIUS_M = 1609; // ~1 mile around each ZCTA centroid
const UA = "MyMik-POC/1.0 (neighborhood ingestion; contact: you@example.com)";
// The Census ZCTA gazetteer ships as a .zip — download + unzip it to this path.
const ZCTA_GAZ = process.env.ZCTA_GAZ || "data/gaz_zcta.txt";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Census: ZCTA centroids (for map coordinates) --------------------------
function readCentroids() {
  if (!existsSync(ZCTA_GAZ)) {
    console.error(
      `ZCTA gazetteer not found at ${ZCTA_GAZ}. Download + unzip it first:\n` +
        `  https://www2.census.gov/geo/docs/maps-data/data/gazetteer/${YEAR}_Gazetteer/${YEAR}_Gaz_zcta_national.zip\n` +
        `  then move the .txt to ${ZCTA_GAZ} (or set ZCTA_GAZ=/path/to/file).`
    );
    process.exit(1);
  }
  const rows = readFileSync(ZCTA_GAZ, "utf8").trim().split("\n");
  const head = rows[0].split("\t").map((h) => h.trim());
  const gi = head.indexOf("GEOID");
  const la = head.indexOf("INTPTLAT");
  const lo = head.indexOf("INTPTLONG");
  const map = new Map();
  for (const row of rows.slice(1)) {
    const c = row.split("\t");
    map.set(c[gi].trim(), { lat: Number(c[la]), lng: Number(c[lo]) });
  }
  return map;
}

// --- Census: education (schools proxy) -------------------------------------
async function fetchEducation(zips) {
  const get = ["NAME", "B15003_022E", "B15003_001E"].join(",");
  const url = `https://api.census.gov/data/${YEAR}/acs/acs5?get=${get}&for=zip%20code%20tabulation%20area:${zips.join(",")}&key=${KEY}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`ACS ${res.status}: ${await res.text()}`);
  const [h, ...data] = await res.json();
  const zi = h.indexOf("zip code tabulation area");
  const bi = h.indexOf("B15003_022E");
  const di = h.indexOf("B15003_001E");
  const out = new Map();
  for (const row of data) {
    const bach = Number(row[bi]);
    const denom = Number(row[di]);
    out.set(row[zi], denom > 0 ? (100 * bach) / denom : null);
  }
  return out;
}

// --- Overpass plumbing -------------------------------------------------------
// Rotate across mirrors, retrying with backoff. `validate(json)` must return
// the parsed value or null; null means "this mirror gave a bad/partial answer,
// try the next one". CRITICAL: when Overpass hits its server-side [timeout:..]
// it returns HTTP 200 with a `remark` and ZERO counts — trusting res.ok alone
// once committed a metro of silent flat-50 garbage. Callers must validate.
async function overpassQuery(q, validate) {
  const MAX_ROUNDS = 3;
  const REQ_TIMEOUT_MS = 70_000; // server-side [timeout:60] + slack
  for (let round = 0; round < MAX_ROUNDS; round++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      let res;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);
      try {
        res = await fetch(endpoint, {
          method: "POST",
          // Documented Overpass interface: form-encoded `data=` body. Some
          // mirrors return 406 for a raw text/plain body.
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": UA,
          },
          body: "data=" + encodeURIComponent(q),
          signal: ctrl.signal,
        });
      } catch {
        continue; // network error / timeout — try the next mirror
      } finally {
        clearTimeout(t);
      }
      if (!res.ok) continue; // 406/429/5xx: busy or picky mirror
      let json;
      try {
        json = await res.json();
      } catch {
        continue;
      }
      // A `remark` means the query timed out or errored server-side — the
      // payload may parse fine but the numbers in it are garbage.
      if (json?.remark) continue;
      const value = validate(json);
      if (value !== null) return value;
    }
    // Backoff before re-trying the rotation, but not after the final round.
    if (round < MAX_ROUNDS - 1) await sleep(2500 * (round + 1));
  }
  throw new Error("Overpass unavailable on all mirrors after retries");
}

// --- OpenStreetMap: POI counts within RADIUS_M of a point ------------------
async function fetchOsmCounts(lat, lng) {
  const q = `[out:json][timeout:60];
(nwr(around:${RADIUS_M},${lat},${lng})[shop];nwr(around:${RADIUS_M},${lat},${lng})[amenity~"^(restaurant|cafe|fast_food|marketplace|pharmacy|bank|food_court)$"];)->.amen;
(nwr(around:${RADIUS_M},${lat},${lng})[amenity~"^(bar|pub|nightclub|biergarten)$"];nwr(around:${RADIUS_M},${lat},${lng})[leisure=nightclub];)->.night;
(nwr(around:${RADIUS_M},${lat},${lng})[leisure~"^(park|garden|nature_reserve|dog_park)$"];nwr(around:${RADIUS_M},${lat},${lng})[natural~"^(wood|water|beach|scrub)$"];)->.outd;
.amen out count;
.night out count;
.outd out count;`;
  return overpassQuery(q, (json) => {
    const counts = (json?.elements ?? [])
      .filter((e) => e.type === "count")
      .map((e) => Number(e?.tags?.total));
    // All three counts must be present and numeric, else the answer is partial.
    if (counts.length !== 3 || counts.some((n) => !Number.isFinite(n))) return null;
    const [amenities, nightlife, outdoors] = counts;
    return { amenities, nightlife, outdoors, total: amenities + nightlife + outdoors };
  });
}

// --- OpenStreetMap: neighborhood name from nearby `place` nodes -------------
// Nominatim blocks CI/cloud IPs, so names come from Overpass instead: fetch
// place=neighbourhood|quarter|suburb nodes near the centroid and let the pure
// picker choose. Returns null on any failure (caller falls back to "ZIP <code>").
async function fetchPlaceName(lat, lng, exclude) {
  const q = `[out:json][timeout:30];
node(around:3000,${lat},${lng})[place~"^(neighbourhood|quarter|suburb)$"][name];
out body 40;`;
  try {
    const elements = await overpassQuery(q, (json) =>
      Array.isArray(json?.elements) ? json.elements : null
    );
    return pickNearestPlaceName(elements, { lat, lng }, { exclude });
  } catch {
    return null;
  }
}

// Min-max normalize a metric across the metro to 0-100 (null-safe).
function normalizer(values) {
  const nums = values.filter((v) => v != null);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return (v) =>
    v == null || max === min ? 50 : Math.round((100 * (v - min)) / (max - min));
}

function toFactors(n, norm) {
  return {
    Walkability: norm.total(n.total), // POI density proxy (TODO: EPA index)
    Amenities: norm.amenities(n.amenities),
    Schools: norm.edu(n.eduPct), // education proxy (TODO: school ratings)
    Nightlife: norm.nightlife(n.nightlife),
    Outdoors: norm.outdoors(n.outdoors),
  };
}

async function main() {
  const centroids = readCentroids();
  console.log(`Loaded ${centroids.size} ZCTA centroids from ${ZCTA_GAZ}`);
  const metros = JSON.parse(readFileSync("scripts/metros.json", "utf8"));

  const out = [];
  for (const metro of metros) {
    console.log(`\n${metro.city} — education (ACS)…`);
    const edu = await fetchEducation(metro.zips);
    // The metro's own city name, so we don't label a ZIP "Portland" in Portland.
    const cityOnly = metro.city.split(",")[0].trim();

    const raw = [];
    for (const zip of metro.zips) {
      const c = centroids.get(zip);
      if (!c) {
        console.warn(`  ZIP ${zip}: no centroid, skipping`);
        continue;
      }
      process.stdout.write(`  ZIP ${zip}: OSM POIs… `);
      try {
        const osm = await fetchOsmCounts(c.lat, c.lng);
        process.stdout.write(`amen ${osm.amenities}, night ${osm.nightlife}, out ${osm.outdoors}`);
        // Reverse-geocode the centroid to a real neighborhood name.
        const name = await fetchPlaceName(c.lat, c.lng, [cityOnly]);
        console.log(name ? ` → ${name}` : ` → (no name)`);
        raw.push({ zip, coords: c, eduPct: edu.get(zip) ?? null, name, ...osm });
      } catch (err) {
        console.log(`failed (${err.message})`);
      }
      await sleep(1200); // be polite to the Overpass mirrors
    }

    const norm = {
      total: normalizer(raw.map((r) => r.total)),
      amenities: normalizer(raw.map((r) => r.amenities)),
      nightlife: normalizer(raw.map((r) => r.nightlife)),
      outdoors: normalizer(raw.map((r) => r.outdoors)),
      edu: normalizer(raw.map((r) => r.eduPct)),
    };
    const used = new Set(); // keep neighborhood labels unique within the metro
    for (const r of raw) {
      const label = r.name
        ? dedupeName(r.name, r.zip, used)
        : `ZIP ${r.zip}`; // fallback when reverse-geocode found nothing
      out.push({
        id: `zcta-${r.zip}`, // stable id (ZIP) even though the display name is now real
        city: metro.city,
        name: label,
        coords: r.coords,
        attrs: toFactors(r, norm),
      });
    }
  }

  mkdirSync("data", { recursive: true });
  writeFileSync("data/neighborhoods.generated.json", JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.length} neighborhoods → data/neighborhoods.generated.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
