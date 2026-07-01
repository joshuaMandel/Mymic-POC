import { usCities, LIVE_CITIES } from "@/lib/us-cities";

// City type-ahead search. The full ~32k Census Places list lives server-side
// only — shipping it to every browser cost ~150kB of page JS. Returns the top
// matches ranked: live (ingested) cities first, then prefix matches, then
// alphabetical — the same ranking the client used to compute locally.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SUGGESTIONS = 8;

export async function GET(req: Request): Promise<Response> {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  const isLive = (c: string) => (LIVE_CITIES.has(c) ? 1 : 0);
  const pool = q ? usCities.filter((c) => c.toLowerCase().includes(q)) : usCities;
  const suggestions = [...pool]
    .sort((a, b) => {
      const live = isLive(b) - isLive(a);
      if (live) return live;
      const sa = a.toLowerCase().startsWith(q) ? 1 : 0;
      const sb = b.toLowerCase().startsWith(q) ? 1 : 0;
      if (sb - sa) return sb - sa;
      return a.localeCompare(b);
    })
    .slice(0, MAX_SUGGESTIONS)
    .map((city) => ({ city, live: LIVE_CITIES.has(city) }));
  return Response.json({ suggestions });
}
