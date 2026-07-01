import { neighborhoods, cityNames } from "@/lib/neighborhoods";
import centroidsRaw from "@/data/zip-centroids.generated.json";
import {
  isZipLike,
  resolveZipLocally,
  shapeCentroidResult,
  shapeNominatimResult,
  pickPlaceName,
  cityLabelFromAddress,
  type ZipDetection,
} from "@/scripts/lib/zip-lookup.mjs";

// Resolves a 5-digit ZIP to "you're in <neighborhood>, <City, ST>" plus an
// engine-ready { city, neighborhood } origin. Resolution ladder, most reliable
// first:
//   1. Ingested records (id "zcta-<zip>") — instant, zero network.
//   2. Local Census centroid (data/zip-centroids.generated.json) — the CORE
//      matching (nearest known neighborhood) needs no external service; a
//      Nominatim reverse / Overpass place query only improve the display label.
//   3. Nominatim postal-code search — only for ZIPs missing from the gazetteer.
// Always returns HTTP 200 JSON — clients branch on `ok`.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOMINATIM = "https://nominatim.openstreetmap.org";
// Same mirror rotation the ingestion pipeline uses (they accept cloud IPs).
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const UA = "MyMik-POC/1.0 (zip lookup; contact: you@example.com)";

const CENTROIDS = centroidsRaw as Record<string, [number, number]>;

type ZipLookupResponse =
  | ({ ok: true } & ZipDetection)
  | { ok: false; zip: string; error: "invalid_zip" | "not_found" | "lookup_failed" };

// Per-warm-lambda cache; also keeps us polite to the free geocoders.
const cache = new Map<string, ZipLookupResponse>();
const CACHE_MAX = 500;

function remember(zip: string, res: ZipLookupResponse): ZipLookupResponse {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(zip, res);
  return res;
}

async function fetchJson(
  url: string,
  timeoutMs: number,
  init?: RequestInit
): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, "Accept-Language": "en", ...(init?.headers ?? {}) },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Nominatim reverse geocode → address object (may be blocked for cloud IPs —
// callers must treat null as routine, not exceptional).
async function nominatimReverse(lat: number, lng: number): Promise<unknown> {
  const json = (await fetchJson(
    `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
    8_000
  )) as { address?: unknown } | null;
  return json?.address ?? null;
}

// Overpass place nodes near a point: neighbourhood-level names close by, plus
// city/town names further out for the fallback city label.
async function overpassPlaces(lat: number, lng: number): Promise<unknown> {
  const q = `[out:json][timeout:20];
(node(around:3000,${lat},${lng})[place~"^(neighbourhood|quarter|suburb)$"][name];
node(around:25000,${lat},${lng})[place~"^(city|town|village)$"][name];);
out body 60;`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const json = (await fetchJson(endpoint, 12_000, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(q),
    })) as { elements?: unknown; remark?: unknown } | null;
    if (json && !json.remark && Array.isArray(json.elements)) return json.elements;
  }
  return null;
}

export async function GET(req: Request): Promise<Response> {
  const zip = (new URL(req.url).searchParams.get("zip") ?? "").trim();
  if (!isZipLike(zip)) {
    return Response.json({ ok: false, zip, error: "invalid_zip" } satisfies ZipLookupResponse);
  }

  const cached = cache.get(zip);
  if (cached) return Response.json(cached);

  // 1. Ingested data — instant, no network.
  const local = resolveZipLocally(zip, neighborhoods);
  if (local) {
    return Response.json(remember(zip, { ok: true, ...local }));
  }

  const knownCities = new Set(cityNames);

  // 2. Local Census centroid — matching works even if every geocoder is down.
  const centroid = CENTROIDS[zip];
  if (centroid) {
    const point = { lat: centroid[0], lng: centroid[1] };
    const address = await nominatimReverse(point.lat, point.lng);
    // Only pay for the Overpass call when Nominatim didn't already name the
    // neighborhood (blocked cloud IP, timeout, or a sparse address).
    const cityPart = cityLabelFromAddress(address)?.split(",")[0]?.trim();
    const needPlaces = !pickPlaceName(address, { exclude: cityPart ? [cityPart] : [] });
    const placeElements = needPlaces ? await overpassPlaces(point.lat, point.lng) : null;
    const shaped = shapeCentroidResult(zip, point, address, placeElements, neighborhoods, knownCities);
    if (shaped) return Response.json(remember(zip, { ok: true, ...shaped }));
  }

  // 3. No local centroid (file not yet generated, or a brand-new ZIP):
  //    fall back to a Nominatim postal-code search.
  const searchJson = await fetchJson(
    `${NOMINATIM}/search?postalcode=${zip}&country=us&format=jsonv2&addressdetails=1&limit=1`,
    15_000
  );
  if (searchJson === null) {
    // Network/timeout failure — transient, so never cached.
    return Response.json({ ok: false, zip, error: "lookup_failed" } satisfies ZipLookupResponse);
  }
  const hit = Array.isArray(searchJson) ? (searchJson[0] as { lat?: string; lon?: string }) : null;
  let reverseJson: unknown = null;
  if (hit?.lat && hit?.lon) {
    reverseJson = await fetchJson(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${hit.lat}&lon=${hit.lon}&zoom=14&addressdetails=1`,
      8_000
    );
  }
  const shaped = shapeNominatimResult(zip, searchJson, reverseJson, neighborhoods, knownCities);
  if (!shaped) {
    return Response.json(remember(zip, { ok: false, zip, error: "not_found" }));
  }
  return Response.json(remember(zip, { ok: true, ...shaped }));
}
