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

## Mock matches

| You know (St. Louis) | Feels like (Denver) | Score |
| -------------------- | ------------------- | ----- |
| Kirkwood             | Wheat Ridge         | 87    |
| Clayton              | Cherry Creek        | 84    |
| Central West End     | LoDo                | 82    |
| Webster Groves       | Littleton           | 79    |
| Soulard              | RiNo                | 76    |

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
