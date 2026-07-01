/**
 * test-zip-lookup.mjs — offline unit tests for the ZIP → neighborhood resolver.
 * Runs with NO network and NO Census key: `node scripts/test-zip-lookup.mjs`.
 *
 * Fixtures mirror real dataset records (both `zcta-` ingested ids and seed ids)
 * and real-shaped Nominatim search/reverse responses, so the full decision
 * ladder — data hit, live geocode, suburb rescue, preview fallback — is
 * verified without touching the internet.
 */
import {
  isZipLike,
  stateAbbr,
  zipFromId,
  findNeighborhoodByZip,
  haversineKm,
  nearestNeighborhood,
  pickNearestPlaceName,
  pickNearestCityName,
  cityLabelFromAddress,
  matchableNear,
  resolveZipLocally,
  shapeNominatimResult,
  shapeCentroidResult,
  MAX_MATCH_KM,
} from "./lib/zip-lookup.mjs";

let passed = 0;
let failed = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  console.log(`${ok ? "✓" : "✗"} ${label}: got ${a}`);
  if (ok) passed++;
  else {
    failed++;
    console.log(`    expected ${e}`);
  }
}
function approx(actual, expected, tol, label) {
  const ok = Math.abs(actual - expected) <= tol;
  console.log(`${ok ? "✓" : "✗"} ${label}: got ${actual}`);
  if (ok) passed++;
  else {
    failed++;
    console.log(`    expected ${expected} ± ${tol}`);
  }
}

// Fixture dataset: mixes ingested (zcta-) and seed-style records.
const FIXTURE = [
  { id: "zcta-97209", city: "Portland, OR", name: "Pearl District", coords: { lat: 45.5312, lng: -122.6819 }, attrs: {} },
  { id: "zcta-97202", city: "Portland, OR", name: "ZIP 97202", coords: { lat: 45.4826, lng: -122.6446 }, attrs: {} },
  { id: "stl-kirkwood", city: "St. Louis, MO", name: "Kirkwood", coords: { lat: 38.5834, lng: -90.4068 }, attrs: {} },
  { id: "stl-cwe", city: "St. Louis, MO", name: "Central West End", coords: { lat: 38.644, lng: -90.262 }, attrs: {} },
];
const KNOWN = new Set(["Portland, OR", "St. Louis, MO"]);

// --- isZipLike --------------------------------------------------------------
eq(isZipLike("97209"), true, "isZipLike: 5 digits");
eq(isZipLike(" 97209 "), true, "isZipLike: trims whitespace");
eq(isZipLike("9720"), false, "isZipLike: 4 digits");
eq(isZipLike("972091"), false, "isZipLike: 6 digits");
eq(isZipLike("97209-1234"), false, "isZipLike: ZIP+4 rejected");
eq(isZipLike("abc12"), false, "isZipLike: letters");
eq(isZipLike(null), false, "isZipLike: null never throws");

// --- stateAbbr ---------------------------------------------------------------
eq(stateAbbr("Oregon"), "OR", "stateAbbr: Oregon");
eq(stateAbbr("district of Columbia"), "DC", "stateAbbr: case-insensitive DC");
eq(stateAbbr("MO"), "MO", "stateAbbr: abbreviation passes through");
eq(stateAbbr("Ontario"), null, "stateAbbr: unknown → null");
eq(stateAbbr(undefined), null, "stateAbbr: undefined never throws");

// --- zipFromId / findNeighborhoodByZip ---------------------------------------
eq(zipFromId("zcta-97209"), "97209", "zipFromId: ingested id");
eq(zipFromId("stl-kirkwood"), null, "zipFromId: seed id → null");
eq(findNeighborhoodByZip("97209", FIXTURE)?.name, "Pearl District", "findByZip: hit");
eq(findNeighborhoodByZip("63122", FIXTURE), null, "findByZip: miss");

