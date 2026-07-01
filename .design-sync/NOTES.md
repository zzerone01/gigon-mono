# design-sync notes — GigOn (@repo/ui → Claude Design)

Project: **GigOn** — https://claude.ai/design/p/2ca7d692-5a4c-43ae-8a41-326ce85c2562

## What syncs

The shared design system is **`packages/ui` (`@repo/ui`)**: the full shadcn/ui
(new-york) set wearing the GigOn brand skin (tokens in `src/styles/globals.css`).
`apps/web` still has its own copies (migration deferred) — do NOT sync apps/web.

## How the sync is wired (atypical — read before re-syncing)

- **Barrel entry**: `.design-sync/ds-entry.tsx` re-exports every component file
  from `@repo/ui/*`. Regenerate with `scratchpad/gen-sync-map.mjs` only if the
  component set changes (also regenerates `.design-sync/docs/*` group stubs and
  the componentSrcMap in `.gen-map.json`).
- `--entry .design-sync/ds-entry.tsx` makes **PKG_DIR = repo root** (walk-up to
  `gigon-mono`). `--node-modules packages/ui/node_modules` (where react/radix/
  recharts/etc. resolve). `cfg.tsconfig = packages/ui/tsconfig.json` resolves
  `@repo/ui/*` → `packages/ui/src/*`.
- **`cfg.pkg = "@repo/ui"`** so authored previews can `import { X } from "@repo/ui"`
  and be shimmed to `window.GigOnDS` (story-imports Rule 1). Don't change it.
- **CSS**: `cfg.cssEntry = .design-sync/gigon.compiled.css` is a Tailwind v4
  build artifact (gitignored). Regenerate with `cfg.buildCmd`
  (`node .design-sync/build-css.mjs`) — it compiles `.design-sync/tailwind-input.css`
  (imports `@repo/ui` globals + `@source`s the components/previews) using
  apps/web's `@tailwindcss/postcss`. **Run buildCmd before every converter build.**
- **Fonts**: Inter + Poppins latin woff2 are committed under `.design-sync/fonts/`
  and shipped via `cfg.extraFonts`. Re-fetch with `scratchpad/fetch-fonts.mjs`
  if ever needed.

## Running the converter (exact command)

Always run from the **repo root** (the converter reads `.design-sync/previews`
relative to cwd — a stale cwd caused a MODULE_NOT_FOUND once):

```
node .design-sync/build-css.mjs
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules packages/ui/node_modules --entry .design-sync/ds-entry.tsx --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle --no-render-check
```

## Verification

- Render check uses the **Playwright MCP** (not the built-in chromium), so
  validate runs with `--no-render-check` (the `[RENDER_SKIPPED]` warn is expected).
  Verified Button/Logo/Card render + computed styles (royal #103F96, amber
  #F5A623, Inter body, Poppins 700 wordmark, 347 exports on window.GigOnDS).
  To re-verify: `node .ds-sync/storybook/http-serve.mjs ./ds-bundle` then open
  card HTML / `.review.html` in a browser (or MCP).

## Coverage (first sync)

- **63 components** imported (all functional via the bundle).
- **20 authored previews** (Button, Badge, Input, Textarea, Label, Checkbox,
  Switch, RadioGroup, Slider, Progress, Separator, Skeleton, Card, Alert, Avatar,
  Accordion, Tabs, Select, Logo, LogoMark). The other 43 ship the **floor card** —
  authorable incrementally by adding `.design-sync/previews/<Name>.tsx`.
- Overlays (Dialog/Popover/Tooltip/DropdownMenu/Sheet/Drawer/Menubar/ContextMenu/
  Command/HoverCard) are floor cards — authoring them needs open-state +
  `cfg.overrides.<Name>.cardMode="single"`.

## `.d.ts` props

Synth-from-src mode → **no shipped `.d.ts` to extract from**, so `[DTS_REACT]` is
expected and non-core components emit `interface XProps { [key: string]: unknown }`.
Accurate props are hand-written in `cfg.dtsPropsFor` for 13 core components.
To give ALL 63 real props, add a real `.d.ts` build to `packages/ui` (e.g.
`tsc --emitDeclarationOnly`) and point the converter at it.

## Re-sync risks / watch-list

- **cwd must be repo root** when running the converter (see above).
- Regenerate `gigon.compiled.css` (buildCmd) before building, or previews render
  unstyled against a stale stylesheet.
- `shadcn add` appended a `.dark { --sidebar-* }` block (zinc values) to
  `packages/ui/src/styles/globals.css` — dark mode is unused/not brand-tuned.
- `--ring` was set to **amber** (brand focus) — diverges from design-tokens.md
  (which says ring=royal, focus overridden to amber). The amber `--ring` is the
  intended visual result for shadcn components.
- New shadcn components added later won't have a group stub → they land in group
  "Components" until a `.design-sync/docs/<Name>.md` (category frontmatter) is added.
