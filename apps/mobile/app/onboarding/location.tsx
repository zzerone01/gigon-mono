import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PulseRing } from "../../src/components/animated-bits";
import { Icon } from "../../src/components/icon";
import { OnboardingMapArt } from "../../src/components/maps";
import { Press } from "../../src/components/ui";
import { useGigStore } from "../../src/store/gig-store";
import { font, palette, radius } from "../../src/theme";

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onbRole = useGigStore((s) => s.onbRole);
  const completeOnboarding = useGigStore((s) => s.completeOnboarding);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const finish = async (askLocation: boolean) => {
    if (busy) return;
    setBusy(true);
    setError("");
    let coords: { lat: number; lng: number } | null = null;
    if (askLocation) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
      } catch {
        // fall back to the pilot-zone center
      }
    }
    const err = await completeOnboarding(coords);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace(onbRole === "employer" ? "/(employer)/postings" : "/(worker)/explore");
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.progressRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.progressBar, { backgroundColor: palette.royal }]} />
        ))}
      </View>
      <View style={styles.main}>
        <View style={{ gap: 6, paddingHorizontal: 4 }}>
          <Text style={styles.heading}>Turn on location</Text>
          <Text style={styles.sub}>
            GigOn only shows gigs within 2–3 km of you. Your exact location is never shown to other
            users.
          </Text>
        </View>
        <View style={styles.mapBox}>
          <OnboardingMapArt />
          <View style={styles.youWrap}>
            <PulseRing size={44} style={{ left: -14, top: -14 }} />
            <View style={styles.youDot} />
          </View>
          <View style={styles.zoneChip}>
            <Text style={styles.zoneChipText}>Mactan · pilot zone · 2–3 km</Text>
          </View>
        </View>
        <View style={styles.privacyRow}>
          <Icon name="shield" size={16} color={palette.success} />
          <Text style={styles.privacyText}>
            Businesses only see your approximate distance — e.g. “400 m away”.
          </Text>
        </View>
        {!!error && (
          <Text style={{ fontFamily: font.sansSemiBold, fontSize: 12.5, color: palette.red, textAlign: "center" }}>
            {error}
          </Text>
        )}
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 16, gap: 8 }}>
        <Press style={[styles.cta, busy && { opacity: 0.6 }]} onPress={() => finish(true)} disabled={busy}>
          <Text style={styles.ctaLabel}>{busy ? "Setting up…" : "Allow location access"}</Text>
        </Press>
        <Press style={styles.skip} onPress={() => finish(false)} haptic={false} disabled={busy}>
          <Text style={styles.skipLabel}>Pick my area manually</Text>
        </Press>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.white,
  },
  progressRow: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  progressBar: {
    width: 24,
    height: 4,
    borderRadius: radius.pill,
  },
  main: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heading: {
    fontFamily: font.displayBold,
    fontSize: 24,
    letterSpacing: -0.5,
    lineHeight: 28,
    color: palette.ink,
  },
  sub: {
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 20,
    color: palette.slate,
  },
  mapBox: {
    height: 224,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: "hidden",
    backgroundColor: palette.tintSoft,
  },
  youWrap: {
    position: "absolute",
    left: "50%",
    top: "52%",
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
  },
  youDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: palette.amber,
    borderWidth: 3,
    borderColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  zoneChip: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zoneChipText: {
    fontFamily: font.sansSemiBold,
    fontSize: 11,
    color: palette.royalDark,
  },
  privacyRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    paddingVertical: 13,
    backgroundColor: palette.bgSoft,
    borderRadius: 14,
  },
  privacyText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18.5,
    color: palette.slate,
  },
  cta: {
    height: 50,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 15,
    color: palette.ink,
  },
  skip: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  skipLabel: {
    fontFamily: font.sansMedium,
    fontSize: 13.5,
    color: palette.slate,
  },
});
