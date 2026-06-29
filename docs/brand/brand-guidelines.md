# Brand Guidelines

## The name

**GigOn** is `Gig` + `On`.

- A _gig_ is a short, paid job — 1–3 hours of real work.
- _On_ is the switch: post it, and your gig is **on** — live, matched, happening.

Always written **GigOn** — one word, capital **G** and capital **O**, no space,
no hyphen. Never "Gig On", "Gigon", "GIGON", or "gigOn".

## The mark

The logo mark is a **power symbol** inside a rounded Royal tile. It reads
instantly as "switch on" and ties straight to the tagline, _Your gig is on._

- **Mark:** white power glyph on a `#103F96` Royal tile, rounded corners.
- **Wordmark:** `Gig` set in Ink, `On` set in Royal. On dark/Royal backgrounds,
  the whole wordmark goes white and `On` turns **Amber** for contrast.
- **Lockup:** mark + wordmark, horizontally aligned, with the tile roughly the
  cap-height of the wordmark.

In code this is the [`Logo`](../../apps/web/components/brand/logo.tsx) component
(`<Logo />`, `<LogoMark />`, with `size` and `tone` props). Static assets:
[`apps/web/public/logo-mark.svg`](../../apps/web/public/logo-mark.svg) and the
favicon [`apps/web/app/icon.svg`](../../apps/web/app/icon.svg).

### Clear space & size

- Keep clear space around the lockup equal to the tile's corner radius on all
  sides — don't crowd it.
- Minimum wordmark height ~18px on screen; below that, use the mark alone.

### Don't

- Don't recolour the tile or the glyph (Royal tile, white glyph — or the inverted
  pairing only).
- Don't stretch, rotate, add shadows/gradients/outlines to the glyph.
- Don't recolour `On` to anything other than Royal (light bg) or Amber (dark bg).
- Don't place the Royal mark on a busy photo without a solid chip behind it.

## Voice & tone

GigOn sounds like a **straight-talking neighbour who gets things done** — warm,
practical, and trustworthy. We sell certainty: the right person, nearby, paid
fairly, confirmed by both sides.

**Principles**

1. **Plain & direct.** Short sentences. Say the thing. (PH business English —
   clear and universal, not slang-heavy.)
2. **Trust-forward.** Lead with safety, proximity, and "you'll actually get
   paid." Trust isn't a feature; it's the point.
3. **Local & concrete.** Real places (your city, your barangay), real money (₱),
   real time (1–3 hrs). Avoid abstract startup-speak.
4. **Warm, not hype.** Encouraging and human. No exclamation-mark salesmanship.

**Do / Don't**

| Do | Don't |
| --- | --- |
| "Match in minutes, not days." | "Revolutionising the future of work!!!" |
| "Everyone you see is within walking distance." | "Leverage our hyperlocal synergy network." |
| "Get 100% of the agreed pay in cash." | "Monetise your idle time-capital." |
| "No more hunting through Facebook groups." | "Disrupt the informal labour paradigm." |

**Capitalisation & symbols**

- Brand: **GigOn**. Tagline: _Your gig is on._
- Currency: peso glyph `₱` with no space (`₱300`).
- Ranges use an en dash: `1–3 hrs`, `Mon–Sat`.

## Accessibility (part of the brand)

A trust brand has to be usable by everyone.

- **Focus:** a 3px **Amber** focus ring (`:focus-visible`) on every interactive
  element. Never remove it.
- **Contrast:** body text is Ink/Slate on white; on Royal we use white and the
  light-blue tints defined in the tokens — all meet WCAG AA.
- **Motion:** entrance animations are gated behind `prefers-reduced-motion` and
  content is fully visible without JavaScript.
- **Semantics:** real landmarks, labelled forms, `aria-live` status on the
  waitlist result.
