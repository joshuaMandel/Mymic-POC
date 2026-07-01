import { getCityPair, rankMatches, type Preference } from "@/lib/data";
import { generateExplanations } from "@/lib/explain";

// Needs the Node runtime for the Anthropic SDK; never cache (results are per-request).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  from?: string | null;
  to?: string | null;
  neighborhood?: string | null;
  preferences?: unknown;
};

// Health check — visit /api/match in a browser to confirm the deployment can
// see the key. Returns a boolean only; never the key itself.
export async function GET() {
  return Response.json({
    ok: true,
    keyPresent: Boolean(process.env.ANTHROPIC_API_KEY),
    model: "claude-haiku-4-5",
  });
}

function parsePreferences(input: unknown): Preference[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (p): p is { name: string; importance?: unknown } =>
        !!p && typeof (p as { name?: unknown }).name === "string"
    )
    .map((p) => ({
      name: p.name,
      importance: Number((p as { importance?: unknown }).importance) || 1,
    }));
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    // ignore — fall through with defaults
  }

  const preferences = parsePreferences(body.preferences);

  // Reuse the exact same engine the client used to run inline.
  const pair = getCityPair(body.from ?? null, body.to ?? null);
  const neighborhood =
    typeof body.neighborhood === "string" && body.neighborhood
      ? body.neighborhood
      : pair.matches[0].familiar;

  const ranked = rankMatches(pair.matches, preferences);

  let matches = ranked;
  let aiGenerated = false;
  const keyPresent = Boolean(process.env.ANTHROPIC_API_KEY);
  let aiError: string | undefined;

  // Only reach for Claude when a key is configured; otherwise keep templated copy.
  if (keyPresent) {
    try {
      const explanations = await generateExplanations(pair, ranked, neighborhood);
      matches = ranked.map((m) => ({
        ...m,
        explanation: explanations[m.id] ?? m.explanation,
      }));
      aiGenerated = true;
    } catch (err) {
      console.error("[/api/match] AI explanation generation failed:", err);
      // Non-secret error summary for diagnostics (Anthropic errors don't contain the key).
      aiError =
        err instanceof Error
          ? `${err.name}: ${err.message}`.slice(0, 300)
          : String(err).slice(0, 300);
    }
  }

  return Response.json({
    from: pair.origin,
    to: pair.destination,
    neighborhood,
    center: pair.center,
    zoom: pair.zoom,
    matches,
    aiGenerated,
    keyPresent,
    aiError,
  });
}
