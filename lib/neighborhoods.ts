// The comparable attributes every neighborhood is scored on (0-100, normalized
// within its metro). This is the vector the similarity engine matches against.
export const FACTORS = [
  "Walkability",
  "Amenities",
  "Schools",
  "Nightlife",
  "Outdoors",
] as const;

export type FactorKey = (typeof FACTORS)[number];

export type Attrs = Record<FactorKey, number>;

export type Neighborhood = {
  id: string;
  city: string; // "Denver, CO"
  name: string; // "Wheat Ridge"
  coords: { lat: number; lng: number };
  attrs: Attrs;
};

export type CityMeta = { center: { lat: number; lng: number }; zoom: number };

// Map/framing metadata per city.
export const CITY_META: Record<string, CityMeta> = {
  "St. Louis, MO": { center: { lat: 38.627, lng: -90.1994 }, zoom: 11 },
  "Chicago, IL": { center: { lat: 41.8781, lng: -87.6298 }, zoom: 11 },
  "San Francisco, CA": { center: { lat: 37.7749, lng: -122.4194 }, zoom: 12 },
  "Denver, CO": { center: { lat: 39.7392, lng: -104.9903 }, zoom: 11 },
  "Austin, TX": { center: { lat: 30.2672, lng: -97.7431 }, zoom: 12 },
  "Seattle, WA": { center: { lat: 47.6205, lng: -122.3493 }, zoom: 12 },
};

const a = (
  Walkability: number,
  Amenities: number,
  Schools: number,
  Nightlife: number,
  Outdoors: number
): Attrs => ({ Walkability, Amenities, Schools, Nightlife, Outdoors });

/**
 * Seed dataset: real-shaped attribute vectors for every neighborhood in both
 * origin and destination cities. This is what makes the engine bidirectional —
 * any city here can be matched against any other. The ingestion script
 * (scripts/build-neighborhoods.mjs) extends this to real US cities.
 */
