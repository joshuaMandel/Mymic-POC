# MyMik

> Find where your life fits in a new city.

MyMik is a proof-of-concept that helps people relocating understand a new city by
mapping the neighborhoods they already know onto similar neighborhoods in their
destination city. The demo translates **St. Louis → Denver** using mock data.

## What's inside

- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS** for styling (brand palette baked into `tailwind.config.ts`)
- **react-leaflet + OpenStreetMap/CARTO tiles** for a real interactive map (no API key)
- **Mock data only** — no backend or external APIs

### Pages

| Route       | Purpose                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| `/`         | Landing page — hero, how-it-works, and a sample `Kirkwood → Wheat Ridge` card |
| `/match`    | Input form — current/destination city, neighborhood, and 4 weighted preference metrics |
| `/results`  | Sidebar of inputs, a real Leaflet map with labeled neighborhood pins, and a detail panel |

The match form passes inputs to `/results` via URL query params, so the results
page reflects what you typed. The importance dials genuinely re-score and
re-rank the matches (see `rankMatches` in `lib/data.ts`), and each match is
plotted at its real Denver coordinates on the map. The map tiles load from a
public CDN, so the map needs an internet connection to render.

## Matching engine & cities

Matching is a real **vector-based similarity engine** (`lib/match-engine.ts`), not
hand-authored pairs. Every neighborhood is a normalized attribute vector
(Walkability, Amenities, Schools, Nightlife, Outdoors) in `lib/neighborhoods.ts`.
Given an origin city, destination city, home neighborhood, and weighted priorities,
the engine:

- ranks the destination's neighborhoods by how well they score on **what you care
  about** (weighted average of their attributes — so the priority sliders steer the
  results), and
- labels each with its closest **familiar** equivalent from your origin city
  (nearest attribute vector).

**Any city in the dataset can be an origin *or* a destination** — the `/match`
pickers list them all. Seeded cities: St. Louis, Chicago, San Francisco, Denver,
Austin, Seattle (5 neighborhoods each, both directions).

### Scaling to real US cities

`scripts/build-neighborhoods.mjs` ingests real **US Census (ACS)** data into the
same `Neighborhood` schema so the engine can cover real cities nationwide:

```bash
# 1. free Census key: https://api.census.gov/data/key_signup.html
export CENSUS_API_KEY=xxxx
# 2. edit scripts/metros.json with the metros + ZIPs you want
# 3. run it (Node 18+, needs network)
node scripts/build-neighborhoods.mjs   # → data/neighborhoods.generated.json
```

The script is an honest **starter**: ACS supplies demographics/cost/education
directly; walkability, amenities, nightlife, and outdoors are approximated and
marked `TODO` in `toFactors()` — the one place to plug in richer free sources (EPA
National Walkability Index, OpenStreetMap POI counts, NCES school data). Merge the
generated JSON into `lib/neighborhoods.ts` to use it. See the file header for the
full pipeline and limits.

## Backend API

There's a real backend route handler at **`POST /api/match`** (`app/api/match/route.ts`).
It runs the matching engine server-side (`resolveMatches` from `lib/match-engine.ts`)
and, when an Anthropic API key is configured, generates each match's
"why it matches" explanation live with **Claude Haiku 4.5** (`lib/explain.ts`). The
`/results` page calls this route; if it's unreachable it falls back to computing locally,
so the page never breaks.

**Request/response:**

```jsonc
// POST /api/match
{ "from": "St. Louis, MO", "to": "Denver, CO", "neighborhood": "Kirkwood",
  "preferences": [{ "name": "Outdoors", "importance": 4 }] }

// → 200
{ "from": "...", "to": "...", "neighborhood": "...",
  "center": { "lat": 39.73, "lng": -104.99 }, "zoom": 11,
  "matches": [ /* ScoredMatch[] */ ], "aiGenerated": true }
```

### Enabling AI explanations

The app works with **no key** (templated explanations, `aiGenerated: false`). To turn on
Claude-generated explanations:

1. **Create a key:** [platform.claude.com](https://platform.claude.com) → **API keys** → **Create key** (`sk-ant-…`).
2. **Local:** copy `.env.local.example` to `.env.local` and set `ANTHROPIC_API_KEY=sk-ant-…`, then restart `npm run dev`.
3. **Vercel (production):** Project → **Settings → Environment Variables** → add `ANTHROPIC_API_KEY` for Production (and Preview) → redeploy.

The key is read server-side only in the route handler — it is never shipped to the browser.
Haiku 4.5 is ~$1/$5 per million tokens; one batched call per search costs a fraction of a cent.

## Run it locally

Requires **Node.js 18.18+** (or 20+).

```bash
# 1. install dependencies
npm install

# 2. start the dev server
npm run dev

# 3. open the app
# http://localhost:3000
```

### Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # next lint
```

## Visual QA (screenshots)

`npm run shots` captures the landing, match, and results pages at desktop
(1440×900) and mobile (390×844) widths and writes PNGs to `./screenshots`
(git-ignored). Useful for reviewing the UI — including for an agent that can
read the images.

```bash
# one-time: download the headless browser
npx playwright install chromium

# with the dev server running (npm run dev), in another terminal:
npm run shots

# or point it at any deploy:
BASE_URL=https://mymic-poc.vercel.app npm run shots
```

## Project structure

```
app/
  layout.tsx        # root layout, Inter font, global styles
  globals.css       # Tailwind layers + reusable .card / .btn-gradient
  page.tsx          # landing page
  match/page.tsx    # input form (client component)
  results/page.tsx  # results: sidebar + map + detail panel (client component)
components/
  Logo.tsx          # shared brand logo
lib/
  data.ts           # mock neighborhood match data
tailwind.config.ts  # brand colors, shadows, gradient
```

> This is a demo. Matches are illustrative and not based on real neighborhood data.
