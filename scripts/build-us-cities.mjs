/**
 * build-us-cities.mjs — generate the full list of US cities/places for the
 * type-ahead, from the free US Census "Places" gazetteer.
 *
 * The gazetteer is distributed as a .zip; unzip it to a local .txt first (no zip
 * dependency needed here). Steps:
 *   1. Download:
 *      https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip
 *   2. Unzip → 2024_Gaz_place_national.txt, and place it at:
 *      data/gaz_place.txt        (or pass a path as the first CLI arg)
 *   3. node scripts/build-us-cities.mjs
 *      → writes data/us-cities.generated.json  (["City, ST", ...], ~19k entries)
 *   4. Merge into lib/us-cities.ts: replace the SEED array with the generated
 *      list (import the JSON or paste it), keeping the `cityNames` union.
 *
 * The gazetteer's NAME column looks like "Kirkwood city" / "Ballwin city" /
 * "Ann Arbor city"; we strip the trailing legal/statistical type word and pair
 * it with the USPS state abbreviation to get "Kirkwood, MO".
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const SRC = process.argv[2] || "data/gaz_place.txt";

if (!existsSync(SRC)) {
  console.error(
    `Gazetteer not found at ${SRC}.\n` +
      "Download + unzip the Census Places gazetteer first (see the header of this file):\n" +
      "  https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip"
  );
  process.exit(1);
}

// Trailing place-type words to strip from the gazetteer NAME.
const SUFFIXES =
  /\s+(city|town|village|borough|municipality|CDP|comunidad|zona urbana|urbana|township|plantation|gore|grant|location)$/i;

const rows = readFileSync(SRC, "utf8").trim().split("\n");
const header = rows[0].split("\t").map((h) => h.trim());
const usIdx = header.indexOf("USPS");
const nameIdx = header.indexOf("NAME");
if (usIdx < 0 || nameIdx < 0) {
  console.error("Unexpected gazetteer format — missing USPS or NAME columns.");
  process.exit(1);
}

const set = new Set();
for (const row of rows.slice(1)) {
  const cols = row.split("\t");
  const state = (cols[usIdx] || "").trim();
  let name = (cols[nameIdx] || "").trim().replace(SUFFIXES, "").trim();
  if (!name || !state) continue;
  set.add(`${name}, ${state}`);
}

const cities = Array.from(set).sort((a, b) => a.localeCompare(b));
mkdirSync("data", { recursive: true });
writeFileSync("data/us-cities.generated.json", JSON.stringify(cities, null, 2));
console.log(`Wrote ${cities.length} cities → data/us-cities.generated.json`);
