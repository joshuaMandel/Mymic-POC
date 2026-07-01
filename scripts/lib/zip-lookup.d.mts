/**
 * Type declarations for zip-lookup.mjs (TS pairs `.d.mts` with `.mjs`).
 * `ZipDetection` doubles as the /api/zip-lookup response payload contract.
 */

export type LatLng = { lat: number; lng: number };

export type NeighborhoodLike = {
  id: string;
  city: string;
  name: string;
  coords: LatLng;
};

export type ZipDetection = {
  zip: string;
  /** Human label for the card: "You're in <name> — <city>". */
  detected: { name: string; city: string };
  /** Engine-ready strings for resolveMatches; null ⇒ preview mode. */
  matchable: { city: string; neighborhood: string } | null;
  source: "data" | "nominatim";
};

export const ZIP_RE: RegExp;
export function isZipLike(s: unknown): boolean;
export const US_STATE_ABBR: Record<string, string>;
export function stateAbbr(name: unknown): string | null;
export function zipFromId(id: unknown): string | null;
export function findNeighborhoodByZip(
  zip: string,
  neighborhoods: NeighborhoodLike[]
): NeighborhoodLike | null;
export function haversineKm(a: LatLng, b: LatLng): number;
export function nearestNeighborhood(
  point: LatLng | null | undefined,
  neighborhoods: NeighborhoodLike[],
  city?: string
): { neighborhood: NeighborhoodLike; distanceKm: number } | null;
export function pickNearestPlaceName(
  elements: unknown,
  point: LatLng | null | undefined,
  opts?: { exclude?: string[] }
): string | null;
export function cityLabelFromAddress(address: unknown): string | null;
export const MAX_MATCH_KM: number;
export function resolveZipLocally(
  zip: string,
  neighborhoods: NeighborhoodLike[]
): ZipDetection | null;
export function shapeNominatimResult(
  zip: string,
  searchJson: unknown,
  reverseJson: unknown,
  neighborhoods: NeighborhoodLike[],
  knownCities: Set<string>
): ZipDetection | null;
