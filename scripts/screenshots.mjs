// Visual QA: capture screenshots of key pages at desktop + mobile widths.
//
// Usage:
//   npm run dev            # in one terminal (or point BASE_URL at a deploy)
//   npm run shots          # in another — writes PNGs to ./screenshots
//
// Override the target with BASE_URL, e.g.:
//   BASE_URL=https://mymic-poc.vercel.app npm run shots
//
// Requires the Chromium binary: `npx playwright install chromium`.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = "screenshots";

const resultsQuery =
  "?from=" +
  encodeURIComponent("St. Louis, MO") +
  "&to=" +
  encodeURIComponent("Denver, CO") +
  "&neighborhood=Kirkwood" +
  "&metrics=" +
  encodeURIComponent("Nightlife:2,Outdoors:4,Schools:3,Churches/Temples:2");

const pages = [
  { name: "landing", path: "/" },
  { name: "match", path: "/match" },
  { name: "results", path: "/results" + resultsQuery, waitFor: ".leaflet-container" },
];

const viewports = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 },
];

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    for (const p of pages) {
      const page = await context.newPage();
      const url = BASE_URL + p.path;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      if (p.waitFor) {
        await page
          .waitForSelector(p.waitFor, { timeout: 10000 })
          .catch(() => console.warn(`  (selector ${p.waitFor} not found)`));
        // give map tiles a moment to paint
        await page.waitForTimeout(2500);
      }
      const file = `${OUT_DIR}/${p.name}-${vp.label}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log(`✓ ${file}  <-  ${url}`);
      await page.close();
    }
    await context.close();
  }

  await browser.close();
  console.log(`\nDone. Screenshots written to ./${OUT_DIR}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
