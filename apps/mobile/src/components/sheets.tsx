import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DISPUTE_REASONS, applicantById } from "../data/mock";
import { useGigStore } from "../store/gig-store";
import { font, palette, radius } from "../theme";
import { Icon } from "./icon";
import { Press } from "./ui";

/**
 * Global bottom-sheet host: match confirmation, no-show report and
 * dispute filing — matching the design's overlays.
 */
export function SheetHost() {
  const sheet = useGigStore((s) => s.sheet);
  if (!sheet) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Backdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetArea}
        pointerEvents="box-none"
      >
        {sheet === "match" && <MatchSheet />}
        {sheet === "noshow" && <NoShowSheet />}
        {sheet === "dispute" && <DisputeSheet />}
      </KeyboardAvoidingView>
    </View>
  );
}

function Backdrop() {
  const closeSheet = useGigStore((s) => s.closeSheet);
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: palette.backdrop }]} onPress={closeSheet} />
    </Animated.View>
  );
}

function SheetCard({ children, docked = false }: { children: React.ReactNode; docked?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={SlideInDown.duration(320).springify().damping(24)}
      exiting={SlideOutDown.duration(200)}
      style={[
        styles.card,
        docked
          ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginHorizontal: 0, paddingBottom: insets.bottom + 20 }
          : { marginBottom: insets.bottom + 16 },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function MatchSheet() {
  const confirmId = useGigStore((s) => s.confirmId);
  const closeSheet = useGigStore((s) => s.closeSheet);
  const confirmMatch = useGigStore((s) => s.confirmMatch);
  const router = useRouter();
  const a = applicantById(confirmId);
  const line = `${a.rt === "New" ? "New" : `${a.rt}★`} · ${a.jobs} gigs · ${a.ns} · ${a.dist}`;

  return (
    <SheetCard>
      <View style={styles.iconTile}>
        <Icon name="logo" size={22} color={palette.royal} strokeWidth={2.2} />
      </View>
      <View style={{ gap: 5 }}>
        <Text style={styles.title}>Match with {a.name}?</Text>
        <Text style={styles.metaLine}>{line}</Text>
        <Text style={styles.bodyText}>
          She'll be notified to accept and chat opens right away. Matching is{" "}
          <Text style={{ fontFamily: font.sansBold }}>free during the pilot</Text> — logged as a
          billable event (₱0).
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <Press style={[styles.btn, styles.btnGhost, { flex: 1 }]} onPress={closeSheet}>
          <Text style={styles.btnGhostLabel}>Cancel</Text>
        </Press>
        <Press
          style={[styles.btn, { flex: 1.4, backgroundColor: palette.amber }]}
          onPress={() => {
            confirmMatch();
            router.replace("/e-active");
          }}
        >
          <Text style={styles.btnLabel}>Confirm match</Text>
        </Press>
      </View>
    </SheetCard>
  );
}

function NoShowSheet() {
  const closeSheet = useGigStore((s) => s.closeSheet);
  const reportNoShow = useGigStore((s) => s.reportNoShow);
  const router = useRouter();

  return (
    <SheetCard>
      <View style={[styles.iconTile, { backgroundColor: palette.redBg }]}>
        <Icon name="alertTriangle" size={22} color={palette.red} />
      </View>
      <View style={{ gap: 5 }}>
        <Text style={styles.title}>Report a no-show?</Text>
        <Text style={styles.bodyText}>
          The 30-minute grace period has passed <Text style={{ color: palette.muted }}>(demo: skipped)</Text>.
          This is recorded on Analyn's profile and shown to future businesses. Your gig reopens for
          the other applicants.
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <Press style={[styles.btn, styles.btnGhost, { flex: 1 }]} onPress={closeSheet}>
          <Text style={styles.btnGhostLabel}>Cancel</Text>
        </Press>
        <Press
          style={[styles.btn, { flex: 1.4, backgroundColor: palette.red }]}
          onPress={() => {
            reportNoShow();
            router.replace("/e-applicants");
          }}
        >
          <Text style={[styles.btnLabel, { color: palette.white }]}>Record no-show</Text>
        </Press>
      </View>
    </SheetCard>
  );
}

function DisputeSheet() {
  const closeSheet = useGigStore((s) => s.closeSheet);
  const dReason = useGigStore((s) => s.dReason);
  const dText = useGigStore((s) => s.dText);
  const setDReason = useGigStore((s) => s.setDReason);
  const setDText = useGigStore((s) => s.setDText);
  const fileDispute = useGigStore((s) => s.fileDispute);
  const canSubmit = dReason >= 0;

  return (
    <SheetCard docked>
      <View style={styles.grabber} />
      <View style={styles.disputeHeader}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title}>Open a dispute</Text>
          <Text style={styles.metaLine}>
            For PIN or payment mismatches. The GigOn team reviews within 24 h — outcomes affect
            reputation, not pay.
          </Text>
        </View>
        <Press style={styles.closeBtn} onPress={closeSheet} haptic={false}>
          <Icon name="x" size={15} color={palette.slate} strokeWidth={2.2} />
        </Press>
      </View>
      <View style={{ gap: 7 }}>
        {DISPUTE_REASONS.map((label, i) => {
          const on = dReason === i;
          return (
            <Press
              key={label}
              onPress={() => setDReason(i)}
              style={[
                styles.reasonRow,
                {
                  backgroundColor: on ? palette.tintSoft : palette.white,
                  borderColor: on ? palette.royal : palette.line,
                },
              ]}
            >
              <View style={[styles.radio, { borderColor: on ? palette.royal : palette.lineDashed }]}>
                {on && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.reasonLabel}>{label}</Text>
            </Press>
          );
        })}
      </View>
      <TextInput
        value={dText}
        onChangeText={setDText}
        placeholder="What happened? (a sentence is enough)"
        placeholderTextColor={palette.muted}
        multiline
        style={styles.textArea}
      />
      <Press style={styles.photoBtn} haptic={false}>
        <Icon name="camera" size={15} color={palette.slate} />
        <Text style={styles.photoLabel}>Add a photo (optional)</Text>
      </Press>
      <Press
        style={[
          styles.btn,
          { height: 50, backgroundColor: canSubmit ? palette.royal : palette.line },
        ]}
        onPress={fileDispute}
        disabled={!canSubmit}
      >
        <Text style={[styles.btnLabel, { color: canSubmit ? palette.white : palette.muted, fontSize: 14.5 }]}>
          Open dispute
        </Text>
      </Press>
    </SheetCard>
  );
}

const styles = StyleSheet.create({
  sheetArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 18,
    marginHorizontal: 14,
    padding: 20,
    gap: 13,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 48,
    elevation: 16,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    alignSelf: "center",
    marginTop: -6,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: font.displaySemiBold,
    fontSize: 18,
    letterSpacing: -0.2,
    color: palette.ink,
  },
  metaLine: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.slate,
    lineHeight: 18,
  },
  bodyText: {
    fontFamily: font.sans,
    fontSize: 12.5,
    color: palette.body,
    lineHeight: 19.5,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  btn: {
    height: 46,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  btnGhostLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  btnLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  disputeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: palette.tintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.royal,
  },
  reasonLabel: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: palette.ink,
  },
  textArea: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: font.sans,
    fontSize: 13,
    color: palette.ink,
    textAlignVertical: "top",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.lineDashed,
    borderRadius: 12,
  },
  photoLabel: {
    fontFamily: font.sansMedium,
    fontSize: 12.5,
    color: palette.slate,
  },
});
