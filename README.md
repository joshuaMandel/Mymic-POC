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

## Supported city pairs

The `/match` city fields are pickers, and the pair you choose drives a
different set of matches and a different map. Three demo pairs ship in
`lib/data.ts` (`cityPairs`):

- **St. Louis, MO → Denver, CO** (e.g. Kirkwood → Wheat Ridge, 87)
- **Chicago, IL → Austin, TX** (e.g. Wicker Park → East Austin, 86)
- **San Francisco, CA → Seattle, WA** (e.g. The Mission → Capitol Hill, 85)

Adding another pair is just another entry in the `cityPairs` array.

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
