import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GIG_TYPE_ICON, Icon, IconName } from "../../src/components/icon";
import { Stepper } from "../../src/components/stepper";
import { Card, MonoBadge, Press, SectionLabel } from "../../src/components/ui";
import { WORKER_BADGES, gigById, useGigStore, workerStatusIndex } from "../../src/store/gig-store";
import { font, palette, radius } from "../../src/theme";

function HistoryRow({
  icon,
  title,
  meta,
  pay,
  stars,
}: {
  icon: IconName;
  title: string;
  meta: string;
  pay: string;
  stars: string;
}) {
  return (
    <View style={styles.histRow}>
      <View style={styles.histIcon}>
        <Icon name={icon} size={17} color={palette.slate} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.histTitle}>{title}</Text>
        <Text style={styles.histMeta}>{meta}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 3 }}>
        <Text style={styles.histPay}>{pay}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Icon name="check" size={10} color={palette.success} strokeWidth={3} />
          <Text style={styles.histPin}>PIN{stars ? ` · ${stars}★` : " verified"}</Text>
        </View>
      </View>
    </View>
  );
}

export default function MyGigsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wStatus = useGigStore((s) => s.wStatus);
  const wGig = useGigStore((s) => s.wGig);
  const hist = useGigStore((s) => s.hist);
  const gig = gigById(wGig);

  const hasCurrent = !!wStatus && wStatus !== "RATED";
  const badge = wStatus ? WORKER_BADGES[wStatus] : WORKER_BADGES.APPLIED;
  const stepIndex = wStatus ? workerStatusIndex[wStatus] : 0;
  const sub =
    wStatus === "APPLIED"
      ? "The business is reviewing applicants"
      : wStatus === "MATCHED"
        ? "Head over before 2:00 PM"
        : wStatus === "IN_PROGRESS"
          ? "On site — enter PIN when done & paid"
          : "Done today";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Gigs</Text>
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bgSoft }}
        contentContainerStyle={{ padding: 14, paddingBottom: 120, gap: 10 }}
      >
        {hasCurrent ? (
          <>
            <SectionLabel style={{ paddingHorizontal: 4 }}>Active</SectionLabel>
            <Card style={{ borderWidth: 1.5, borderColor: palette.royal, overflow: "hidden" }}>
              <View style={styles.activeTop}>
                <MonoBadge label={badge.t} bg={badge.bg} color={badge.c} />
                <Text style={styles.activeSub}>{sub}</Text>
              </View>
              <View style={styles.activeGigRow}>
                <View style={styles.gigIcon}>
                  <Icon name={GIG_TYPE_ICON[gig.type]!} size={20} color={palette.royal} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gigTitle}>{gig.t}</Text>
                  <Text style={styles.gigMeta}>
                    {gig.biz} · {gig.when}
                  </Text>
                </View>
                <Text style={styles.gigPay}>₱{gig.pay}</Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingTop: 2 }}>
                <Stepper codes={["APPLIED", "MATCHED", "ON SITE", "DONE"]} index={stepIndex} labels={false} />
              </View>
              <Press
                style={styles.activeCta}
                onPress={() =>
                  wStatus === "APPLIED"
                    ? router.push({ pathname: "/gig/[id]", params: { id: gig.id } })
                    : router.push("/active")
                }
              >
                <Text style={styles.activeCtaLabel}>
                  {wStatus === "APPLIED" ? "View application" : "Open gig"}
                </Text>
              </Press>
            </Card>
          </>
        ) : !wStatus ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon name="briefcase" size={22} color={palette.muted} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              Apply to a gig nearby and it shows up here with live status.
            </Text>
            <Press style={styles.emptyCta} onPress={() => router.push("/(worker)/explore")}>
              <Text style={styles.emptyCtaLabel}>Browse gigs</Text>
            </Press>
          </View>
        ) : null}

        {hist.length > 0 && (
          <SectionLabel style={{ paddingHorizontal: 4, paddingTop: 8 }}>History</SectionLabel>
        )}
        {hist.map((h) => (
          <HistoryRow
            key={h.id}
            icon={GIG_TYPE_ICON[h.type] ?? "briefcase"}
            title={h.t}
            meta={h.meta}
            pay={`₱${h.pay}`}
            stars=""
          />
        ))}
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  headerTitle: {
    fontFamily: font.displayBold,
    fontSize: 19,
    letterSpacing: -0.4,
    color: palette.ink,
  },
  activeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  activeSub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
  },
  activeGigRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  gigIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  gigTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  gigMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
  },
  gigPay: {
    fontFamily: font.displayBold,
    fontSize: 15,
    color: palette.royal,
  },
  activeCta: {
    height: 46,
    backgroundColor: palette.royal,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCtaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: palette.white,
  },
  emptyCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.lineDashed,
    borderRadius: 14,
    padding: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.white,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.tintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: palette.ink,
  },
  emptyBody: {
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: palette.slate,
    textAlign: "center",
    maxWidth: 220,
  },
  emptyCta: {
    height: 40,
    paddingHorizontal: 18,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  emptyCtaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  histRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: palette.white,
  },
  histIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: palette.tintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  histTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  histMeta: {
    fontFamily: font.sans,
    fontSize: 11.5,
    color: palette.muted,
  },
  histPay: {
    fontFamily: font.displayBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  histPin: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: palette.success,
  },
});