// --- haversineKm --------------------------------------------------------------
approx(haversineKm({ lat: 45.5, lng: -122.6 }, { lat: 45.5, lng: -122.6 }), 0, 0.001, "haversine: identical points");
approx(haversineKm({ lat: 38, lng: -90 }, { lat: 39, lng: -90 }), 111.2, 1, "haversine: 1° latitude ≈ 111km");

// --- nearestNeighborhood -------------------------------------------------------
// Point in downtown Portland: Pearl District is closer than 97202 (SE Portland).
eq(
  nearestNeighborhood({ lat: 45.526, lng: -122.677 }, FIXTURE, "Portland, OR")?.neighborhood.name,
  "Pearl District",
  "nearest (city-filtered): downtown PDX → Pearl District"
);
// Same point, but restricted to St. Louis → a St. Louis record despite being
// ~2700km away (Kirkwood sits further west, so it's the closer of the two).
eq(
  nearestNeighborhood({ lat: 45.526, lng: -122.677 }, FIXTURE, "St. Louis, MO")?.neighborhood.name,
  "Kirkwood",
  "nearest respects city filter"
);
eq(nearestNeighborhood(null, FIXTURE), null, "nearest: null point never throws");

// --- cityLabelFromAddress -------------------------------------------------------
eq(
  cityLabelFromAddress({ city: "Portland", state: "Oregon" }),
  "Portland, OR",
  "cityLabel: city + state"
);
eq(
  cityLabelFromAddress({ town: "Kirkwood", state: "Missouri" }),
  "Kirkwood, MO",
  "cityLabel: falls back to town"
);
eq(cityLabelFromAddress({ city: "Toronto", state: "Ontario" }), null, "cityLabel: non-US state → null");
eq(cityLabelFromAddress(null), null, "cityLabel: null never throws");

// --- resolveZipLocally (data path) ---------------------------------------------
eq(
  resolveZipLocally("97209", FIXTURE),
  {
    zip: "97209",
    detected: { name: "Pearl District", city: "Portland, OR" },
    matchable: { city: "Portland, OR", neighborhood: "Pearl District" },
    source: "data",
  },
  "resolveZipLocally: ingested hit returns full shape"
);
eq(resolveZipLocally("63122", FIXTURE), null, "resolveZipLocally: non-ingested ZIP → null");

// --- shapeNominatimResult (live path) --------------------------------------------
// (a) Happy path: search gives coords, reverse gives the fine-grained neighbourhood.
const SEARCH_PDX = [
  { lat: "45.5312", lon: "-122.6819", address: { postcode: "97209", city: "Portland", state: "Oregon" } },
];
const REVERSE_PDX = {
  address: { neighbourhood: "Pearl District", city: "Portland", state: "Oregon" },
};
eq(
  shapeNominatimResult("97209", SEARCH_PDX, REVERSE_PDX, FIXTURE, KNOWN),
  {
    zip: "97209",
    detected: { name: "Pearl District", city: "Portland, OR" },
    matchable: { city: "Portland, OR", neighborhood: "Pearl District" },
    source: "nominatim",
  },
  "shape: search+reverse happy path"
);

// (b) Reverse failed (null): falls back to the search hit's address; no
// neighbourhood there → detected.name falls back to the city part.
eq(
  shapeNominatimResult("97209", SEARCH_PDX, null, FIXTURE, KNOWN).detected.name,
  "Portland",
  "shape: reverse=null falls back to search address city part"
);

// (c) Kirkwood rescue: municipality "Kirkwood, MO" is NOT a dataset city, but the
// point is well within MAX_MATCH_KM of the St. Louis "Kirkwood" record.
const SEARCH_KIRKWOOD = [
  { lat: "38.5834", lon: "-90.4068", address: { town: "Kirkwood", state: "Missouri", postcode: "63122" } },
];
const REVERSE_KIRKWOOD = {
  address: { suburb: "Kirkwood", town: "Kirkwood", state: "Missouri" },
};
eq(
  shapeNominatimResult("63122", SEARCH_KIRKWOOD, REVERSE_KIRKWOOD, FIXTURE, KNOWN),
  {
    zip: "63122",
    detected: { name: "Kirkwood", city: "Kirkwood, MO" },
    matchable: { city: "St. Louis, MO", neighborhood: "Kirkwood" },
    source: "nominatim",
  },
  "shape: suburb rescue maps Kirkwood, MO → St. Louis dataset"
);

