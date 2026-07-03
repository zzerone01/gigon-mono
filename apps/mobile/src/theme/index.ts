/**
 * Mobile theme — extends the shared @repo/ui tokens with the extra
 * surface/feedback colors used by the GigOn App design (GigOn App.dc.html).
 */
import { Platform } from "react-native";

import { colors as brand, radius, spacing, shadow } from "@repo/ui/tokens";

export const palette = {
  ...brand,
  /** Muted/tertiary text (#8A93A3 in the design). */
  muted: "#8A93A3",
  /** Long-form body text. */
  body: "#3D4757",
  /** Inner hairline separators (softer than `line`). */
  lineSoft: "#EEF1F6",
  /** Dashed/disabled borders. */
  lineDashed: "#C9D2E0",
  /** Destructive red used across the app design. */
  red: "#D92D20",
  redBg: "#FDF3F2",
  redBorder: "#F3C6C1",
  successBg: "#F0FAF4",
  successBorder: "#BFE6D0",
  amberBg: "#FEF8EC",
  amberPressed: "#E99B16",
  /** Light-on-navy secondary text (chat bubbles, banners, toasts). */
  onNavyMuted: "#BCD0F2",
  /** Stylized map fills. */
  mapWater: "#CDD9F0",
  mapWaterEdge: "#B3C5E8",
  mapBlock: "#E7EDF8",
  mapRoad: "#FFFFFF",
  mapRoadSoft: "#FBFCFE",
  mapRoadShadow: "#DFE6F2",
  mapLabel: "#A9B1BF",
  backdrop: "rgba(15,27,46,0.45)",
} as const;

/**
 * Loaded font-family names (expo-google-fonts registers one family per
 * weight, so `fontWeight` alone won't pick these up on Android).
 */
export const font = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  displayMedium: "Poppins_500Medium",
  displaySemiBold: "Poppins_600SemiBold",
  displayBold: "Poppins_700Bold",
  mono: Platform.select({ ios: "Menlo", default: "monospace" }) as string,
} as const;

export { radius, spacing, shadow };
