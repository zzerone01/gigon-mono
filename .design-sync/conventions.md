# GigOn design system — how to build with it

These are the shared **@repo/ui** components: shadcn/ui (new-york) wearing the
GigOn brand skin. Every component is on `window.GigOnDS.*` (bundle: `_ds_bundle.js`).
Build real product UI by composing them — don't re-implement primitives.

## Setup

- **One stylesheet**: link `styles.css` (it `@import`s the tokens, the Inter +
  Poppins `@font-face`s, and the component CSS). Nothing else is needed for styling.
- **Fonts**: body text is **Inter** (`font-sans`); headings/wordmark are **Poppins**
  (`font-display`). Both ship in the bundle.
- **Providers** (only where used): wrap the app in `TooltipProvider` for tooltips;
  drop one `<Toaster />` (from `sonner`) at the root for toasts; `Sidebar` needs
  `SidebarProvider`. Most components need no provider.

## Styling idiom — Tailwind utilities backed by GigOn tokens

Style with Tailwind utility classes; the palette is **token-driven**, so use the
brand utilities rather than raw hex. Utilities are generated on use.

- **Brand colors**: `royal` (primary blue), `royal-dark`, `tint` / `tint-soft`
  (soft blue surfaces), `amber` (accent CTA) / `amber-dark`, `ink` (headings/text),
  `slate` (secondary text), `line` (borders), `success`. Use as `bg-*` / `text-*`
  / `border-*` — e.g. `bg-royal text-white`, `text-ink`, `text-slate`, `border-line`,
  `bg-amber`, `bg-tint`.
- **Semantic (shadcn) roles**: `bg-primary` (royal), `bg-secondary` (tint),
  `bg-muted`, `bg-accent` (amber), `bg-destructive`, `text-foreground`,
  `bg-background`, `border-border`. Focus rings are **amber** brand-wide via
  `ring-ring` (already applied by the components).
- **Radius**: `rounded-md` (12px) for controls, `rounded-lg` (14px) cards,
  `rounded-xl` (18px) feature surfaces, `rounded-full` pills.
- **Elevation**: `shadow-card` is the signature card shadow.
- **Type**: `font-display` (Poppins) for headings, `font-sans` (Inter) for body.

## Brand variants worth knowing

- `<Button variant="amber">` — the accent CTA (Join / Apply / Post). Also
  `default` (royal), `outline`, `secondary`, `ghost`, `link`, `destructive`;
  sizes `sm | default | lg | icon`.
- `<Badge>` — `default` (soft tint), `amber`, `solid` (royal), `success`,
  `outline`; sizes `default | lg`.
- `Logo` / `LogoMark` — brand lockup; `size` (`sm|md|lg`), `tone` (`default|inverted`
  for royal backgrounds).

## Where the truth lives

Read `styles.css` and its imports for the exact tokens, and each component's
`<Name>.prompt.md` for its API and examples. Components are the real shipped code
on `window.GigOnDS`.

## Idiomatic example

```tsx
// A gig card — Card + Badge + the amber CTA
<Card className="max-w-sm shadow-card">
  <CardHeader>
    <CardTitle>Weekend delivery rider</CardTitle>
    <CardDescription>Makati City · Same-day</CardDescription>
    <CardAction><Badge variant="amber">₱650/day</Badge></CardAction>
  </CardHeader>
  <CardContent className="text-slate text-sm">
    Reliable rider needed for same-day deliveries around Makati this weekend.
  </CardContent>
  <CardFooter className="gap-3">
    <Button variant="amber" className="flex-1">Apply now</Button>
    <Button variant="outline">Save</Button>
  </CardFooter>
</Card>
```
