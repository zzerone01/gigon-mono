/**
 * GigOn brand-asset generator.
 *
 * Single source of truth for every raster brand asset in the monorepo.
 * The artwork is the power mark from apps/web/public/logo-mark.svg
 * (96×96 viewBox), recomposed per target:
 *
 *   tile        — rounded Royal tile + white glyph (favicons, PWA icons, splash)
 *   full-bleed  — Royal square, no corner radius (iOS masks its own shape)
 *   safe-zone   — glyph alone, sized for Android adaptive/monochrome safe areas
 *
 * Run from anywhere:  node docs/brand/assets/build.mjs
 * OG images (HTML sources in this directory) are rendered too when headless
 * Chrome is available — see README.md for the manual fallback.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../..");

const ROYAL = "#103F96";
const WHITE = "#ffffff";

/* ------------------------------------------------------------------ */
/* Artwork (96×96 design space, from apps/web/public/logo-mark.svg)    */
/* ------------------------------------------------------------------ */

const glyph96 = (color) =>
  `<g transform="translate(15 15)" stroke="${color}" stroke-width="7" stroke-linecap="round" fill="none">` +
  `<path d="M48 19.8 A21 21 0 1 1 18 19.8"/>` +
  `<line x1="33" y1="33" x2="33" y2="12.6"/>` +
  `</g>`;

/** Center the 96×96 design box on a canvas, scaled to `boxScale` of it. */
const place96 = (size, boxScale, inner) => {
  const s = (size * boxScale) / 96;
  const off = (size - 96 * s) / 2;
  return `<g transform="translate(${off} ${off}) scale(${s})">${inner}</g>`;
};

const svg = (size, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">${inner}</svg>`;

/** Rounded tile (25% radius) + glyph — the standard mark. */
const tileSvg = (size, { bg = ROYAL, fg = WHITE } = {}) =>
  svg(
    size,
    `<rect width="${size}" height="${size}" rx="${size * 0.25}" fill="${bg}"/>` +
      place96(size, 1, glyph96(fg)),
  );

/** Full-bleed square — for iOS/apple icons where the OS applies the mask. */
const fullBleedSvg = (size, boxScale = 0.92) =>
  svg(
    size,
    `<rect width="${size}" height="${size}" fill="${ROYAL}"/>` +
      place96(size, boxScale, glyph96(WHITE)),
  );

/** Glyph only on transparent — adaptive foreground / monochrome / notification. */
const glyphOnlySvg = (size, boxScale, color = WHITE) =>
  svg(size, place96(size, boxScale, glyph96(color)));

/** Solid Royal square — adaptive background layer. */
const solidSvg = (size) =>
  svg(size, `<rect width="${size}" height="${size}" fill="${ROYAL}"/>`);

/* ------------------------------------------------------------------ */
/* Outputs                                                             */
/* ------------------------------------------------------------------ */

const MASTERS = {
  "mark.svg": tileSvg(512),
  "mark-inverse.svg": tileSvg(512, { bg: WHITE, fg: ROYAL }),
  "glyph-royal.svg": glyphOnlySvg(512, 1, ROYAL),
  "glyph-white.svg": glyphOnlySvg(512, 1, WHITE),
};

const PNGS = [
  // apps/mobile — Expo icon set (see apps/mobile/app.json)
  // removeAlpha: App Store rejects icons with an alpha channel (ITMS-90717).
  ["apps/mobile/assets/icon.png", fullBleedSvg(1024), { removeAlpha: true }],
  // Android adaptive: safe zone is the centre 66/108dp (~61%) — keep the
  // glyph at ~45% of the canvas so nothing clips on circular masks.
  ["apps/mobile/assets/android-icon-foreground.png", glyphOnlySvg(1024, 0.65)],
  ["apps/mobile/assets/android-icon-background.png", solidSvg(1024)],
  // Also the expo-notifications small icon (must be white-on-transparent).
  ["apps/mobile/assets/android-icon-monochrome.png", glyphOnlySvg(1024, 0.65)],
  ["apps/mobile/assets/splash-icon.png", tileSvg(512)],
  ["apps/mobile/assets/favicon.png", tileSvg(48)],

  // apps/app (app.gigon.io) — Next.js file conventions + PWA manifest icons
  ["apps/app/app/apple-icon.png", fullBleedSvg(180)],
  ["apps/app/public/icon-192.png", tileSvg(192)],
  ["apps/app/public/icon-512.png", tileSvg(512)],
  // Maskable: keep the glyph inside the centre 80% circle.
  ["apps/app/public/icon-maskable-512.png", fullBleedSvg(512, 0.78)],

  // apps/web (gigon.io landing) — was missing an apple-touch-icon
  ["apps/web/app/apple-icon.png", fullBleedSvg(180)],

  // Google Play store listing icon (512×512, full-bleed; Play applies the mask)
  ["docs/brand/assets/play-store/icon-512.png", fullBleedSvg(512)],
];

/** OG/Twitter cards: HTML source in this dir → 2× Chrome shot → Lanczos ↓. */
const OG = [
  {
    html: "og-app.html",
    width: 1200,
    height: 630,
    out: [
      "apps/app/app/opengraph-image.png",
      "apps/app/app/twitter-image.png",
    ],
  },
];

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const write = (rel, content) => {
  const abs = join(ROOT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  console.log("  wrote", rel);
};

console.log("Masters → docs/brand/assets/");
for (const [name, content] of Object.entries(MASTERS)) {
  write(join("docs/brand/assets", name), content);
}

console.log("PNGs");
for (const [rel, svgSource, opts] of PNGS) {
  const abs = join(ROOT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  let img = sharp(Buffer.from(svgSource));
  if (opts?.removeAlpha) img = img.removeAlpha();
  await img.png().toFile(abs);
  console.log("  wrote", rel);
}

if (existsSync(CHROME)) {
  console.log("OG images (headless Chrome)");
  for (const { html, width, height, out } of OG) {
    const shot = join(HERE, `.${html}.2x.png`);
    execFileSync(CHROME, [
      "--headless=new",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      `--window-size=${width},${height}`,
      "--virtual-time-budget=9000",
      `--screenshot=${shot}`,
      `file://${join(HERE, html)}`,
    ]);
    const resized = await sharp(shot)
      .resize(width, height, { kernel: "lanczos3" })
      .png()
      .toBuffer();
    for (const rel of out) {
      const abs = join(ROOT, rel);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, resized);
      console.log("  wrote", rel);
    }
    execFileSync("rm", ["-f", shot]);
  }
} else {
  console.warn("Chrome not found — skipped OG images (see README.md).");
}

console.log("Done.");
