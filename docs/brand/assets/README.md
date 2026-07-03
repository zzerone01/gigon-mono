# Brand assets

Master artwork + the generator that produces **every raster brand asset** in
the monorepo. The single source of truth for the mark's geometry is the power
glyph from [`apps/web/public/logo-mark.svg`](../../../apps/web/public/logo-mark.svg)
(96×96 design space), inlined in [`build.mjs`](./build.mjs).

## Regenerate

```sh
node docs/brand/assets/build.mjs
```

Requires `sharp` (root devDependency) for SVG→PNG, and headless Chrome (macOS
app path) for the OG images — the OG step is skipped with a warning if Chrome
is missing. HTML sources render Poppins/Inter from Google Fonts, so the OG
step needs network.

## Masters (this directory)

| File | What |
| --- | --- |
| `mark.svg` | Rounded Royal tile + white glyph — the standard mark (512) |
| `mark-inverse.svg` | White tile + Royal glyph — for Royal/dark surfaces (512) |
| `glyph-royal.svg` / `glyph-white.svg` | Glyph alone on transparent (512) |
| `og-app.html` | OG/Twitter card source for app.gigon.io (1200×630, shot at 2×) |

The wordmark (`Gig` + `On`) is type, not paths — it lives in the `Logo`
component (`@repo/ui`) and in the HTML sources here and in
[`../social/`](../social/).

## Generated outputs

| Path | Composition | Used as |
| --- | --- | --- |
| `apps/mobile/assets/icon.png` | full-bleed Royal, glyph 63% | iOS app icon (1024², iOS masks it) |
| `apps/mobile/assets/android-icon-foreground.png` | glyph ~45% on transparent | adaptive-icon foreground (safe zone = centre 61%) |
| `apps/mobile/assets/android-icon-background.png` | solid Royal | adaptive-icon background |
| `apps/mobile/assets/android-icon-monochrome.png` | white glyph on transparent | Android 13 themed icon **and** notification small icon |
| `apps/mobile/assets/splash-icon.png` | Royal tile (512²) | splash, 104dp on white (`expo-splash-screen` plugin) |
| `apps/mobile/assets/favicon.png` | Royal tile (48²) | Expo web favicon |
| `apps/app/app/apple-icon.png` | full-bleed Royal (180²) | apple-touch-icon, app.gigon.io |
| `apps/app/public/icon-{192,512}.png` | Royal tile | PWA manifest icons |
| `apps/app/public/icon-maskable-512.png` | full-bleed, glyph 54% | PWA maskable icon (safe zone = centre 80%) |
| `apps/app/app/{opengraph,twitter}-image.png` | `og-app.html` | link-preview cards for app.gigon.io |
| `apps/web/app/apple-icon.png` | full-bleed Royal (180²) | apple-touch-icon, gigon.io |

Hand-authored (not generated): `apps/web/app/icon.svg` and
`apps/app/app/icon.svg` (32px-tuned favicon), `apps/web/public/logo-mark.svg`,
and the landing's screenshot-based OG images in `apps/web/app/`.

## Rules of thumb

- **Never edit the PNGs by hand** — change `build.mjs` (or the HTML) and
  rerun, so every surface stays in sync.
- Tile = Royal `#103F96`, glyph = white; the only allowed inversion is white
  tile + Royal glyph (see [`../brand-guidelines.md`](../brand-guidelines.md)).
- Full-bleed compositions exist because iOS/maskable-PWA apply their own
  corner mask; don't ship the rounded tile there (you'd get double corners).
