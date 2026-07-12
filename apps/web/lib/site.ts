export type Role = "business" | "worker";

export const siteConfig = {
  name: "GigOn",
  tagline: "Your gig is on.",
  domain: "gigon.io",
  url: "https://gigon.io",
  /** The live web app (private beta). */
  appUrl: "https://app.gigon.io",
  /** Store listings (Android live 2026-07-12; iOS live once 1.0.0 is released in ASC). */
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.gigon.app",
  appStoreUrl: "https://apps.apple.com/app/id6787359152",
  description:
    "GigOn connects small businesses with trusted workers nearby for the quick 1–3 hour jobs you need filled right now. No more hunting through Facebook groups. Now in private beta across the Philippines.",
  shortDescription:
    "Short, local gigs — matched with trusted people nearby. Now in private beta across the Philippines.",
  /** Grammatical, for in-sentence use ("Be first in the Philippines."). */
  locationLabel: "the Philippines",
  /** Short label, for chips/eyebrows ("Now in private beta · Philippines"). */
  region: "Philippines",
  contactEmail: "leo@gigon.io",
  nav: [
    { label: "How it works", href: "#how" },
    { label: "For business", href: "#business" },
    { label: "For workers", href: "#workers" },
    { label: "Why GigOn", href: "#why" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
