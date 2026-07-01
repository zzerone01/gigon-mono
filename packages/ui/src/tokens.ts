/**
 * GigOn design tokens — framework-agnostic.
 *
 * The CSS source of truth is `@repo/ui/globals.css` (Tailwind v4 `@theme`).
 * This module mirrors those values as plain JS so non-CSS consumers — notably
 * the **React Native (Expo)** mobile app, which can't use the web components —
 * share one palette/scale. Keep the two in sync (see docs/brand/design-tokens.md).
 */

/** Raw brand palette (hex). */
export const colors = {
  royal: "#103F96",
  royalDark: "#0B2E6F",
  tint: "#E7EDF8",
  tintSoft: "#F2F6FC",
  amber: "#F5A623",
  amberDark: "#B9760D",
  ink: "#0F1B2E",
  slate: "#5B6675",
  line: "#E2E7EF",
  bg: "#FFFFFF",
  bgSoft: "#F6F9FE",
  success: "#1AA75A",
  destructive: "#E5484D",
  white: "#FFFFFF",
} as const

/** Semantic roles (shadcn/ui contract) resolved to concrete hex values. */
export const semanticColors = {
  background: colors.bg,
  foreground: colors.ink,
  card: colors.bg,
  cardForeground: colors.ink,
  primary: colors.royal,
  primaryForeground: colors.white,
  secondary: colors.tint,
  secondaryForeground: colors.royalDark,
  muted: colors.bgSoft,
  mutedForeground: colors.slate,
  accent: colors.amber,
  accentForeground: colors.ink,
  destructive: colors.destructive,
  destructiveForeground: colors.white,
  border: colors.line,
  input: colors.line,
  /** Focus ring is amber brand-wide. */
  ring: colors.amber,
} as const

/** Corner radius scale, in px (CSS base --radius = 14px). */
export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 9999,
} as const

/** Font families. Load Inter + Poppins in the host app (next/font, expo-font). */
export const fontFamily = {
  sans: "Inter",
  display: "Poppins",
} as const

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const

/** 8pt-ish spacing scale, in px. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const

/** Signature elevation (RN shadow-friendly values). */
export const shadow = {
  card: {
    shadowColor: "#0F1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
} as const

export const tokens = {
  colors,
  semanticColors,
  radius,
  fontFamily,
  fontWeight,
  spacing,
  shadow,
} as const

export type GigOnColors = typeof colors
export type GigOnTokens = typeof tokens
