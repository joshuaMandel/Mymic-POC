import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { CityPair, ScoredMatch } from "./data";

// Fast + cheap model for short, on-demand copy. ($1 / $5 per 1M tokens.)
const MODEL = "claude-haiku-4-5";

const ResultSchema = z.object({
  explanations: z.array(z.object({ id: z.string(), text: z.string() })),
});

// Structured-output schema handed to the API (guarantees valid JSON back).
const OUTPUT_FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["explanations"],
    properties: {
      explanations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "text"],
          properties: {
            id: { type: "string" },
            text: { type: "string" },
          },
        },
      },
    },
  },
} as const;

// Cache within a warm serverless instance so identical searches don't re-call Claude.
const cache = new Map<string, Record<string, string>>();

function signature(
  pair: CityPair,
  neighborhood: string,
  matches: ScoredMatch[]
): string {
  const parts = matches
    .map((m) => `${m.id}:${m.personalizedScore}`)
    .join("|");
  return `${pair.origin}>${pair.destination}#${neighborhood}#${parts}`;
}

/**
 * Generate a short "why it matches" explanation for each ranked match using
 * Claude Haiku 4.5, grounded in the match's factor scores. Returns a map of
 * match id -> explanation text. Throws on API/parse failure (callers fall back
 * to the templated explanations already on each match).
 */
export async function generateExplanations(
  pair: CityPair,
  matches: ScoredMatch[],
  neighborhood: string
): Promise<Record<string, string>> {
  const key = signature(pair, neighborhood, matches);
  const cached = cache.get(key);
  if (cached) return cached;

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const system =
    "You are MyMik, a relocation tool that translates neighborhoods a person " +
    "already knows into equivalent neighborhoods in the city they're moving to. " +
    "For each match, write one vivid, concrete 1-2 sentence explanation of why the " +
    "destination neighborhood feels like the familiar origin neighborhood. Ground " +
    "every claim ONLY in the provided factor scores (0-100 scale). No preamble, no " +
    "markdown, no lists — just the sentence(s). Return an explanation for every id.";

  const items = matches.map((m) => ({
    id: m.id,
    familiar: m.familiar,
    actual: m.actual,
    matchScore: m.personalizedScore,
    factors: m.factors.reduce<Record<string, number>>((acc, f) => {
      acc[f.label] = f.value;
      return acc;
    }, {}),
  }));

  const user =
    `Origin city: ${pair.origin}\n` +
    `Destination city: ${pair.destination}\n` +
    `The person's home neighborhood: ${neighborhood}\n\n` +
    `Write an explanation for each match below:\n` +
    JSON.stringify(items, null, 2);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
    // output_config is a valid API param; cast to keep older SDK types happy.
    ...({ output_config: { format: OUTPUT_FORMAT } } as Record<string, unknown>),
  });

  let text = "";
  for (const block of response.content) {
    if (block.type === "text") text += block.text;
  }

  const parsed = ResultSchema.parse(JSON.parse(text));
  const record: Record<string, string> = {};
  for (const e of parsed.explanations) record[e.id] = e.text;

  cache.set(key, record);
  return record;
}
