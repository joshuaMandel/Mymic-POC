/**
 * build-neighborhoods.mjs — ingest real US Census (ACS) data into the MyMik
 * neighborhood schema, so the matching engine can cover real cities.
 *
 * WHAT THIS DOES (MVP / free data only):
 *   - Reads scripts/metros.json: [{ "city": "St. Louis, MO", "zips": [...] }]
 *   - For each ZIP (ZCTA), fetches ACS 5-year attributes from the Census API
 *   - Fetches ZCTA centroids from the Census gazetteer (for map coordinates)
 *   - Normalizes each metric to 0-100 WITHIN its metro (so "walkable for Denver"
 *     is comparable to "walkable for Chicago")
 *   - Maps them onto MyMik's 5 factors and writes data/neighborhoods.generated.json
 *     in the exact shape of lib/neighborhoods.ts `Neighborhood[]`.
 *
 * HONEST LIMITS (documented on purpose):
 *   - ACS gives demographics/cost/education directly. It does NOT give
 *     walkability, amenities, nightlife, or outdoors. Those are approximated
 *     here from density/income/age as a *starter*. For production quality, layer:
 *       • Walkability  → EPA National Walkability Index (per block group, free)
 *       • Amenities/Nightlife/Outdoors → OpenStreetMap POI counts (free) or
 *         Yelp/Foursquare/Google Places (paid)
 *       • Schools      → GreatSchools API (paid) or NCES test data (free)
 *     Each is marked TODO in `toFactors()` below — that function is the one
 *     place to plug richer sources in.
 *   - Unit = ZCTA (ZIP). Neighborhood *names* need a gazetteer (OpenStreetMap /
 *     Who's On First); here we label by "ZIP <code>" until that layer is added.
 *
 * USAGE:
 *   1. Get a free key: https://api.census.gov/data/key_signup.html
 *   2. export CENSUS_API_KEY=xxxx: ; edit scripts/metros.json with your ZIPs
 *   3. node scripts/build-neighborhoods.mjs
 *   4. To use the output, merge data/neighborhoods.generated.json into
 *      lib/neighborhoods.ts (see README → "Scaling to real US cities").
 *
 * Requires Node 18+ (global fetch) and network access.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const YEAR = 2022;
const KEY = process.env.CENSUS_API_KEY;
if (!KEY) {
  console.error("Set CENSUS_API_KEY (free: https://api.census.gov/data/key_signup.html)");
  process.exit(1);
}

// ACS 5-year variables we pull per ZCTA.
const VARS = {
  income: "B19013_001E", // median household income
  rent: "B25064_001E", // median gross rent
  age: "B01002_001E", // median age
  pop: "B01003_001E", // total population
  bachelors: "B15003_022E", // bachelor's degree count
  eduDenom: "B15003_001E", // education universe (25+)
};

const GAZETTEER =
  `https://www2.census.gov/geo/docs/maps-data/data/gazetteer/${YEAR}_Gazetteer/${YEAR}_Gaz_zcta_national.txt`;

async function fetchCentroids() {
  // ZCTA gazetteer is a tab-separated file: GEOID ... INTPTLAT INTPTLONG
  const res = await fetch(GAZETTEER);
  if (!res.ok) throw new Error(`gazetteer ${res.status}`);
  const text = await res.text();
  const rows = text.trim().split("\n");
  const header = rows[0].split("\t").map((h) => h.trim());
  const gi = header.indexOf("GEOID");
  const la = header.indexOf("INTPTLAT");
  const lo = header.indexOf("INTPTLONG");
  const map = new Map();
  for (const row of rows.slice(1)) {
    const c = row.split("\t");
    map.set(c[gi].trim(), {
      lat: Number(c[la]),
      lng: Number(c[lo]),
    });
  }
  return map;
}

async function fetchAcsForZips(zips) {
  const get = ["NAME", ...Object.values(VARS)].join(",");
  const list = zips.join(",");
  const url = `https://api.census.gov/data/${YEAR}/acs/acs5?get=${get}&for=zip%20code%20tabulation%20area:${list}&key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ACS ${res.status}: ${await res.text()}`);
  const [head, ...data] = await res.json();
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  return data.map((row) => {
    const num = (v) => {
      const n = Number(row[idx[VARS[v]]]);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const bachelors = num("bachelors");
    const eduDenom = num("eduDenom");
    return {
      zip: row[idx["zip code tabulation area"]],
      income: num("income"),
      rent: num("rent"),
      age: num("age"),
      pop: num("pop"),
      eduPct: bachelors && eduDenom ? (100 * bachelors) / eduDenom : null,
    };
  });
}

// Min-max normalize a metric across the metro to 0-100 (null-safe).
function normalizer(values) {
  const nums = values.filter((v) => v != null);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return (v) => (v == null || max === min ? 50 : Math.round((100 * (v - min)) / (max - min)));
}

// Map normalized Census signals onto MyMik's 5 factors.
// NOTE: walkability/amenities/nightlife/outdoors are APPROXIMATE here — this is
// the single place to plug in EPA walkability, OSM POIs, and school ratings.
function toFactors(n, norm) {
  const income = norm.income(n.income);
  const rent = norm.rent(n.rent);
  const age = norm.age(n.age);
  const pop = norm.pop(n.pop);
  const edu = norm.edu(n.eduPct);
  const youth = 100 - age; // younger areas → more nightlife (rough)
  return {
    Walkability: pop, // TODO: replace with EPA National Walkability Index
    Amenities: Math.round((income + rent) / 2), // TODO: OSM POI density
    Schools: edu, // TODO: GreatSchools / NCES ratings
    Nightlife: Math.round((pop + youth) / 2), // TODO: OSM bar/venue counts
    Outdoors: 100 - pop, // TODO: OSM parks/trails; lower density ~ more green
  };
}

async function main() {
  const metros = JSON.parse(readFileSync("scripts/metros.json", "utf8"));
  console.log(`Fetching gazetteer centroids…`);
  const centroids = await fetchCentroids();

  const out = [];
  for (const metro of metros) {
    console.log(`ACS for ${metro.city} (${metro.zips.length} ZIPs)…`);
    const rows = await fetchAcsForZips(metro.zips);
    const norm = {
      income: normalizer(rows.map((r) => r.income)),
      rent: normalizer(rows.map((r) => r.rent)),
      age: normalizer(rows.map((r) => r.age)),
      pop: normalizer(rows.map((r) => r.pop)),
      edu: normalizer(rows.map((r) => r.eduPct)),
    };
    for (const r of rows) {
      const c = centroids.get(r.zip);
      if (!c) continue;
      out.push({
        id: `zcta-${r.zip}`,
        city: metro.city,
        name: `ZIP ${r.zip}`, // TODO: neighborhood name gazetteer (OSM / WOF)
        coords: c,
        attrs: toFactors(r, norm),
      });
    }
  }

  mkdirSync("data", { recursive: true });
  writeFileSync("data/neighborhoods.generated.json", JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.length} neighborhoods → data/neighborhoods.generated.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
