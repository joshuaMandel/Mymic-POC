import { type Preference } from "@/lib/data";
import { resolveMatches } from "@/lib/match-engine";
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

  // Real vector-based similarity engine (works for any pair of cities we have data for).
  const result = resolveMatches(
    body.from ?? null,
    body.to ?? null,
    body.neighborhood ?? null,
    preferences
  );

  let matches = result.matches;
  let aiGenerated = false;

  // Only reach for Claude when a key is configured; otherwise keep templated copy.
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const explanations = await generateExplanations(
        result.from,
        result.to,
        result.neighborhood,
        result.matches
      );
      matches = result.matches.map((m) => ({
        ...m,
        explanation: explanations[m.id] ?? m.explanation,
      }));
      aiGenerated = true;
    } catch (err) {
      console.error("[/api/match] AI explanation generation failed:", err);
    }
  }

  return Response.json({
    from: result.from,
    to: result.to,
    neighborhood: result.neighborhood,
    center: result.center,
    zoom: result.zoom,
    matches,
    aiGenerated,
  });
}
