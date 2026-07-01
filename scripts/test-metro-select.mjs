/**
 * test-metro-select.mjs — offline unit tests for the API-driven metro selection
 * helpers. Runs with NO network: `node scripts/test-metro-select.mjs`.
 */
import { cleanPlaceName, pickTopZctas, parseZctaPlaceRel } from "./lib/metro-select.mjs";

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

// --- cleanPlaceName -----------------------------------------------------------
eq(cleanPlaceName("Kirkwood city"), "Kirkwood", "strips 'city' suffix");
eq(cleanPlaceName("Ann Arbor city"), "Ann Arbor", "keeps multiword names");
eq(cleanPlaceName("Winston-Salem city"), "Winston-Salem", "keeps real hyphenated cities");
eq(
  cleanPlaceName("Nashville-Davidson metropolitan government (balance)"),
  "Nashville",
  "consolidated: Nashville-Davidson → Nashville"
);
eq(
  cleanPlaceName("Louisville/Jefferson County metro government (balance)"),
  "Louisville",
  "consolidated: Louisville/Jefferson → Louisville"
);
eq(cleanPlaceName("Lexington-Fayette urban county"), "Lexington", "consolidated: Lexington-Fayette");
eq(cleanPlaceName("Urban Honolulu CDP"), "Honolulu", "consolidated: Urban Honolulu CDP");
eq(cleanPlaceName("Indianapolis city (balance)"), "Indianapolis", "consolidated: Indianapolis balance");
eq(cleanPlaceName("Boise City city"), "Boise", "consolidated: Boise City");
eq(cleanPlaceName("El Paso city"), "El Paso", "plain big city");
eq(cleanPlaceName("   "), null, "blank → null");
eq(cleanPlaceName(null), null, "null never throws");

// --- pickTopZctas ---------------------------------------------------------------
const POP = new Map([
  ["10001", 25000],
  ["10002", 74000],
  ["10003", 54000],
  ["10004", 0], // unpopulated (office district) — dropped
  ["10005", 8000],
]);
eq(
  pickTopZctas(["10001", "10002", "10003", "10004", "10005"], POP, 3),
  ["10002", "10003", "10001"],
  "keeps the max-N most-populated ZCTAs, in pop order"
);
eq(pickTopZctas(["10004"], POP, 5), [], "zero-population ZCTAs dropped");
eq(pickTopZctas(["10001", "10001"], POP, 5), ["10001"], "dedupes");
eq(pickTopZctas(["abcde"], POP, 5), [], "non-numeric ZCTA dropped");
eq(pickTopZctas(null, POP, 5), [], "null input never throws");

// --- parseZctaPlaceRel ------------------------------------------------------------
const REL_PIPE = [
  "OID_ZCTA5_20|GEOID_ZCTA5_20|OID_PLACE_20|GEOID_PLACE_20|NAMELSAD_PLACE_20",
  "1|10001|2|3651000|New York city",
  "1|10002|2|3651000|New York city",
  "1|97209|3|4159000|Portland city",
  "1|badzz|3|4159000|Portland city",
].join("\n");
const rel = parseZctaPlaceRel(REL_PIPE);
eq(Array.from(rel.get("3651000") ?? []), ["10001", "10002"], "rel: groups ZCTAs by place GEOID");
eq(Array.from(rel.get("4159000") ?? []), ["97209"], "rel: drops malformed ZCTAs");
eq(parseZctaPlaceRel("").size, 0, "rel: empty input → empty map");
eq(parseZctaPlaceRel(null).size, 0, "rel: null never throws");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
