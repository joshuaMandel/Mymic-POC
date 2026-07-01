/**
 * build-zip-centroids.mjs — compact ZIP → [lat, lng] lookup for the whole US,
 * from the Census ZCTA gazetteer the ingestion workflow already downloads.
 *
 * This makes /api/zip-lookup resilient: with a local centroid for every ZIP,
 * the core matching (nearest known neighborhood) works with ZERO external
 * geocoder calls — Nominatim/Overpass only improve the display label.
 *
 *   node scripts/build-zip-centroids.mjs   → data/zip-centroids.generated.json
 *
 * Server-side only (~33k entries) — never shipped to the browser.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const SRC = process.env.ZCTA_GAZ || "data/gaz_zcta.txt";
if (!existsSync(SRC)) {
  console.error(`ZCTA gazetteer not found at ${SRC} — the ingestion workflow downloads it.`);
  process.exit(1);
}

const rows = readFileSync(SRC, "utf8").trim().split("\n");
const header = rows[0].split("\t").map((h) => h.trim());
const gi = header.indexOf("GEOID");
const la = header.indexOf("INTPTLAT");
const lo = header.indexOf("INTPTLONG");
if (gi < 0 || la < 0 || lo < 0) {
  console.error("Unexpected gazetteer format — missing GEOID/INTPTLAT/INTPTLONG.");
  process.exit(1);
}

const out = {};
for (const row of rows.slice(1)) {
  const c = row.split("\t");
  const zip = (c[gi] || "").trim();
  const lat = Number(c[la]);
  const lng = Number(c[lo]);
  if (!/^\d{5}$/.test(zip) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  // 4 decimals ≈ 11m precision — plenty for neighborhood-level lookups.
  out[zip] = [Number(lat.toFixed(4)), Number(lng.toFixed(4))];
}

mkdirSync("data", { recursive: true });
writeFileSync("data/zip-centroids.generated.json", JSON.stringify(out));
console.log(`Wrote ${Object.keys(out).length} ZIP centroids → data/zip-centroids.generated.json`);
