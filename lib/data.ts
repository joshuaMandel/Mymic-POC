// Shared types + the preference→factor mapping. The neighborhood dataset lives
// in ./neighborhoods and the matching algorithm in ./match-engine.
import { FACTORS, type FactorKey } from "./neighborhoods";

export { FACTORS };
export type { FactorKey };

export type MatchFactor = {
  label: string;
  /** 0-100 alignment for this factor */
  value: number;
};

export type NeighborhoodMatch = {
  id: string;
  familiar: string; // neighborhood the user knows (origin city)
  actual: string; // real neighborhood in destination city
  score: number; // base similarity, out of 100
  explanation: string;
  factors: MatchFactor[];
  coords: { lat: number; lng: number };
  color: string;
};

export type Preference = { name: string; importance: number };

export type ScoredMatch = NeighborhoodMatch & {
  /** similarity recomputed from the user's weighted priorities (0-100) */
  personalizedScore: number;
  /** whether the user's priorities influenced the score */
  personalized: boolean;
};

// Words a user might type mapped to one of our known factors.
const FACTOR_KEYWORDS: Record<FactorKey, string[]> = {
  Walkability: ["walk", "transit", "transport", "commute", "bike"],
  Amenities: ["amenit", "shop", "dining", "restaurant", "food", "grocery", "cafe", "coffee"],
  Schools: ["school", "education", "kids", "famil"],
  Nightlife: ["nightlife", "bar", "club", "music", "drink", "live"],
  Outdoors: ["outdoor", "nature", "park", "hike", "trail", "green", "mountain"],
};

/** Map a free-text preference name to one of our known factors, or null. */
export function preferenceToFactor(name: string): FactorKey | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  for (const factor of FACTORS) {
    if (factor.toLowerCase() === n) return factor;
  }
  for (const factor of FACTORS) {
    if (FACTOR_KEYWORDS[factor].some((k) => n.includes(k))) return factor;
  }
  return null;
}
