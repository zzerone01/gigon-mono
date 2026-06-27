# Design Tokens

The **single source of truth** is
[`apps/web/app/globals.css`](../../apps/web/app/globals.css). Tokens are defined
as CSS variables and exposed to Tailwind v4 via `@theme`, then mapped to the
shadcn/ui semantic contract. This doc mirrors that file — if they ever disagree,
the CSS wins.

## Colour

### Raw brand palette

| Name | Hex | CSS var | Tailwind utility | Usage |
| --- | --- | --- | --- | --- |
| Royal (Primary) | `#103F96` | `--gigon-royal` | `royal` | Brand colour, primary CTA, links, mark |
| Dark | `#0B2E6F` | `--gigon-royal-dark` | `royal-dark` | Primary hover, deep fills |
| Tint | `#E7EDF8` | `--gigon-tint` | `tint` | Badges, soft brand surfaces, icon chips |
| Tint Soft | `#F2F6FC` | `--gigon-tint-soft` | `tint-soft` | Ghost-button hover, subtle fills |
| Amber | `#F5A623` | `--gigon-amber` | `amber` | Action accent (Join / Post), focus ring |
| Amber Dark | `#B9760D` | `--gigon-amber-dark` | `amber-dark` | Amber hover, kicker labels |
| Ink | `#0F1B2E` | `--gigon-ink` | `ink` | Headings & primary text |
| Slate | `#5B6675` | `--gigon-slate` | `slate` | Secondary text |
| Line | `#E2E7EF` | `--gigon-line` | `line` | Borders, dividers |
| BG Soft | `#F6F9FE` | `--gigon-bg-soft` | `bg-soft` | Alternating section background |
| Success | `#1AA75A` | `--gigon-success` | `success` | "Live"/confirmed states |
| White | `#FFFFFF` | `--gigon-bg` | `background` | Page background |

### Semantic mapping (shadcn/ui)

These let shadcn primitives stay generic while wearing GigOn's skin:

| Semantic token | Resolves to | Utility |
| --- | --- | --- |
| `--primary` / `--primary-foreground` | Royal / White | `bg-primary` `text-primary-foreground` |
| `--secondary` / `--secondary-foreground` | Tint / Dark | `bg-secondary` … |
| `--muted` / `--muted-foreground` | BG Soft / Slate | `bg-muted` … |
| `--accent` / `--accent-foreground` | Amber / Ink | `bg-accent` … |
| `--border`, `--input` | Line | `border-border` |
| `--ring` | Royal | (focus is overridden to Amber globally) |
| `--background` / `--foreground` | White / Ink | `bg-background` `text-foreground` |

> A `.dark` variant is wired up but unused — the landing is intentionally
> light-only.

## Typography

| Family | Weights | Role | Token |
| --- | --- | --- | --- |
| **Poppins** | 600, 700 (500 avail.) | Display & headlines | `font-display` |
| **Inter** | 400, 500, 600 | UI & body | `font-sans` |

Loaded via `next/font/google` in
[`app/layout.tsx`](../../apps/web/app/layout.tsx) (variables `--font-poppins`,
`--font-inter`). Base body is **17px / 1.7**; headings are Poppins **700**,
`line-height: 1.1`, tight tracking.

### Type scale (fluid)

| Element | Size |
| --- | --- |
| Hero `h1` | `clamp(2.6rem, 6vw, 4.2rem)` |
| Section `h2` | `clamp(1.9rem, 3.4vw, 2.7rem)` |
| Stat / strip | `clamp(2.4rem, 5vw, 3.4rem)` |
| CTA `h2` | `clamp(2rem, 4vw, 3rem)` |
| Kicker | 13px, uppercase, `0.08em` tracking, Amber Dark |
| Body | 17px (15px in dense UI) |

## Radius

Base `--radius: 0.875rem` (14px), with the shadcn-derived scale:

| Token | Value | Typical use |
| --- | --- | --- |
| `--radius-sm` | 10px | Buttons, inputs |
| `--radius-md` | 12px | — |
| `--radius-lg` | 14px | Cards |
| `--radius-xl` | 18px | Feature cards, CTA band |
| pill | `9999px` | Badges, chips, role toggle |

## Elevation & misc

- **Card shadow** (`--shadow-card`, util `shadow-card`):
  `0 1px 2px rgba(15,27,46,.04), 0 8px 24px rgba(15,27,46,.06)` — soft, low,
  brand-tinted.
- **Focus ring:** `3px solid #F5A623` (Amber), `2px` offset, applied to every
  `:focus-visible`.
- **Container:** centred, `max-width: 1140px`, `24px` gutters
  (utility `.container-gigon`).
- **Motion:** one custom keyframe, `--animate-bob` (the floating price pins);
  reveal transitions are 700ms ease-out and disabled under reduced motion.
- **`theme-color`:** `#103F96` (browser UI / PWA).
