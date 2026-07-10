import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "../src/components/icon";
import { Press } from "../src/components/ui";
import { firstName } from "../src/data/mock";
import { gigById, useGigStore } from "../src/store/gig-store";
import { font, palette, radius } from "../src/theme";

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wStatus = useGigStore((s) => s.wStatus);
  const wGig = useGigStore((s) => s.wGig);
  const pin = useGigStore((s) => s.pin);
  const pinErr = useGigStore((s) => s.pinErr);
  const pinLock = useGigStore((s) => s.pinLock);
  const enterPinDigit = useGigStore((s) => s.enterPinDigit);
  const deletePinDigit = useGigStore((s) => s.deletePinDigit);

  const gig = gigById(wGig);
  const efirst = firstName(gig.er);
  const locked = pinLock > 0;
  const [showHow, setShowHow] = useState(false);

  // shake on error
  const shakeX = useSharedValue(0);
  useEffect(() => {
    if (pinErr && !locked) {
      shakeX.value = withSequence(
        withTiming(-6, { duration: 80 }),
        withTiming(6, { duration: 80 }),
        withTiming(-4, { duration: 80 }),
        withTiming(4, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
    }
  }, [pinErr, locked, shakeX]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  // PIN verified → hand off to the rating screen
  useEffect(() => {
    if (wStatus === "COMPLETED") router.replace("/rate");
  }, [wStatus, router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Press style={styles.headerBtn} onPress={() => router.back()} haptic={false}>
          <Icon name="arrowLeft" size={19} color={palette.ink} />
        </Press>
      </View>
      <View style={styles.main}>
        <View style={{ gap: 7 }}>
          <Text style={styles.heading}>Enter completion PIN</Text>
          <Text style={styles.sub}>
            Ask {efirst} for the 4-digit PIN — issued after you've been paid in cash.
          </Text>
          <Press
            onPress={() => setShowHow((v) => !v)}
            haptic={false}
            style={{ alignSelf: "flex-start", paddingVertical: 2 }}
          >
            <Text style={styles.howLink}>{showHow ? "Hide" : "How does the PIN work?"}</Text>
          </Press>
        </View>

        {showHow && (
          <View style={styles.howBox}>
            <Text style={styles.howText}>1 · Finish the job and get paid in cash.</Text>
            <Text style={styles.howText}>
              2 · {efirst} issues a 4-digit PIN in their app and tells it to you.
            </Text>
            <Text style={styles.howText}>
              3 · Enter it here — the gig is marked completed for both sides and reviews unlock.
            </Text>
            <Text style={[styles.howText, { color: palette.muted }]}>
              If it's never entered, the gig stays open: no review and no +1 on your completed
              count. The PIN is valid 24 h and never moves money.
            </Text>
          </View>
        )}

        <Animated.View style={[styles.boxRow, shakeStyle]}>
          {[0, 1, 2, 3].map((i) => {
            const value = pin[i] ?? "";
            const isActive = i === pin.length;
            const borderColor =
              pinErr && !locked
                ? palette.red
                : isActive || value
                  ? palette.royal
                  : palette.line;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  { borderColor, backgroundColor: value ? palette.tintSoft : palette.white },
                ]}
              >
                <Text style={styles.boxText}>{value}</Text>
              </View>
            );
          })}
        </Animated.View>

        {!!pinErr && !locked && <Text style={styles.errText}>{pinErr}</Text>}

        {locked && (
          <View style={styles.lockRow}>
            <Icon name="clock" size={14} color={palette.body} />
            <Text style={styles.lockText}>
              Locked — try again in <Text style={styles.lockSec}>{pinLock}s</Text> · or ask {efirst}{" "}
              to re-issue
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <View style={styles.pad}>
          {PAD_KEYS.map((key, i) => (
            <Press
              key={i}
              disabled={key === "" || locked}
              onPress={() => (key === "⌫" ? deletePinDigit() : enterPinDigit(key))}
              style={[
                styles.padKey,
                { backgroundColor: key === "⌫" ? palette.white : palette.bgSoft },
                key === "" && { opacity: 0 },
                locked && { opacity: 0.4 },
              ]}
              haptic={false}
            >
              <Text style={styles.padKeyText}>{key}</Text>
            </Press>
          ))}
        </View>

        <View style={{ gap: 8, alignItems: "center" }}>
          <Text style={styles.footNote}>
            The PIN records that both sides agree the gig is complete. It doesn't verify payment or
            move money.
          </Text>
        </View>
      </View>
    </View>
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
    paddingHorizontal: 26,
    paddingTop: 4,
    gap: 15,
  },
  heading: {
    fontFamily: font.displayBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: palette.ink,
  },
  sub: {
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 20,
    color: palette.slate,
  },
  howLink: {
    fontFamily: font.sansSemiBold,
    fontSize: 12,
    color: palette.royal,
    textDecorationLine: "underline",
  },
  howBox: {
    gap: 6,
    backgroundColor: palette.bgSoft,
    borderRadius: 12,
    padding: 13,
  },
  howText: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18,
    color: palette.body,
  },
  boxRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  box: {
    width: 56,
    height: 64,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  boxText: {
    fontFamily: font.displayBold,
    fontSize: 28,
    color: palette.ink,
  },
  errText: {
    fontFamily: font.sansSemiBold,
    fontSize: 12.5,
    color: palette.red,
    textAlign: "center",
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.bgSoft,
    borderRadius: radius.sm,
    padding: 11,
  },
  lockText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.body,
  },
  lockSec: {
    fontFamily: font.mono,
    fontWeight: "700",
  },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  padKey: {
    width: "31.5%",
    flexGrow: 1,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  padKeyText: {
    fontFamily: font.sansSemiBold,
    fontSize: 22,
    color: palette.ink,
  },
  footNote: {
    fontFamily: font.sans,
    fontSize: 11,
    lineHeight: 17,
    color: palette.muted,
    textAlign: "center",
    maxWidth: 280,
  },
});
