export type MatchFactor = {
  label: string;
  /** 0-100 alignment for this factor */
  value: number;
};

export type NeighborhoodMatch = {
  id: string;
  familiar: string; // neighborhood the user knows (origin city)
  actual: string; // real neighborhood in destination city
  score: number; // out of 100
  explanation: string;
  factors: MatchFactor[];
  /** real-world location of the destination neighborhood */
  coords: { lat: number; lng: number };
  /** accent color for the marker/card */
  color: string;
};

export type CityPair = {
  id: string;
  origin: string; // "St. Louis, MO"
  destination: string; // "Denver, CO"
  /** initial map center for the destination city */
  center: { lat: number; lng: number };
  zoom: number;
  matches: NeighborhoodMatch[];
};

const PALETTE = ["#6C3CF0", "#4E2BBF", "#2FBF71", "#9B7BF5", "#F0A93C"];

export const cityPairs: CityPair[] = [
  {
    id: "stl-den",
    origin: "St. Louis, MO",
    destination: "Denver, CO",
    center: { lat: 39.7392, lng: -104.9903 },
    zoom: 11,
    matches: [
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
        color: PALETTE[0],
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
        color: PALETTE[1],
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
        coords: { lat: 39.753, lng: -104.9986 },
        color: PALETTE[2],
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
        color: PALETTE[3],
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
        color: PALETTE[4],
      },
    ],
  },
  {
    id: "chi-aus",
    origin: "Chicago, IL",
    destination: "Austin, TX",
    center: { lat: 30.2672, lng: -97.7431 },
    zoom: 12,
    matches: [
      {
        id: "wicker-park",
        familiar: "Wicker Park",
        actual: "East Austin",
        score: 86,
        explanation:
          "Muralled streets, indie venues, vintage shops, and a bar on every corner. Wicker Park's artsy, late-night energy reborn just east of I-35.",
        factors: [
          { label: "Walkability", value: 85 },
          { label: "Amenities", value: 84 },
          { label: "Schools", value: 58 },
          { label: "Nightlife", value: 92 },
          { label: "Outdoors", value: 60 },
        ],
        coords: { lat: 30.264, lng: -97.723 },
        color: PALETTE[0],
      },
      {
        id: "lincoln-park",
        familiar: "Lincoln Park",
        actual: "Tarrytown",
        score: 83,
        explanation:
          "Leafy, affluent, and water-adjacent with top schools and big trees. Lincoln Park's polished family feel maps to Tarrytown along Lake Austin.",
        factors: [
          { label: "Walkability", value: 72 },
          { label: "Amenities", value: 80 },
          { label: "Schools", value: 90 },
          { label: "Nightlife", value: 50 },
          { label: "Outdoors", value: 86 },
        ],
        coords: { lat: 30.296, lng: -97.776 },
        color: PALETTE[1],
      },
      {
        id: "the-loop",
        familiar: "The Loop",
        actual: "Downtown Austin",
        score: 80,
        explanation:
          "Glassy high-rises, business by day, rooftop bars by night. The dense, walk-everywhere core of the Loop lands in downtown Austin.",
        factors: [
          { label: "Walkability", value: 95 },
          { label: "Amenities", value: 90 },
          { label: "Schools", value: 55 },
          { label: "Nightlife", value: 82 },
          { label: "Outdoors", value: 52 },
        ],
        coords: { lat: 30.2672, lng: -97.7431 },
        color: PALETTE[2],
      },
      {
        id: "hyde-park-chi",
        familiar: "Hyde Park",
        actual: "Hyde Park (Austin)",
        score: 84,
        explanation:
          "Historic bungalows, a university-town hum, and a tight-knit community. Same name, same soul — Chicago's Hyde Park to Austin's.",
        factors: [
          { label: "Walkability", value: 78 },
          { label: "Amenities", value: 72 },
          { label: "Schools", value: 80 },
          { label: "Nightlife", value: 55 },
          { label: "Outdoors", value: 70 },
        ],
        coords: { lat: 30.305, lng: -97.728 },
        color: PALETTE[3],
      },
      {
        id: "lakeview",
        familiar: "Lakeview",
        actual: "South Congress",
        score: 79,
        explanation:
          "Buzzy shopping strips, boutiques, and a young, social crowd. Lakeview's lively neighborhood-y feel fits Austin's South Congress (SoCo).",
        factors: [
          { label: "Walkability", value: 88 },
          { label: "Amenities", value: 86 },
          { label: "Schools", value: 62 },
          { label: "Nightlife", value: 84 },
          { label: "Outdoors", value: 64 },
        ],
        coords: { lat: 30.248, lng: -97.751 },
        color: PALETTE[4],
      },
    ],
  },
  {
    id: "sf-sea",
    origin: "San Francisco, CA",
    destination: "Seattle, WA",
    center: { lat: 47.6205, lng: -122.3493 },
    zoom: 12,
    matches: [
      {
        id: "mission",
        familiar: "The Mission",
        actual: "Capitol Hill",
        score: 85,
        explanation:
          "Murals, taquerias-turned-cocktail-bars, and nightlife that spills onto the sidewalks. The Mission's vibrant grit translates to Capitol Hill.",
        factors: [
          { label: "Walkability", value: 92 },
          { label: "Amenities", value: 88 },
          { label: "Schools", value: 56 },
          { label: "Nightlife", value: 90 },
          { label: "Outdoors", value: 58 },
        ],
        coords: { lat: 47.623, lng: -122.312 },
        color: PALETTE[0],
      },
      {
        id: "pac-heights",
        familiar: "Pacific Heights",
        actual: "Queen Anne",
        score: 83,
        explanation:
          "Hilltop homes, skyline-and-water views, and quiet prestige. Pacific Heights' refined elevation maps to Queen Anne.",
        factors: [
          { label: "Walkability", value: 80 },
          { label: "Amenities", value: 82 },
          { label: "Schools", value: 84 },
          { label: "Nightlife", value: 52 },
          { label: "Outdoors", value: 66 },
        ],
        coords: { lat: 47.637, lng: -122.357 },
        color: PALETTE[1],
      },
      {
        id: "hayes-valley",
        familiar: "Hayes Valley",
        actual: "Ballard",
        score: 81,
        explanation:
          "Boutiques, breweries, and a design-forward, foodie streetlife. Hayes Valley's trendy-but-livable vibe shows up in Ballard.",
        factors: [
          { label: "Walkability", value: 86 },
          { label: "Amenities", value: 85 },
          { label: "Schools", value: 60 },
          { label: "Nightlife", value: 78 },
          { label: "Outdoors", value: 62 },
        ],
        coords: { lat: 47.668, lng: -122.384 },
        color: PALETTE[2],
      },
      {
        id: "sunset",
        familiar: "Sunset District",
        actual: "West Seattle",
        score: 78,
        explanation:
          "Foggy, residential, and beach-adjacent with a slower pace. The Sunset's laid-back coastal feel maps to West Seattle and Alki Beach.",
        factors: [
          { label: "Walkability", value: 68 },
          { label: "Amenities", value: 66 },
          { label: "Schools", value: 78 },
          { label: "Nightlife", value: 44 },
          { label: "Outdoors", value: 82 },
        ],
        coords: { lat: 47.576, lng: -122.409 },
        color: PALETTE[3],
      },
      {
        id: "soma",
        familiar: "SoMa",
        actual: "South Lake Union",
        score: 80,
        explanation:
          "Tech campuses, new glass towers, and lunchtime scooters. SoMa's modern, work-forward density becomes South Lake Union.",
        factors: [
          { label: "Walkability", value: 84 },
          { label: "Amenities", value: 80 },
          { label: "Schools", value: 50 },
          { label: "Nightlife", value: 70 },
          { label: "Outdoors", value: 54 },
        ],
        coords: { lat: 47.627, lng: -122.337 },
        color: PALETTE[4],
      },
    ],
  },
];

export const defaultCityPair = cityPairs[0];

/** Find the supported pair for a given origin/destination, or fall back. */
export function getCityPair(
  origin?: string | null,
  destination?: string | null
): CityPair {
  return (
    cityPairs.find(
      (p) =>
        (origin == null || p.origin === origin) &&
        (destination == null || p.destination === destination)
    ) ?? defaultCityPair
  );
}

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
 * Re-score a city pair's matches against the user's weighted priorities and
 * return them sorted best-first. A neighborhood's personalized score is the
 * weighted average of its factor values, using each priority's importance
 * (1-4) as the weight. If no priorities map to known factors, the curated
 * base score is used.
 */
export function rankMatches(
  matchList: NeighborhoodMatch[],
  preferences: Preference[]
): ScoredMatch[] {
  const weights = new Map<string, number>();
  for (const p of preferences) {
    const factor = preferenceToFactor(p.name);
    if (factor && p.importance > 0) {
      weights.set(factor, (weights.get(factor) ?? 0) + p.importance);
    }
  }

  const hasWeights = weights.size > 0;

  const scored: ScoredMatch[] = matchList.map((m) => {
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
