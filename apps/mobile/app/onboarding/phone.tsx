import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "../../src/components/icon";
import { Press } from "../../src/components/ui";
import { font, palette, radius } from "../../src/theme";

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("917 244 1188");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 10 }]}
    >
      <View style={styles.main}>
        <View style={styles.logoTile}>
          <Icon name="logo" size={28} color={palette.white} strokeWidth={2.4} />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={styles.wordmark}>GigOn</Text>
          <Text style={styles.tagline}>Your gig is on.</Text>
          <Text style={styles.subtitle}>
            Short, local gigs matched with trusted people nearby — in Mactan.
          </Text>
        </View>
        <View style={{ gap: 7, marginTop: 8 }}>
          <Text style={styles.label}>Phone number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+63</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.phoneInput}
            />
          </View>
          <Text style={styles.helper}>We'll text a 6-digit code. Standard SMS rates apply.</Text>
        </View>
        <Press style={styles.cta} onPress={() => router.push("/onboarding/role")}>
          <Text style={styles.ctaLabel}>Send code</Text>
          <Icon name="arrowRight" size={16} color={palette.ink} strokeWidth={2.2} />
        </Press>
      </View>
      <Text style={styles.terms}>
        By continuing you agree to the Terms — you work with businesses directly as an independent
        contractor.{" "}
        <Text style={{ color: palette.slate, fontFamily: font.sansSemiBold }}>
          GigOn is free during the pilot; a small per-match fee for businesses is planned later.
        </Text>
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.white,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 28,
  },
  logoTile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: palette.royal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  wordmark: {
    fontFamily: font.displayBold,
    fontSize: 34,
    letterSpacing: -0.8,
    lineHeight: 38,
    color: palette.ink,
  },
  tagline: {
    fontFamily: font.displaySemiBold,
    fontSize: 17,
    color: palette.royal,
  },
  subtitle: {
    fontFamily: font.sans,
    fontSize: 13.5,
    lineHeight: 21,
    color: palette.slate,
    maxWidth: 260,
  },
  label: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  phoneRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    height: 48,
    overflow: "hidden",
  },
  prefix: {
    justifyContent: "center",
    paddingHorizontal: 13,
    backgroundColor: palette.tintSoft,
    borderRightWidth: 1,
    borderRightColor: palette.line,
  },
  prefixText: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: palette.slate,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 13,
    fontFamily: font.sansMedium,
    fontSize: 15,
    color: palette.ink,
  },
  helper: {
    fontFamily: font.sans,
    fontSize: 11.5,
    color: palette.muted,
  },
  cta: {
    height: 50,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 15,
    color: palette.ink,
  },
  terms: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    fontFamily: font.sans,
    fontSize: 10.5,
    lineHeight: 17,
    color: palette.muted,
  },
});
