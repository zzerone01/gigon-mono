import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Shared GigOn design tokens — the SAME palette/scale as the web design system
// (@repo/ui). shadcn/ui components are web-only, so the mobile app shares the
// tokens (not the components). Brand fonts (Poppins/Inter) can be added with
// expo-font + @expo-google-fonts/{poppins,inter}; system font is used for now.
import { colors, radius, spacing, fontWeight } from "@repo/ui/tokens";

export default function App() {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.brandRow}>
        <View style={styles.mark}>
          <Text style={styles.markGlyph}>⏻</Text>
        </View>
        <Text style={styles.wordmark}>
          Gig<Text style={styles.wordmarkOn}>On</Text>
        </Text>
      </View>

      <Text style={styles.headline}>Your gig is on.</Text>
      <Text style={styles.subhead}>
        Find quick, nearby gig work across the Philippines — right from your phone.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaLabel}>Join the waitlist</Text>
      </Pressable>

      <Text style={styles.note}>apps/mobile · Expo · themed with @repo/ui/tokens</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.royal,
    alignItems: "center",
    justifyContent: "center",
  },
  markGlyph: {
    color: colors.white,
    fontSize: 24,
    fontWeight: fontWeight.bold,
    marginTop: -2,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  wordmarkOn: { color: colors.royal },
  headline: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: fontWeight.bold,
    letterSpacing: -1,
    color: colors.ink,
  },
  subhead: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.slate,
    maxWidth: 340,
  },
  cta: {
    marginTop: spacing.md,
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaPressed: { transform: [{ scale: 0.98 }] },
  ctaLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: fontWeight.semibold,
  },
  note: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.slate,
  },
});
