# Components

## Stack

- **Next.js 16** (App Router, RSC) · **React 19**
- **Tailwind CSS v4** (CSS-first `@theme`, no JS config)
- **shadcn/ui** — `new-york` style, copy-in components in
  `apps/web/components/ui`
- **lucide-react** — icon set

shadcn is configured in
[`apps/web/components.json`](../../apps/web/components.json); the `cn()` helper is
in [`apps/web/lib/utils.ts`](../../apps/web/lib/utils.ts). Path alias `@/*` →
`apps/web/*`.

## Where things live

```
apps/web/
├─ app/                      # routes, layout, globals.css (tokens), OG/icon, /api/waitlist
├─ components/
│  ├─ ui/                    # shadcn primitives (button, input, badge, label)
│  ├─ brand/logo.tsx         # Logo / LogoMark
│  ├─ sections/              # one file per landing section + section-heading + map-preview
│  ├─ waitlist-form.tsx      # client: role toggle, validation, states, honeypot
│  └─ reveal.tsx             # client: scroll-reveal wrapper
└─ lib/                      # site config + utils
```

## Primitives

| Component | Variants / notes |
| --- | --- |
| **Button** | `default` (Royal), `amber` (accent CTA), `outline`, `secondary`, `ghost`, `link` · sizes `sm` `default` `lg` `icon` · `asChild` for links |
| **Input** | 44px, Royal focus border, `aria-invalid` styling |
| **Badge** | `default` (Tint), `amber`, `solid` (Royal), `outline`, `success` · sizes `default` `lg` |
| **Label** | shadcn label, used where forms need a visible label |

All primitives draw only from the [design tokens](./design-tokens.md), so they
restyle automatically if a token changes. Focus is handled globally by the Amber
`:focus-visible` ring — primitives intentionally don't add their own ring.

## Icons

Use **lucide-react**, sized with Tailwind (`size-4`, `size-5`). Keep stroke
defaults; the brand mark uses `Power`. Inside Buttons, an unsized `<svg>` is
auto-sized to `size-4`.

## Notable composed components

- **`Logo` / `LogoMark`** — brand lockup; `size` (`sm|md|lg`) and `tone`
  (`default|inverted`).
- **`WaitlistForm`** — the conversion surface. Posts to `/api/waitlist`. Props:
  `source`, `tone` (`light|onRoyal`), `defaultRole`. Includes a honeypot,
  inline validation, loading + success + error states, `aria-live` status.
- **`MapPreview`** — the hero's signature visual: a stylised street map with a
  "you are here" marker and bobbing **₱** price pins. Pure SVG/CSS, no map SDK
  (the real app will use Google Maps or Mapbox).
- **`StickyMobileCta`** — mobile-only bottom "Join the waitlist" bar that
  appears while scrolling between the hero form and the closing CTA, then taps
  through to the form with the email field focused. A key conversion surface on
  mobile (where most traffic is).
- **`Reveal`** — scroll-in animation that's safe without JS and respects
  reduced motion (see `globals.css`).
- **`SectionHeading`** — consistent kicker + `h2` + subtitle.

> The hero is **mobile-first**: on phones it reads copy → compact map → form so
> visitors grasp the product, then act, inside roughly one screen; on `md+` it
> becomes the two-column layout. Most users are on mobile — optimise there first.

## Adding more shadcn components

With `components.json` already set up:

```bash
pnpm --filter web dlx shadcn@latest add dialog
# or, from apps/web:  pnpm dlx shadcn@latest add dialog
```

After generating, **review the component's tokens** — shadcn may emit its own
colour variables; map them onto the GigOn tokens in
[`globals.css`](../../apps/web/app/globals.css) rather than introducing new
greys. Keep new primitives token-driven and focus-ring-free (the global Amber
ring covers them).

## Conventions

- Server components by default; add `"use client"` only when needed
  (`SiteHeader`, `WaitlistForm`, `Reveal`).
- Compose with tokens/utilities — avoid hard-coded hex except the few documented
  on-Royal tints (e.g. `#bcd0f2`, `#cdd9f0`) used for text on the brand blue.
- Keep copy aligned with [`messaging.md`](./messaging.md).
