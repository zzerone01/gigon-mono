# GigOn — web

The GigOn marketing **landing page** and **waitlist** capture.
_Your gig is on._ Built with Next.js 16 (App Router), React 19, Tailwind v4,
shadcn/ui and lucide.

> Brand & design docs live in [`docs/brand`](../../docs/brand). Design tokens are
> defined once in [`app/globals.css`](./app/globals.css).

## Develop

From the repo root:

```bash
pnpm install
pnpm --filter web dev          # http://localhost:3000
```

Useful scripts (run with `pnpm --filter web <script>`):

| Script | What |
| --- | --- |
| `dev` | Dev server on port 3000 |
| `build` | Production build |
| `start` | Serve the production build |
| `lint` | ESLint (`--max-warnings 0`) |
| `check-types` | `next typegen` + `tsc --noEmit` |

## Structure

```
app/
  layout.tsx          fonts (Poppins + Inter), metadata, SEO, theme-color
  page.tsx            composes the landing sections
  globals.css         design tokens (@theme) + base styles + reveal
  api/waitlist/       POST route that captures sign-ups
  opengraph-image.tsx generated social share image
  icon.svg            favicon (the power mark)
  sitemap.ts robots.ts manifest.ts
components/
  ui/                 shadcn primitives (button, input, badge, label)
  brand/logo.tsx      Logo / LogoMark
  sections/           header, hero, map-preview, problem-strip, audience-split,
                      how-it-works, why-gigon, final-cta, footer, section-heading
  waitlist-form.tsx   client form (role toggle, validation, states, honeypot)
  reveal.tsx          scroll-reveal wrapper
lib/                  site config + cn() util
```

## Waitlist setup (email capture)

Sign-ups POST to **`/api/waitlist`**, which is **provider-agnostic**. The default
path is **[Formspree](https://formspree.io)** — free, no backend, keeps our
custom form UI.

**With no configuration**, the route validates input, logs the sign-up, and
returns success — so the flow works end-to-end in local dev without persisting
anything.

### Go live with Formspree (recommended, free)

1. Create a free Formspree account and a new form.
2. Copy its endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
3. Set the env var (locally in `apps/web/.env.local`, and in your host):

   ```bash
   WAITLIST_ENDPOINT="https://formspree.io/f/abcdwxyz"
   ```

That's it — sign-ups now land in Formspree (with email notifications and CSV
export). The payload sent is `{ email, role, source, _subject }`.

### Swapping providers

Because the client only talks to `/api/waitlist`, switching services means
editing just [`app/api/waitlist/route.ts`](./app/api/waitlist/route.ts):

- **Resend** (dev-friendly, also sends the launch email): add a contact via the
  [Audiences API](https://resend.com/docs) with `RESEND_API_KEY`.
- **Mailchimp**: `POST` to a list's `/members` endpoint with an API key.

Keep the request/response shape the same and the UI needs no changes.

### Anti-spam

A hidden honeypot field (`company`) is checked on both the client and the server;
filled = silently dropped. Email format is validated client- and server-side.

## The map

The landing's hero map is a **stylised SVG/CSS preview** (`MapPreview`) — no map
SDK, no API key. The real product is planned **map-first**; recommended options:

- **Google Maps** — most familiar to Philippine users; richest local POI data.
- **Mapbox** — best for custom styling that matches the GigOn palette.

This is a deliberate later decision (see
[`docs/brand/messaging.md`](../../docs/brand/messaging.md) → _Out of scope_).

## Deploy

Deploys cleanly to **Vercel** (the API route runs as a serverless function). Set
`WAITLIST_ENDPOINT` in the project's environment variables. Point **gigon.io** at
the deployment. `metadataBase` is `https://gigon.io` (in `lib/site.ts`).
