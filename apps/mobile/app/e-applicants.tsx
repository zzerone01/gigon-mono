import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LiveDot } from "../src/components/animated-bits";
import { Icon } from "../src/components/icon";
import { Avatar, Card, Press } from "../src/components/ui";
import { applicantById, useGigStore } from "../src/store/gig-store";
import { font, palette, radius } from "../src/theme";

function Stat({ value, label, color, last }: { value: string; label: string; color: string; last?: boolean }) {
  return (
    <View style={[styles.stat, !last && { borderRightWidth: 1, borderRightColor: palette.lineSoft }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ApplicantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const apps = useGigStore((s) => s.apps);
  const noShowDone = useGigStore((s) => s.noShowDone);
  const openSheet = useGigStore((s) => s.openSheet);
  const posting = useGigStore((s) => s.posting);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Press style={styles.headerBtn} onPress={() => router.back()} haptic={false}>
          <Icon name="arrowLeft" size={19} color={palette.ink} />
        </Press>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Applicants</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {posting ? `${posting.title} · ${posting.meta}` : ""}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bgSoft }}
        contentContainerStyle={{ padding: 14, paddingBottom: 20, gap: 10 }}
      >
        {noShowDone && (
          <View style={styles.noShowBanner}>
            <Icon name="alertTriangle" size={15} color={palette.red} />
            <Text style={styles.noShowText}>
              <Text style={{ fontFamily: font.sansBold, color: palette.red }}>No-show recorded</Text>{" "}
              on the worker's profile — it shows on their future applications. Pick a replacement
              below.
            </Text>
          </View>
        )}

        {apps.length === 0 && (
          <View style={styles.waitingCard}>
            <LiveDot size={9} />
            <Text style={styles.waitingTitle}>Your gig is live</Text>
            <Text style={styles.waitingBody}>
              Workers within 3 km can see it now — applicants appear here in real time.
            </Text>
          </View>
        )}

        {apps.map((id) => {
          const a = applicantById(id);
          return (
            <Animated.View key={a.id} entering={FadeIn.duration(350)}>
              <Card style={{ overflow: "hidden" }}>
                <View style={styles.appTop}>
                  <Avatar initials={a.init} uri={a.photo} size={44} radiusOverride={12} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.appName}>{a.name}</Text>
                      {a.rt === "New" && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>New</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.appMeta}>
                      {a.tags} · {a.note}
                    </Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <Stat value={a.dist} label="AWAY" color={palette.royal} />
                  <Stat value={a.rt === "New" ? "New" : `${a.rt}★`} label="RATING" color={palette.ink} />
                  <Stat value={String(a.jobs)} label="GIGS" color={palette.ink} />
                  <Stat value={a.ns} label="HISTORY" color={a.nsBad ? palette.red : palette.success} last />
                </View>
                <View style={styles.actionsRow}>
                  <Press
                    style={styles.selectBtn}
                    onPress={() => openSheet("match", a.id)}
                  >
                    <Text style={styles.selectBtnLabel}>Select for this gig</Text>
                  </Press>
                  <Press style={styles.profileBtn} haptic={false}>
                    <Icon name="user" size={16} color={palette.slate} />
                  </Press>
                </View>
              </Card>
            </Animated.View>
          );
        })}

        <Text style={styles.footNote}>
          Ranked by distance. History shows no-shows and late cancels — recorded automatically by
          the app, not self-reported.
        </Text>

        <Press
          style={{ alignSelf: "center", padding: 2 }}
          onPress={() => openSheet("cancelPost")}
          haptic={false}
        >
          <Text style={styles.cancelPostLink}>Don't need help anymore? Cancel this posting</Text>
        </Press>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: font.displaySemiBold,
    fontSize: 16,
    color: palette.ink,
  },
  headerSub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
  },
  noShowBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: palette.redBorder,
    backgroundColor: palette.redBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  noShowText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18.5,
    color: palette.body,
  },
  waitingCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.lineDashed,
    borderRadius: 14,
    padding: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.white,
  },
  waitingTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  waitingBody: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18.5,
    color: palette.slate,
    textAlign: "center",
    maxWidth: 240,
  },
  appTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
  },
  appName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  newBadge: {
    backgroundColor: palette.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: font.sansBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: palette.royalDark,
  },
  appMeta: {
    fontFamily: font.sans,
    fontSize: 11.5,
    color: palette.muted,
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: palette.lineSoft,
    borderBottomWidth: 1,
    borderBottomColor: palette.lineSoft,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  statValue: {
    fontFamily: font.displayBold,
    fontSize: 12.5,
    textAlign: "center",
  },
  statLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 8.5,
    letterSpacing: 0.6,
    color: palette.muted,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 13,
  },
  selectBtn: {
    flex: 1,
    height: 42,
    backgroundColor: palette.royal,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  selectBtnLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: palette.white,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
  },
  footNote: {
    fontFamily: font.sans,
    fontSize: 11,
    lineHeight: 17,
    color: palette.muted,
    textAlign: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  cancelPostLink: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
    textDecorationLine: "underline",
  },
});