// (d) Rural point far (>MAX_MATCH_KM) from every record → preview (matchable null).
const SEARCH_RURAL = [
  { lat: "44.0", lon: "-103.5", address: { city: "Rapid City", state: "South Dakota" } },
];
const ruralShaped = shapeNominatimResult("57701", SEARCH_RURAL, null, FIXTURE, KNOWN);
eq(ruralShaped.matchable, null, "shape: far-away ZIP → matchable null (preview)");
eq(ruralShaped.detected.city, "Rapid City, SD", "shape: far-away ZIP still detects its city");

// (e) Garbage inputs never throw.
eq(shapeNominatimResult("97209", [], null, FIXTURE, KNOWN), null, "shape: empty search → null");
eq(shapeNominatimResult("97209", null, null, FIXTURE, KNOWN), null, "shape: null search → null");
eq(shapeNominatimResult("97209", "junk", null, FIXTURE, KNOWN), null, "shape: non-array search → null");
eq(
  shapeNominatimResult("97209", [{ lat: "not-a-number", lon: "nan" }], null, FIXTURE, KNOWN),
  null,
  "shape: NaN coords → null"
);

// --- pickNearestPlaceName (Overpass place nodes — the CI naming path) ----------
const CENTER = { lat: 45.5312, lng: -122.6819 };
const PLACES = [
  // ~0.4km away, most specific type
  { type: "node", lat: 45.5348, lon: -122.6819, tags: { place: "neighbourhood", name: "Pearl District" } },
  // ~0.2km away but broader type (suburb) — specificity penalty should let Pearl win
  { type: "node", lat: 45.5330, lon: -122.6819, tags: { place: "suburb", name: "Northwest District" } },
  // very close but the metro city itself — excluded
  { type: "node", lat: 45.5313, lon: -122.6819, tags: { place: "suburb", name: "Portland" } },
  // nameless / wrong type noise
  { type: "node", lat: 45.5312, lon: -122.6810, tags: { place: "neighbourhood" } },
  { type: "node", lat: 45.5312, lon: -122.6810, tags: { place: "city", name: "Portland" } },
];
eq(
  pickNearestPlaceName(PLACES, CENTER, { exclude: ["Portland"] }),
  "Pearl District",
  "placeName: neighbourhood beats slightly-closer suburb (specificity penalty)"
);
eq(
  pickNearestPlaceName(
    [
      { type: "node", lat: 45.54, lon: -122.68, tags: { place: "suburb", name: "Northwest District" } },
    ],
    CENTER,
    { exclude: ["Portland"] }
  ),
  "Northwest District",
  "placeName: suburb used when nothing finer exists"
);
// A suburb MUCH closer than a distant neighbourhood should win despite priority.
eq(
  pickNearestPlaceName(
    [
      { type: "node", lat: 45.5320, lon: -122.6819, tags: { place: "suburb", name: "Close Suburb" } },
      { type: "node", lat: 45.57, lon: -122.6819, tags: { place: "neighbourhood", name: "Far Hood" } },
    ],
    CENTER
  ),
  "Close Suburb",
  "placeName: distance still dominates a >0.5km specificity gap"
);
eq(pickNearestPlaceName([], CENTER), null, "placeName: no nodes → null");
eq(pickNearestPlaceName(null, CENTER), null, "placeName: null elements never throws");
eq(pickNearestPlaceName(PLACES, null), null, "placeName: null point never throws");
eq(
  pickNearestPlaceName([{ tags: { place: "neighbourhood", name: "NaN Town" }, lat: "x", lon: "y" }], CENTER),
  null,
  "placeName: NaN coords skipped"
);

