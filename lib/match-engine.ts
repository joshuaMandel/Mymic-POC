import {
  neighborhoodsInCity,
  cityMeta,
  cityNames,
  FACTORS,
  type FactorKey,
  type Attrs,
} from "./neighborhoods";
import {
  preferenceToFactor,
  type Preference,
  type ScoredMatch,
  type MatchFactor,
} from "./data";

const PALETTE = ["#6C3CF0", "#4E2BBF", "#2FBF71", "#9B7BF5", "#F0A93C", "#3CA6F0"];

export type ResolveResult = {
  from: string;
  to: string;
  neighborhood: string;
  center: { lat: number; lng: number };
  zoom: number;
  matches: ScoredMatch[];
  /** true only when both cities have real neighborhood data (else it's a preview) */
  supported: boolean;
};

// Importance weight per factor, summed across the user's priorities.
function buildWeights(
  preferences: Preference[]
): { weights: Record<FactorKey, number>; hasWeights: boolean } {
  const weights = {} as Record<FactorKey, number>;
  for (const f of FACTORS) weights[f] = 0;
  let hasWeights = false;
  for (const p of preferences) {
    const f = preferenceToFactor(p.name);
    if (f && p.importance > 0) {
      weights[f] += p.importance;
      hasWeights = true;
    }
  }
  return { weights, hasWeights };
}

// How well a neighborhood scores on the things the user cares about (0-100).
// Weighted average of its own attribute values.
function priorityScore(
  attrs: Attrs,
  weights: Record<FactorKey, number>
): number {
  let sum = 0;
  let total = 0;
  for (const f of FACTORS) {
    if (weights[f] > 0) {
      sum += attrs[f] * weights[f];
      total += weights[f];
    }
  }
  return total > 0 ? sum / total : 0;
}

// Overall attribute average — the base "match strength" before personalization.
function baseScore(attrs: Attrs): number {
  let sum = 0;
  for (const f of FACTORS) sum += attrs[f];
  return sum / FACTORS.length;
}

// Plain (unweighted) vector similarity, 0-100 — used to pick the closest
// "familiar" origin neighborhood for a given destination neighborhood.
function similarity(x: Attrs, y: Attrs): number {
  let dsq = 0;
  for (const f of FACTORS) {
    const diff = x[f] - y[f];
    dsq += diff * diff;
  }
  const max = Math.sqrt(FACTORS.length * 100 * 100);
  return 100 * (1 - Math.sqrt(dsq) / max);
}

function templateExplanation(
  familiar: string,
  actual: string,
  destCity: string,
  factors: MatchFactor[]
): string {
  const top = [...factors].sort((a, b) => b.value - a.value)[0];
  const city = destCity.split(",")[0];
  return `${actual} is ${city}'s closest match to ${familiar} — strongest on ${top.label.toLowerCase()}, with a comparable everyday feel.`;
}

/**
 * The real matching engine: given an origin city + destination city + the user's
 * home neighborhood + weighted priorities, rank the destination's neighborhoods
 * by weighted similarity and label each with its closest "familiar" equivalent
 * from the origin city. Works for any pair of cities present in the dataset.
 */
export function resolveMatches(
  fromInput?: string | null,
  toInput?: string | null,
  neighborhoodInput?: string | null,
  preferences: Preference[] = []
): ResolveResult {
  // With no hand-curated fallback dataset, guard the (deploy-time) case where
  // no data has been ingested yet: render an empty, clearly-unsupported result.
  if (cityNames.length === 0) {
    return {
      from: fromInput?.trim() ?? "",
      to: toInput?.trim() ?? "",
      neighborhood: neighborhoodInput ?? "",
      center: { lat: 39.5, lng: -98.35 },
      zoom: 4,
      matches: [],
      supported: false,
    };
  }

  // The cities the user typed (may be any US city).
  const fromTyped = (fromInput && fromInput.trim()) || cityNames[0];
  const toTyped =
    (toInput && toInput.trim()) ||
    cityNames.find((c) => c !== fromTyped) ||
    cityNames[0];
  const supported =
    cityNames.includes(fromTyped) && cityNames.includes(toTyped);

  // The cities we actually compute against — fall back to ingested cities so an
  // unsupported pick still shows a plausible preview instead of an empty page.
  const from = cityNames.includes(fromTyped) ? fromTyped : cityNames[0];
  let to = cityNames.includes(toTyped)
    ? toTyped
    : cityNames.find((c) => c !== from) ?? cityNames[0];
  if (to === from) to = cityNames.find((c) => c !== from) ?? to;

  const origins = neighborhoodsInCity(from);
  const dests = neighborhoodsInCity(to);
  const home =
    origins.find((o) => o.name === neighborhoodInput) ?? origins[0];
  const neighborhood = home ? home.name : neighborhoodInput ?? "";

  const { weights, hasWeights } = buildWeights(preferences);

  const scored = dests.map((d) => {
    const base = baseScore(d.attrs);
    // "Familiar" label = the origin neighborhood whose vector is closest.
    let best = origins[0];
    let bestSim = -1;
    for (const o of origins) {
      const s = similarity(d.attrs, o.attrs);
      if (s > bestSim) {
        bestSim = s;
        best = o;
      }
    }
    // Personalized rank = how well this neighborhood scores on what the user
    // cares about (weighted average of its own attributes).
    const personalizedScore = hasWeights
      ? priorityScore(d.attrs, weights)
      : base;
    return { d, best, base, personalizedScore };
  });

  scored.sort((x, y) => y.personalizedScore - x.personalizedScore);

  const matches: ScoredMatch[] = scored.slice(0, 6).map((s, i) => {
    const factors: MatchFactor[] = FACTORS.map((f) => ({
      label: f,
      value: s.d.attrs[f],
    }));
    return {
      id: s.d.id,
      familiar: s.best.name,
      actual: s.d.name,
      score: Math.round(s.base),
      personalizedScore: Math.round(s.personalizedScore),
      personalized: hasWeights,
      explanation: templateExplanation(s.best.name, s.d.name, to, factors),
      factors,
      coords: s.d.coords,
      color: PALETTE[i % PALETTE.length],
    };
  });

  const meta = cityMeta(to);
  return {
    from: fromTyped,
    to: toTyped,
    neighborhood,
    center: meta.center,
    zoom: meta.zoom,
    matches,
    supported,
  };
}
