# GigOn Brand System

> **Your gig is on.**
> GigOn is a local, map-first marketplace that connects small businesses with
> trusted workers nearby for short **1–3 hour** gigs (cleaning, laundry, extra
> hands for a rush). Think _"당근알바, for the Philippines"_ — proximity and
> trust first. Currently a **private beta in Cebu–Mactan**; the public face is a
> landing page that validates the problem and collects waitlist sign-ups.

This folder is the source of truth for everything brand. The implementation
lives in `apps/web` and the visual tokens are defined once in
[`apps/web/app/globals.css`](../../apps/web/app/globals.css).

## Contents

| Doc | What's inside |
| --- | --- |
| [`brand-guidelines.md`](./brand-guidelines.md) | Name & meaning, logo usage, voice & tone, do/don't |
| [`design-tokens.md`](./design-tokens.md) | Colour, typography, radius, shadow, spacing — the token reference |
| [`messaging.md`](./messaging.md) | Positioning, value props, audiences, approved copy, localisation |
| [`components.md`](./components.md) | shadcn/ui + lucide component inventory and how to extend it |

For running the site and configuring the waitlist, see
[`apps/web/README.md`](../../apps/web/README.md).

## Brand at a glance

- **Name:** GigOn — `Gig` + `On`. The mark is a **power symbol**: switch on, and
  your gig is live.
- **Wordmark:** `Gig` in Ink, `On` in Royal (`On` turns Amber on dark
  backgrounds).
- **Tagline:** _Your gig is on._
- **Domain:** `gigon.io`
- **Personality:** Direct, warm, trustworthy, local. Speed + trust, close to home.

## Colour quick reference

| Token | Hex | Role |
| --- | --- | --- |
| Royal (Primary) | `#103F96` | Brand colour, primary buttons, links |
| Dark | `#0B2E6F` | Primary hover, deep fills |
| Tint | `#E7EDF8` | Soft brand surfaces, badges |
| Amber | `#F5A623` | Action accent — the "post / join" energy |
| Ink | `#0F1B2E` | Headings & body text |
| Slate | `#5B6675` | Secondary text |

## Typography quick reference

- **Poppins** (600 / 700) — display & headlines
- **Inter** (400 / 500 / 600) — UI & body

See [`design-tokens.md`](./design-tokens.md) for the full palette, the semantic
(shadcn) mapping, the type scale, radius and shadow values.
