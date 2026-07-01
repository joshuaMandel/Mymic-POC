import generatedRaw from "../data/neighborhoods.generated.json";

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
  id: string; // "zcta-97209"
  city: string; // "Portland, OR"
  name: string; // "Pearl District"
  coords: { lat: number; lng: number };
  attrs: Attrs;
};

export type CityMeta = { center: { lat: number; lng: number }; zoom: number };

/**
 * The entire dataset is real ingested data — US Census (ACS) + OpenStreetMap —
 * written by scripts/build-neighborhoods.mjs (run via the "Ingest neighborhood
 * data" GitHub Action). No hand-curated records. To add cities, edit
 * scripts/metros.json and re-run the Action.
 */
export const neighborhoods: Neighborhood[] = generatedRaw as Neighborhood[];

// Distinct city names, in insertion order.
export const cityNames: string[] = Array.from(
  new Set(neighborhoods.map((n) => n.city))
);

export function neighborhoodsInCity(city: string): Neighborhood[] {
  return neighborhoods.filter((n) => n.city === city);
}

// Map framing: center on the average of the city's neighborhood coordinates.
export function cityMeta(city: string): CityMeta {
  const inCity = neighborhoodsInCity(city);
  if (inCity.length > 0) {
    const lat = inCity.reduce((s, n) => s + n.coords.lat, 0) / inCity.length;
    const lng = inCity.reduce((s, n) => s + n.coords.lng, 0) / inCity.length;
    return { center: { lat, lng }, zoom: 12 };
  }
  return { center: { lat: 39.5, lng: -98.35 }, zoom: 4 }; // continental US
}

// Back-compat names used by the pickers (any city can be origin or destination).
export const originCityNames = cityNames;
export const destinationCityNames = cityNames;
export function neighborhoodsForOrigin(city: string): string[] {
  return neighborhoodsInCity(city).map((n) => n.name);
}
