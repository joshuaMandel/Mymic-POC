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
  /** position of the blob on the stylized map, in percentages */
  position: { top: number; left: number };
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
    position: { top: 28, left: 22 },
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
    position: { top: 52, left: 38 },
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
    position: { top: 40, left: 60 },
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
    position: { top: 70, left: 26 },
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
    position: { top: 66, left: 64 },
    color: "#F0A93C",
  },
];
