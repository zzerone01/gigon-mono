import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "../../src/components/icon";
import { Press } from "../../src/components/ui";
import { useGigStore } from "../../src/store/gig-store";
import { font, palette, radius } from "../../src/theme";

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const phone = useGigStore((s) => s.phone);
  const verifyOtp = useGigStore((s) => s.verifyOtp);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const verify = async () => {
    if (busy || code.length !== 6) return;
    setBusy(true);
    setError("");
    const err = await verifyOtp(code);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    const profile = useGigStore.getState().profile;
    if (profile?.onboarded) {
      router.replace(
        profile.active_role === "employer" ? "/(employer)/postings" : "/(worker)/explore",
      );
    } else {
      router.replace("/onboarding/role");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Press style={styles.headerBtn} onPress={() => router.back()} haptic={false}>
          <Icon name="arrowLeft" size={19} color={palette.ink} />
        </Press>
      </View>
      <View style={styles.main}>
        <View style={{ gap: 7 }}>
          <Text style={styles.heading}>Enter the 6-digit code</Text>
          <Text style={styles.sub}>Sent by SMS to +{phone}</Text>
        </View>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          autoFocus
          placeholder="123456"
          placeholderTextColor={palette.lineDashed}
          style={styles.codeInput}
          onSubmitEditing={verify}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Press
          style={[styles.cta, (busy || code.length !== 6) && { opacity: 0.6 }]}
          onPress={verify}
          disabled={busy || code.length !== 6}
        >
          <Text style={styles.ctaLabel}>{busy ? "Checking…" : "Verify & continue"}</Text>
        </Press>
        <Press style={{ alignSelf: "center", padding: 8 }} onPress={() => router.back()} haptic={false}>
          <Text style={styles.altLabel}>Use a different number</Text>
        </Press>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.white,
  },
  header: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  heading: {
    fontFamily: font.displayBold,
    fontSize: 24,
    letterSpacing: -0.5,
    color: palette.ink,
  },
  sub: {
    fontFamily: font.sans,
    fontSize: 13,
    color: palette.slate,
  },
  codeInput: {
    height: 58,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    textAlign: "center",
    fontFamily: font.displayBold,
    fontSize: 24,
    letterSpacing: 12,
    color: palette.ink,
  },
  error: {
    fontFamily: font.sansSemiBold,
    fontSize: 12.5,
    color: palette.red,
    textAlign: "center",
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
  altLabel: {
    fontFamily: font.sans,
    fontSize: 12.5,
    color: palette.muted,
    textDecorationLine: "underline",
  },
});
