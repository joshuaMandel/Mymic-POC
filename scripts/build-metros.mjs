/**
 * build-metros.mjs — choose which metros + ZIPs to ingest, 100% from Census
 * data. No hand-picked cities or ZIP lists anywhere:
 *
 *   1. ACS 5-year: population of every US place → take the top N cities.
 *   2. Census 2020 ZCTA↔Place relationship file → the ZCTAs overlapping each.
 *   3. ACS 5-year: population of every ZCTA → keep each city's biggest ZCTAs.
 *   → writes data/metros.generated.json  [{ city: "Portland, OR", zips: [...] }]
 *
 * Inputs (env):
 *   CENSUS_API_KEY   required (free: https://api.census.gov/data/key_signup.html)
 *   TOP_CITIES       how many cities to select (default 40)
 *   ZIPS_PER_METRO   max ZCTAs per city (default 8)
 *
 * Local files (downloaded by the ingestion workflow):
 *   data/gaz_place.txt        Census Places gazetteer (GEOID → USPS state + name)
 *   data/rel_zcta_place.txt   2020 ZCTA↔Place relationship file
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { cleanPlaceName, pickTopZctas, parseZctaPlaceRel } from "./lib/metro-select.mjs";

const YEAR = 2022;
const KEY = process.env.CENSUS_API_KEY;
const TOP_CITIES = Number(process.env.TOP_CITIES || 40);
const ZIPS_PER_METRO = Number(process.env.ZIPS_PER_METRO || 8);
const GAZ = process.env.GAZ_PLACE || "data/gaz_place.txt";
const REL = process.env.REL_ZCTA_PLACE || "data/rel_zcta_place.txt";
const UA = "MyMik-POC/1.0 (metro selection; contact: you@example.com)";

if (!KEY) {
  console.error("Set CENSUS_API_KEY (free: https://api.census.gov/data/key_signup.html)");
  process.exit(1);
}
for (const f of [GAZ, REL]) {
  if (!existsSync(f)) {
    console.error(`Missing ${f} — the ingestion workflow downloads it (see ingest-data.yml).`);
    process.exit(1);
  }
}

async function acs(params) {
  const url = `https://api.census.gov/data/${YEAR}/acs/acs5?${params}&key=${KEY}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`ACS ${res.status}: ${await res.text()}`);
  return res.json();
}

// Gazetteer: place GEOID → "City, ST" (same cleaning as the type-ahead list).
function readPlaceNames() {
  const rows = readFileSync(GAZ, "utf8").trim().split("\n");
  const header = rows[0].split("\t").map((h) => h.trim());
  const gi = header.indexOf("GEOID");
  const ui = header.indexOf("USPS");
  const ni = header.indexOf("NAME");
  const map = new Map();
  for (const row of rows.slice(1)) {
    const c = row.split("\t");
    const name = cleanPlaceName(c[ni]);
    const state = (c[ui] || "").trim();
    if (name && state) map.set(c[gi].trim(), `${name}, ${state}`);
  }
  return map;
}

async function main() {
  const placeNames = readPlaceNames();
  console.log(`Gazetteer: ${placeNames.size} places`);

  // 1. Top N places by population (one national ACS call).
  console.log("ACS: place populations…");
  const [, ...placeRows] = await acs("get=B01003_001E&for=place:*&in=state:*");
  const ranked = placeRows
    .map((r) => ({ pop: Number(r[0]) || 0, geoid: `${r[1]}${r[2]}` }))
    .filter((p) => p.pop > 0 && placeNames.has(p.geoid))
    .sort((a, b) => b.pop - a.pop)
    .slice(0, TOP_CITIES);

  // 2. ZCTAs overlapping each place (local relationship file).
  const rel = parseZctaPlaceRel(readFileSync(REL, "utf8"));
  console.log(`Relationship file: ${rel.size} places with ZCTAs`);

  // 3. ZCTA populations (one national ACS call) to keep the biggest ZCTAs.
  console.log("ACS: ZCTA populations…");
  const [, ...zctaRows] = await acs("get=B01003_001E&for=zip%20code%20tabulation%20area:*");
  const popByZcta = new Map(zctaRows.map((r) => [r[1], Number(r[0]) || 0]));

  const metros = [];
  for (const p of ranked) {
    const city = placeNames.get(p.geoid);
    const zips = pickTopZctas(Array.from(rel.get(p.geoid) ?? []), popByZcta, ZIPS_PER_METRO);
    if (zips.length < 2) {
      console.warn(`  skipping ${city} — only ${zips.length} populated ZCTA(s) mapped`);
      continue;
    }
    metros.push({ city, zips });
  }

  mkdirSync("data", { recursive: true });
  writeFileSync("data/metros.generated.json", JSON.stringify(metros, null, 2));
  console.log(
    `Wrote ${metros.length} metros (${metros.reduce((s, m) => s + m.zips.length, 0)} ZIPs) → data/metros.generated.json`
  );
  console.log(metros.map((m) => `  ${m.city} (${m.zips.length})`).join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
