export type MatchFactor = {
  label: string;
  /** 0-100 alignment for this factor */
  value: number;
};

export type NeighborhoodMatch = {
  id: string;
  familiar: string; // neighborhood the user knows (e.g. St. Louis)
  actual: string; // real neighborhood in destination city (e.g. Denver)
  score: number; // out of 100
  explanation: string;
  factors: MatchFactor[];
  /** real-world location of the destination neighborhood */
  coords: { lat: number; lng: number };
  /** accent color for the blob/card */
  color: string;
};

export const DESTINATION_CITY = "Denver, CO";
export const ORIGIN_CITY = "St. Louis, MO";

export const matches: NeighborhoodMatch[] = [
  {
    id: "kirkwood",
    familiar: "Kirkwood",
    actual: "Wheat Ridge",
    score: 87,
    explanation:
      "Leafy, family-first suburb with a walkable historic downtown, weekend farmers markets, and quick access to bigger-city amenities — Kirkwood energy, Denver zip code.",
    factors: [
      { label: "Walkability", value: 78 },
      { label: "Amenities", value: 82 },
      { label: "Schools", value: 90 },
      { label: "Nightlife", value: 55 },
      { label: "Outdoors", value: 88 },
    ],
    coords: { lat: 39.7665, lng: -105.0772 },
    color: "#6C3CF0",
  },
  {
    id: "clayton",
    familiar: "Clayton",
    actual: "Cherry Creek",
    score: 84,
    explanation:
      "Upscale, polished, and business-forward with designer shopping and fine dining. The address-you-brag-about feel of Clayton, mapped to Denver's most refined district.",
    factors: [
      { label: "Walkability", value: 84 },
      { label: "Amenities", value: 95 },
      { label: "Schools", value: 80 },
      { label: "Nightlife", value: 72 },
      { label: "Outdoors", value: 70 },
    ],
    coords: { lat: 39.7169, lng: -104.9525 },
    color: "#4E2BBF",
  },
  {
    id: "cwe",
    familiar: "Central West End",
    actual: "LoDo",
    score: 82,
    explanation:
      "Dense, historic, and buzzing after dark — sidewalk cafes, rooftop bars, and gallery walks. Central West End's urban-elegant vibe lands squarely in Lower Downtown.",
    factors: [
      { label: "Walkability", value: 92 },
      { label: "Amenities", value: 88 },
      { label: "Schools", value: 62 },
      { label: "Nightlife", value: 90 },
      { label: "Outdoors", value: 58 },
    ],
    coords: { lat: 39.7530, lng: -104.9986 },
    color: "#2FBF71",
  },
  {
    id: "webster",
    familiar: "Webster Groves",
    actual: "Littleton",
    score: 79,
    explanation:
      "Tight-knit, tree-lined, and proudly local with a charming Main Street and standout schools. Webster Groves' small-town-in-a-big-metro charm shows up in Littleton.",
    factors: [
      { label: "Walkability", value: 70 },
      { label: "Amenities", value: 74 },
      { label: "Schools", value: 92 },
      { label: "Nightlife", value: 48 },
      { label: "Outdoors", value: 80 },
    ],
    coords: { lat: 39.6133, lng: -105.0178 },
    color: "#9B7BF5",
  },
  {
    id: "soulard",
    familiar: "Soulard",
    actual: "RiNo",
    score: 76,
    explanation:
      "Brick warehouses turned breweries, murals on every corner, and a music-and-market scene that never sits still. Soulard's gritty-creative spirit reborn as River North Art District.",
    factors: [
      { label: "Walkability", value: 80 },
      { label: "Amenities", value: 78 },
      { label: "Schools", value: 55 },
      { label: "Nightlife", value: 94 },
      { label: "Outdoors", value: 62 },
    ],
    coords: { lat: 39.7686, lng: -104.9805 },
    color: "#F0A93C",
  },
];

// --- Personalized scoring ------------------------------------------------

export type Preference = { name: string; importance: number };

export type ScoredMatch = NeighborhoodMatch & {
  /** score recomputed from this user's weighted priorities (0-100) */
  personalizedScore: number;
  /** whether the user's priorities actually influenced the score */
  personalized: boolean;
};

// The factors we have data for, and the words a user might type to mean each.
const FACTOR_KEYWORDS: Record<string, string[]> = {
  Walkability: ["walk", "transit", "transport", "commute", "bike"],
  Amenities: ["amenit", "shop", "dining", "restaurant", "food", "grocery", "cafe", "coffee"],
  Schools: ["school", "education", "kids", "famil"],
  Nightlife: ["nightlife", "bar", "club", "music", "drink", "live"],
  Outdoors: ["outdoor", "nature", "park", "hike", "trail", "green", "mountain"],
};

/** Map a free-text preference name to one of our known factors, or null. */
export function preferenceToFactor(name: string): string | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  // exact label match first (e.g. "Schools" -> Schools)
  for (const factor of Object.keys(FACTOR_KEYWORDS)) {
    if (factor.toLowerCase() === n) return factor;
  }
  // otherwise keyword/substring match (e.g. "Hiking" -> Outdoors)
  for (const [factor, keywords] of Object.entries(FACTOR_KEYWORDS)) {
    if (keywords.some((k) => n.includes(k))) return factor;
  }
  return null;
}

/**
 * Re-score every match against the user's weighted priorities and return them
 * sorted best-first. A neighborhood's personalized score is the weighted
 * average of its factor values, using each priority's importance (1-4) as the
 * weight. If no priorities map to known factors, the curated base score is used.
 */
export function rankMatches(preferences: Preference[]): ScoredMatch[] {
  const weights = new Map<string, number>();
  for (const p of preferences) {
    const factor = preferenceToFactor(p.name);
    if (factor && p.importance > 0) {
      weights.set(factor, (weights.get(factor) ?? 0) + p.importance);
    }
  }

  const hasWeights = weights.size > 0;

  const scored: ScoredMatch[] = matches.map((m) => {
    if (!hasWeights) {
      return { ...m, personalizedScore: m.score, personalized: false };
    }
    let weightedSum = 0;
    let totalWeight = 0;
    for (const f of m.factors) {
      const w = weights.get(f.label);
      if (w) {
        weightedSum += f.value * w;
        totalWeight += w;
      }
    }
    const personalizedScore =
      totalWeight > 0 ? Math.round(weightedSum / totalWeight) : m.score;
    return { ...m, personalizedScore, personalized: true };
  });

  return scored.sort((a, b) => b.personalizedScore - a.personalizedScore);
}