export const neighborhoods: Neighborhood[] = [
  // --- St. Louis, MO ---
  { id: "stl-kirkwood", city: "St. Louis, MO", name: "Kirkwood", coords: { lat: 38.5834, lng: -90.4068 }, attrs: a(72, 70, 90, 45, 82) },
  { id: "stl-clayton", city: "St. Louis, MO", name: "Clayton", coords: { lat: 38.6426, lng: -90.3237 }, attrs: a(82, 92, 85, 60, 62) },
  { id: "stl-cwe", city: "St. Louis, MO", name: "Central West End", coords: { lat: 38.644, lng: -90.262 }, attrs: a(90, 86, 60, 88, 55) },
  { id: "stl-webster", city: "St. Louis, MO", name: "Webster Groves", coords: { lat: 38.5926, lng: -90.3573 }, attrs: a(68, 66, 92, 42, 75) },
  { id: "stl-soulard", city: "St. Louis, MO", name: "Soulard", coords: { lat: 38.605, lng: -90.205 }, attrs: a(80, 76, 50, 92, 58) },

  // --- Chicago, IL ---
  { id: "chi-wicker", city: "Chicago, IL", name: "Wicker Park", coords: { lat: 41.9088, lng: -87.6796 }, attrs: a(90, 86, 58, 92, 58) },
  { id: "chi-lincoln", city: "Chicago, IL", name: "Lincoln Park", coords: { lat: 41.9214, lng: -87.6513 }, attrs: a(84, 85, 90, 62, 80) },
  { id: "chi-loop", city: "Chicago, IL", name: "The Loop", coords: { lat: 41.8786, lng: -87.6298 }, attrs: a(96, 90, 55, 78, 50) },
  { id: "chi-hydepark", city: "Chicago, IL", name: "Hyde Park", coords: { lat: 41.7943, lng: -87.5907 }, attrs: a(82, 74, 82, 55, 66) },
  { id: "chi-lakeview", city: "Chicago, IL", name: "Lakeview", coords: { lat: 41.9403, lng: -87.6438 }, attrs: a(88, 86, 66, 84, 64) },

  // --- San Francisco, CA ---
  { id: "sf-mission", city: "San Francisco, CA", name: "The Mission", coords: { lat: 37.7599, lng: -122.4148 }, attrs: a(94, 88, 54, 92, 56) },
  { id: "sf-pacheights", city: "San Francisco, CA", name: "Pacific Heights", coords: { lat: 37.7925, lng: -122.4382 }, attrs: a(82, 84, 86, 52, 64) },
  { id: "sf-hayes", city: "San Francisco, CA", name: "Hayes Valley", coords: { lat: 37.7765, lng: -122.4244 }, attrs: a(90, 87, 60, 76, 58) },
  { id: "sf-sunset", city: "San Francisco, CA", name: "Sunset District", coords: { lat: 37.7523, lng: -122.4936 }, attrs: a(70, 66, 80, 44, 82) },
  { id: "sf-soma", city: "San Francisco, CA", name: "SoMa", coords: { lat: 37.7785, lng: -122.4056 }, attrs: a(86, 80, 50, 72, 52) },

  // --- Denver, CO ---
  { id: "den-wheatridge", city: "Denver, CO", name: "Wheat Ridge", coords: { lat: 39.7665, lng: -105.0772 }, attrs: a(78, 82, 90, 55, 88) },
  { id: "den-cherrycreek", city: "Denver, CO", name: "Cherry Creek", coords: { lat: 39.7169, lng: -104.9525 }, attrs: a(84, 95, 80, 72, 70) },
  { id: "den-lodo", city: "Denver, CO", name: "LoDo", coords: { lat: 39.753, lng: -104.9986 }, attrs: a(92, 88, 62, 90, 58) },
  { id: "den-littleton", city: "Denver, CO", name: "Littleton", coords: { lat: 39.6133, lng: -105.0178 }, attrs: a(70, 74, 92, 48, 80) },
  { id: "den-rino", city: "Denver, CO", name: "RiNo", coords: { lat: 39.7686, lng: -104.9805 }, attrs: a(80, 78, 55, 94, 62) },

  // --- Austin, TX ---
  { id: "aus-east", city: "Austin, TX", name: "East Austin", coords: { lat: 30.264, lng: -97.723 }, attrs: a(85, 84, 58, 92, 60) },
  { id: "aus-tarrytown", city: "Austin, TX", name: "Tarrytown", coords: { lat: 30.296, lng: -97.776 }, attrs: a(72, 80, 90, 50, 86) },
  { id: "aus-downtown", city: "Austin, TX", name: "Downtown Austin", coords: { lat: 30.2672, lng: -97.7431 }, attrs: a(95, 90, 55, 82, 52) },
  { id: "aus-hydepark", city: "Austin, TX", name: "Hyde Park (Austin)", coords: { lat: 30.305, lng: -97.728 }, attrs: a(78, 72, 80, 55, 70) },
  { id: "aus-soco", city: "Austin, TX", name: "South Congress", coords: { lat: 30.248, lng: -97.751 }, attrs: a(88, 86, 62, 84, 64) },

  // --- Seattle, WA ---
  { id: "sea-caphill", city: "Seattle, WA", name: "Capitol Hill", coords: { lat: 47.623, lng: -122.312 }, attrs: a(92, 88, 56, 90, 58) },
  { id: "sea-queenanne", city: "Seattle, WA", name: "Queen Anne", coords: { lat: 47.637, lng: -122.357 }, attrs: a(80, 82, 84, 52, 66) },
  { id: "sea-ballard", city: "Seattle, WA", name: "Ballard", coords: { lat: 47.668, lng: -122.384 }, attrs: a(86, 85, 60, 78, 62) },
  { id: "sea-westseattle", city: "Seattle, WA", name: "West Seattle", coords: { lat: 47.576, lng: -122.409 }, attrs: a(68, 66, 78, 44, 82) },
  { id: "sea-slu", city: "Seattle, WA", name: "South Lake Union", coords: { lat: 47.627, lng: -122.337 }, attrs: a(84, 80, 50, 70, 54) },
];

// Distinct city names, in insertion order.
export const cityNames: string[] = Array.from(
  new Set(neighborhoods.map((n) => n.city))
);

export function neighborhoodsInCity(city: string): Neighborhood[] {
  return neighborhoods.filter((n) => n.city === city);
}

export function cityMeta(city: string): CityMeta {
  return CITY_META[city] ?? { center: { lat: 39.5, lng: -98.35 }, zoom: 11 };
}

// Back-compat names used by the pickers (any city can now be origin or destination).
export const originCityNames = cityNames;
export const destinationCityNames = cityNames;
export function neighborhoodsForOrigin(city: string): string[] {
  return neighborhoodsInCity(city).map((n) => n.name);
}
