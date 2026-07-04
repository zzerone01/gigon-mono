/**
 * App Store (iOS) screenshot generator.
 *
 * Recomposes the raw app captures in ./play-store/ (1080×2400 — wrong aspect
 * for any iPhone) into framed marketing screenshots at the iPhone 6.9" size
 * (1320×2868). App Store Connect scales 6.9" down for every smaller iPhone,
 * so this one set covers all devices (iPad not needed — supportsTablet is off).
 *
 * Same pipeline as the OG step in build.mjs: HTML → headless Chrome at 2×
 * (window 660×1434) → sharp resize to exactly 1320×2868, alpha stripped
 * (Apple rejects screenshots with an alpha channel).
 *
 * Run from anywhere:  node docs/brand/assets/app-store.mjs
 * Needs headless Chrome (macOS app path) + network for Google Fonts.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "app-store");
const W = 1320; // iPhone 6.9" portrait
const H = 2868;

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) {
  console.error("Chrome not found at", CHROME, "— cannot render.");
  process.exit(1);
}

/** capture = relative to this dir; headline `[on]…[/on]` = amber accent. */
const SLIDES = [
  {
    out: "01-worker-feed.png",
    capture: "play-store/01-worker-feed.png",
    headline: "Your gig is [on]on.[/on]",
    sub: "Cash gigs near you — <b>1–3 hours</b>, a short walk away.",
  },
  {
    out: "02-gig-detail.png",
    capture: "play-store/02-gig-detail.png",
    headline: "Everything up front",
    sub: "Pay, time and distance before you apply — then it's <b>1 tap</b>.",
  },
  {
    out: "03-worker-map.png",
    capture: "play-store/03-worker-map.png",
    headline: "Map-first, [on]walkable[/on]",
    sub: "See who's hiring within <b>2–3 km</b> of where you stand.",
  },
  {
    out: "04-business-console.png",
    capture: "play-store/04-business-console.png",
    headline: "Hire in minutes",
    sub: "Compare applicants by <b>distance, rating and no-show history</b>.",
  },
];

const html = ({ headline, sub, capture }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  /* iPhone 6.9" screenshot — shot at 2× of 660×1434 */
  :root { --royal: #103f96; --amber: #f5a623; --ink: #0f1b2e; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 660px; height: 1434px; overflow: hidden; }
  .stage {
    width: 660px; height: 1434px;
    position: relative;
    font-family: "Inter", system-ui, sans-serif;
    color: #fff;
    background:
      radial-gradient(90% 60% at 18% 0%, #1b56c0 0%, rgba(27,86,192,0) 55%),
      radial-gradient(90% 70% at 84% 100%, #0a2a66 0%, rgba(10,42,102,0) 60%),
      linear-gradient(160deg, #123f95 0%, #0d3585 50%, #0b2e6f 100%);
    overflow: hidden;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1.5px, transparent 1.5px);
    background-size: 66px 66px;
    mask-image: radial-gradient(120% 60% at 50% 0%, #000 40%, transparent 100%);
  }
  header {
    position: absolute; top: 0; left: 0; right: 0; z-index: 2;
    padding: 52px 44px 0;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
  }
  .lockup { display: flex; align-items: center; gap: 9px; margin-bottom: 22px; }
  .tile {
    width: 34px; height: 34px; border-radius: 9px;
    background: #fff; display: grid; place-items: center;
    box-shadow: 0 6px 16px rgba(7,22,60,0.45);
  }
  .tile svg { width: 23px; height: 23px; }
  .word { font-family: "Poppins", sans-serif; font-weight: 800; font-size: 24px; letter-spacing: -0.02em; line-height: 1; }
  .word .on { color: var(--amber); }
  h1 {
    font-family: "Poppins", sans-serif;
    font-weight: 800; font-size: 45px; line-height: 1.02;
    letter-spacing: -0.03em; margin-bottom: 14px;
  }
  h1 .on { color: var(--amber); }
  p.sub { font-size: 19px; line-height: 1.45; font-weight: 500; color: #cdddf7; max-width: 520px; }
  p.sub b { color: #ffffff; font-weight: 700; }
  .device {
    position: absolute; z-index: 3;
    left: 50%; transform: translateX(-50%); top: 292px;
    width: 540px; padding: 11px;
    background: #0b1830; border-radius: 54px;
    border: 1px solid rgba(255,255,255,0.09);
    box-shadow: 0 34px 90px rgba(4,14,40,0.55);
  }
  .device img { display: block; width: 100%; border-radius: 44px; }
</style>
</head>
<body>
<div class="stage">
  <div class="grid"></div>
  <header>
    <div class="lockup">
      <div class="tile">
        <svg viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#103f96" stroke-width="7" stroke-linecap="round" fill="none">
            <path d="M48 19.8 A21 21 0 1 1 18 19.8"/>
            <line x1="33" y1="33" x2="33" y2="12.6"/>
          </g>
        </svg>
      </div>
      <div class="word">Gig<span class="on">On</span></div>
    </div>
    <h1>${headline
      .replaceAll("[on]", '<span class="on">')
      .replaceAll("[/on]", "</span>")}</h1>
    <p class="sub">${sub}</p>
  </header>
  <div class="device"><img src="${capture}" /></div>
</div>
</body>
</html>`;

mkdirSync(OUT_DIR, { recursive: true });
console.log(`App Store screenshots → docs/brand/assets/app-store/ (${W}×${H})`);
for (const slide of SLIDES) {
  const tmpHtml = join(HERE, `.appstore-${slide.out}.html`);
  const tmpShot = join(HERE, `.appstore-${slide.out}.2x.png`);
  writeFileSync(tmpHtml, html(slide));
  execFileSync(CHROME, [
    "--headless=new",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    `--window-size=${W / 2},${H / 2}`,
    "--virtual-time-budget=12000",
    `--screenshot=${tmpShot}`,
    `file://${tmpHtml}`,
  ]);
  await sharp(tmpShot)
    .resize(W, H, { kernel: "lanczos3" })
    .flatten({ background: "#0b2e6f" })
    .removeAlpha()
    .png()
    .toFile(join(OUT_DIR, slide.out));
  rmSync(tmpHtml);
  rmSync(tmpShot);
  console.log("  wrote", `docs/brand/assets/app-store/${slide.out}`);
}
console.log("Done.");
