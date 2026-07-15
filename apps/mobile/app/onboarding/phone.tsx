import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "../../src/components/icon";
import { Press } from "../../src/components/ui";
import { useGigStore } from "../../src/store/gig-store";
import { font, palette, radius } from "../../src/theme";

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sendOtp = useGigStore((s) => s.sendOtp);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    const err = await sendOtp(phone);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/onboarding/otp");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 10 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.main}>
          <View style={styles.logoTile}>
            <Icon name="logo" size={28} color={palette.white} strokeWidth={2.4} />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={styles.wordmark}>GigOn</Text>
            <Text style={styles.tagline}>Your gig is on.</Text>
            <Text style={styles.subtitle}>
              Short, local gigs matched with trusted people nearby — in the Philippines.
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
                placeholder="917 123 4001"
                placeholderTextColor={palette.muted}
                style={styles.phoneInput}
              />
            </View>
            <Text style={styles.helper}>We'll text a 6-digit code. Standard SMS rates apply.</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>
          <Press style={[styles.cta, busy && { opacity: 0.6 }]} onPress={send} disabled={busy}>
            <Text style={styles.ctaLabel}>{busy ? "Sending…" : "Send code"}</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.white,
  },
  // flexGrow (not flex) throughout: on a tall phone the content still centres in
  // the leftover space, but once the keyboard shrinks the viewport — iPhone SE,
  // or the 375x667 canvas iPad compatibility mode hands us — the block keeps its
  // natural height and the ScrollView scrolls instead of overlapping the terms.
  scroll: {
    flexGrow: 1,
  },
  main: {
    flexGrow: 1,
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
  error: {
    fontFamily: font.sansSemiBold,
    fontSize: 12.5,
    color: palette.red,
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
