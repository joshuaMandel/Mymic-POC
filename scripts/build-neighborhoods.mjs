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
 *   Each metric is normalized to 0-100 WITHIN its metro so cities are comparable,
 *   then written to data/neighborhoods.generated.json in the exact shape of
 *   lib/neighborhoods.ts `Neighborhood[]`.
 *
 * STILL TODO for full production quality (documented, not hidden):
 *   - Walkability → EPA National Walkability Index (per block group).
 *   - Schools     → GreatSchools API (paid) or NCES test scores (finer than education).
 *   - Names       → neighborhood-name gazetteer (OSM / Who's On First); we label
 *                   by "ZIP <code>" until that layer is added.
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

// --- OpenStreetMap: POI counts within RADIUS_M of a point ------------------
async function fetchOsmCounts(lat, lng, attempt = 0) {
  const q = `[out:json][timeout:90];
(nwr(around:${RADIUS_M},${lat},${lng})[shop];nwr(around:${RADIUS_M},${lat},${lng})[amenity~"^(restaurant|cafe|fast_food|marketplace|pharmacy|bank|food_court)$"];)->.amen;
(nwr(around:${RADIUS_M},${lat},${lng})[amenity~"^(bar|pub|nightclub|biergarten)$"];nwr(around:${RADIUS_M},${lat},${lng})[leisure=nightclub];)->.night;
(nwr(around:${RADIUS_M},${lat},${lng})[leisure~"^(park|garden|nature_reserve|dog_park)$"];nwr(around:${RADIUS_M},${lat},${lng})[natural~"^(wood|water|beach|scrub)$"];)->.outd;
.amen out count;
.night out count;
.outd out count;`;
  // Try each mirror in turn; retry the whole rotation a few times with backoff.
  const MAX_ROUNDS = 4;
  for (let round = attempt; round < MAX_ROUNDS; round++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      let res;
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
        });
      } catch {
        continue; // network error — try the next mirror
      }
      if (res.ok) {
        const counts = (await res.json()).elements
          .filter((e) => e.type === "count")
          .map((e) => Number(e.tags.total));
        const [amenities, nightlife, outdoors] = counts;
        return { amenities, nightlife, outdoors, total: amenities + nightlife + outdoors };
      }
      // 406/429/5xx/504: this mirror is busy or picky — fall through to the next.
    }
    await sleep(4000 * (round + 1)); // backoff before re-trying the rotation
  }
  throw new Error("Overpass unavailable on all mirrors after retries");
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
        console.log(`amen ${osm.amenities}, night ${osm.nightlife}, out ${osm.outdoors}`);
        raw.push({ zip, coords: c, eduPct: edu.get(zip) ?? null, ...osm });
      } catch (err) {
        console.log(`failed (${err.message})`);
      }
      await sleep(1200); // be polite to Overpass
    }

    const norm = {
      total: normalizer(raw.map((r) => r.total)),
      amenities: normalizer(raw.map((r) => r.amenities)),
      nightlife: normalizer(raw.map((r) => r.nightlife)),
      outdoors: normalizer(raw.map((r) => r.outdoors)),
      edu: normalizer(raw.map((r) => r.eduPct)),
    };
    for (const r of raw) {
      out.push({
        id: `zcta-${r.zip}`,
        city: metro.city,
        name: `ZIP ${r.zip}`, // TODO: neighborhood-name gazetteer
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