// --- pickNearestCityName (fallback city label from place nodes) ----------------
eq(
  pickNearestCityName(
    [
      // city ~9km away vs town ~0.1km away: town wins despite its 2km penalty
      { lat: 45.45, lon: -122.68, tags: { place: "city", name: "Portland" } },
      { lat: 45.53, lon: -122.681, tags: { place: "town", name: "Closerton" } },
    ],
    CENTER
  ),
  "Closerton",
  "cityName: much-closer town beats the city"
);
eq(
  pickNearestCityName(
    [
      { lat: 45.525, lon: -122.68, tags: { place: "city", name: "Portland" } },
      { lat: 45.528, lon: -122.681, tags: { place: "town", name: "Tinyville" } },
    ],
    CENTER
  ),
  "Portland",
  "cityName: city wins over a town at similar distance (penalty)"
);
eq(pickNearestCityName(null, CENTER), null, "cityName: null never throws");

// --- matchableNear ---------------------------------------------------------------
eq(
  matchableNear({ lat: 38.585, lng: -90.405 }, "Kirkwood, MO", FIXTURE, KNOWN),
  { city: "St. Louis, MO", neighborhood: "Kirkwood" },
  "matchableNear: non-live city rescued by global nearest"
);
eq(
  matchableNear({ lat: 44.0, lng: -103.5 }, null, FIXTURE, KNOWN),
  null,
  "matchableNear: far point → null"
);

// --- shapeCentroidResult (the resilient local-centroid path) -----------------------
// (a) Everything available: Nominatim address wins for name + city.
eq(
  shapeCentroidResult(
    "97209",
    { lat: 45.5312, lng: -122.6819 },
    { neighbourhood: "Pearl District", city: "Portland", state: "Oregon" },
    null,
    FIXTURE,
    KNOWN
  ),
  {
    zip: "97209",
    detected: { name: "Pearl District", city: "Portland, OR" },
    matchable: { city: "Portland, OR", neighborhood: "Pearl District" },
    source: "centroid",
  },
  "centroid: Nominatim address path"
);
// (b) Nominatim blocked (null address): Overpass place nodes supply the labels,
// matching still works from the centroid alone.
eq(
  shapeCentroidResult(
    "97209",
    { lat: 45.5312, lng: -122.6819 },
    null,
    [
      { lat: 45.5348, lon: -122.6819, tags: { place: "neighbourhood", name: "Pearl District" } },
      { lat: 45.52, lon: -122.68, tags: { place: "city", name: "Portland" } },
    ],
    FIXTURE,
    KNOWN
  ),
  {
    zip: "97209",
    detected: { name: "Pearl District", city: "Portland, OR" },
    matchable: { city: "Portland, OR", neighborhood: "Pearl District" },
    source: "centroid",
  },
  "centroid: geocoder-blocked → Overpass labels, matchable from centroid"
);
// (c) EVERYTHING external down: matching still works; labels degrade gracefully.
eq(
  shapeCentroidResult("97209", { lat: 45.5312, lng: -122.6819 }, null, null, FIXTURE, KNOWN),
  {
    zip: "97209",
    detected: { name: "Pearl District", city: "Portland, OR" },
    matchable: { city: "Portland, OR", neighborhood: "Pearl District" },
    source: "centroid",
  },
  "centroid: all geocoders down → still matchable (labels from the match)"
);
// (d) Remote ZIP, no geocoders: honest ZIP-labeled preview.
eq(
  shapeCentroidResult("57701", { lat: 44.0, lng: -103.5 }, null, null, FIXTURE, KNOWN),
  {
    zip: "57701",
    detected: { name: "ZIP 57701", city: "ZIP 57701" },
    matchable: null,
    source: "centroid",
  },
  "centroid: remote ZIP with nothing external → preview"
);
eq(shapeCentroidResult("97209", null, null, null, FIXTURE, KNOWN), null, "centroid: null point → null");

// Sanity: MAX_MATCH_KM is a sane rescue radius.
eq(MAX_MATCH_KM > 5 && MAX_MATCH_KM < 100, true, "MAX_MATCH_KM in a sane range");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
