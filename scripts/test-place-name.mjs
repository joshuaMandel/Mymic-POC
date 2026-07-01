/**
 * test-place-name.mjs — unit tests for the reverse-geocode name picker.
 * Runs with NO network and NO Census key: `node scripts/test-place-name.mjs`.
 *
 * The fixtures are shaped like real Nominatim reverse-geocode `address` objects
 * (addressdetails=1) for the ZIPs we actually ingest, plus edge cases, so we can
 * verify the "ZIP 12345 → real neighborhood" logic makes sense offline.
 */
import { pickPlaceName, dedupeName } from "./lib/place-name.mjs";

let passed = 0;
let failed = 0;
function eq(actual, expected, label) {
  const ok = actual === expected;
  console.log(`${ok ? "✓" : "✗"} ${label}: got ${JSON.stringify(actual)}`);
  if (ok) passed++;
  else {
    failed++;
    console.log(`    expected ${JSON.stringify(expected)}`);
  }
}

// --- pickPlaceName: real-shaped Nominatim address objects ------------------

// Portland 97209 → Pearl District (a true `neighbourhood`).
eq(
  pickPlaceName(
    { neighbourhood: "Pearl District", suburb: "Northwest District", city: "Portland", state: "Oregon" },
    { exclude: ["Portland"] }
  ),
  "Pearl District",
  "prefers neighbourhood over suburb"
);

// Nashville 37203 → Music Row (neighbourhood present, city must not win).
eq(
  pickPlaceName(
    { neighbourhood: "Music Row", city_district: "District 19", city: "Nashville", state: "Tennessee" },
    { exclude: ["Nashville"] }
  ),
  "Music Row",
  "picks neighbourhood, ignores city_district/city"
);

// Only a suburb present → use it.
eq(
  pickPlaceName({ suburb: "Ballard", city: "Seattle" }, { exclude: ["Seattle"] }),
  "Ballard",
  "falls back to suburb when no neighbourhood"
);

// quarter beats suburb (more specific).
eq(
  pickPlaceName({ suburb: "Midtown", quarter: "Hillsboro Village", city: "Nashville" }, { exclude: ["Nashville"] }),
  "Hillsboro Village",
  "quarter outranks suburb"
);

// Only city_district present → use it.
eq(
  pickPlaceName({ city_district: "South Waterfront", city: "Portland" }, { exclude: ["Portland"] }),
  "South Waterfront",
  "falls back to city_district"
);

// The only candidate IS the metro city → excluded → null (caller uses ZIP).
eq(
  pickPlaceName({ suburb: "Portland", city: "Portland" }, { exclude: ["Portland"] }),
  null,
  "rejects a name equal to the metro city (case-insensitive)"
);

// Rural ZIP with no neighborhood-like fields → null.
eq(
  pickPlaceName({ county: "Wilson County", state: "Tennessee" }),
  null,
  "no neighborhood fields → null"
);

// Robustness: null / non-object input → null (never throws).
eq(pickPlaceName(null), null, "null address → null");
eq(pickPlaceName(undefined), null, "undefined address → null");
eq(pickPlaceName("nope"), null, "string address → null");

// Whitespace-only value is not a usable name.
eq(pickPlaceName({ neighbourhood: "   ", suburb: "Eastside" }), "Eastside", "skips blank neighbourhood");

// --- dedupeName: keep labels unique within a metro ------------------------
const used = new Set();
eq(dedupeName("Downtown", "37201", used), "Downtown", "first use is unchanged");
eq(dedupeName("Downtown", "37213", used), "Downtown (37213)", "collision gets ZIP suffix");
eq(dedupeName("Germantown", "37208", used), "Germantown", "distinct name is unchanged");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
