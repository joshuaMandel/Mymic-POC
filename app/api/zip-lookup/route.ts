import { neighborhoods, cityNames } from "@/lib/neighborhoods";
import {
  isZipLike,
  resolveZipLocally,
  shapeNominatimResult,
  type ZipDetection,
} from "@/scripts/lib/zip-lookup.mjs";

// Resolves a 5-digit ZIP to "you're in <neighborhood>, <City, ST>" plus an
// engine-ready { city, neighborhood } origin. Data path first (ingested
// zcta-<zip> records, instant + offline); otherwise a live OpenStreetMap
// Nominatim lookup. Always returns HTTP 200 JSON — clients branch on `ok`.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const UA = "MyMik-POC/1.0 (zip lookup; contact: you@example.com)";
const REQ_TIMEOUT_MS = 15_000;

type ZipLookupResponse =
  | ({ ok: true } & ZipDetection)
  | { ok: false; zip: string; error: "invalid_zip" | "not_found" | "lookup_failed" };

// Per-warm-lambda cache; Nominatim asks for ≤1 req/sec, this absorbs repeats.
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

async function fetchJson(url: string): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
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

export async function GET(req: Request): Promise<Response> {
  const zip = (new URL(req.url).searchParams.get("zip") ?? "").trim();
  if (!isZipLike(zip)) {
    return Response.json({ ok: false, zip, error: "invalid_zip" } satisfies ZipLookupResponse);
  }

  const cached = cache.get(zip);
  if (cached) return Response.json(cached);

  // 1. Data path: ingested records carry id "zcta-<zip>" — instant, no network.
  const local = resolveZipLocally(zip, neighborhoods);
  if (local) {
    return Response.json(remember(zip, { ok: true, ...local }));
  }

  // 2. Live path: Nominatim search by postal code → coords + coarse address.
  const searchJson = await fetchJson(
    `${NOMINATIM}/search?postalcode=${zip}&country=us&format=jsonv2&addressdetails=1&limit=1`
  );
  if (searchJson === null) {
    // Network/timeout failure — transient, so never cached.
    return Response.json({ ok: false, zip, error: "lookup_failed" } satisfies ZipLookupResponse);
  }

  // 3. Postcode search rarely names the neighbourhood, so reverse-geocode the
  //    point at neighborhood zoom (same zoom the ingestion pipeline uses).
  //    A reverse failure is non-fatal — shaping falls back to the search address.
  const hit = Array.isArray(searchJson) ? (searchJson[0] as { lat?: string; lon?: string }) : null;
  let reverseJson: unknown = null;
  if (hit?.lat && hit?.lon) {
    reverseJson = await fetchJson(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${hit.lat}&lon=${hit.lon}&zoom=14&addressdetails=1`
    );
  }

  const shaped = shapeNominatimResult(zip, searchJson, reverseJson, neighborhoods, new Set(cityNames));
  if (!shaped) {
    return Response.json(remember(zip, { ok: false, zip, error: "not_found" }));
  }
  return Response.json(remember(zip, { ok: true, ...shaped }));
}
