import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LiveDot } from "../../src/components/animated-bits";
import { Icon } from "../../src/components/icon";
import { Card, MonoBadge, Press, SectionLabel } from "../../src/components/ui";
import { firstName, initials } from "../../src/data/mock";
import { EMPLOYER_BADGES, applicantById, useGigStore } from "../../src/store/gig-store";
import { font, palette, radius } from "../../src/theme";

export default function PostingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useGigStore((s) => s.profile);
  const posted = useGigStore((s) => s.posted);
  const posting = useGigStore((s) => s.posting);
  const eStatus = useGigStore((s) => s.eStatus);
  const apps = useGigStore((s) => s.apps);
  const matchedId = useGigStore((s) => s.matchedId);

  const matched = applicantById(matchedId);
  const badge = eStatus ? EMPLOYER_BADGES[eStatus] : EMPLOYER_BADGES.POSTED;
  const appsLine =
    eStatus === "POSTED"
      ? apps.length === 0
        ? "Waiting for applicants…"
        : `${apps.length} applicant${apps.length > 1 ? "s" : ""} — compare & select`
      : eStatus === "RATED"
        ? "Completed & rated ✓"
        : `Matched with ${matched.name}`;
  const cta =
    eStatus === "POSTED"
      ? "View applicants"
      : eStatus === "COMPLETED"
        ? `Rate ${firstName(matched.name)}`
        : eStatus === "RATED"
          ? "View summary"
          : "Open gig";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandTile}>
            <Icon name="logo" size={14} color={palette.white} strokeWidth={2.4} />
          </View>
          <Text style={styles.brand}>GigOn</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Business</Text>
          </View>
        </View>
        <View style={styles.zoneChip}>
          <Icon name="mapPin" size={13} color={palette.royal} strokeWidth={2.2} />
          <Text style={styles.zoneChipText}>
            {profile?.business_name ?? "Your business"} · {profile?.area ?? "Philippines"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bgSoft }}
        contentContainerStyle={{ padding: 14, paddingTop: 12, paddingBottom: 120, gap: 10 }}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your postings</Text>
          <Press style={styles.postBtn} onPress={() => router.push("/post")}>
            <Icon name="plus" size={14} color={palette.ink} strokeWidth={2.4} />
            <Text style={styles.postBtnLabel}>Post a gig</Text>
          </Press>
        </View>

        {posted && posting ? (
          <Card style={{ borderWidth: 1.5, borderColor: palette.royal, overflow: "hidden" }}>
            <View style={styles.liveTop}>
              <MonoBadge label={badge.t} bg={badge.bg} color={badge.c} />
              <Text style={styles.expires}>
                {posting.status === "POSTED" ? `expires in ${posting.expiresIn} h` : ""}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 14, paddingTop: 11, paddingBottom: 12, gap: 3 }}>
              <Text style={styles.liveTitle}>{posting.title}</Text>
              <Text style={styles.liveMeta}>{posting.meta}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 6 }}>
                {eStatus === "POSTED" && <LiveDot />}
                <Text style={styles.appsLine}>{appsLine}</Text>
              </View>
            </View>
            <Press
              style={styles.liveCta}
              onPress={() =>
                router.push(
                  eStatus === "POSTED"
                    ? "/e-applicants"
                    : eStatus === "COMPLETED"
                      ? "/e-rate"
                      : "/e-active",
                )
              }
            >
              <Text style={styles.liveCtaLabel}>{cta}</Text>
            </Press>
          </Card>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon name="plus" size={24} color={palette.royal} />
            </View>
            <Text style={styles.emptyTitle}>Need hands fast?</Text>
            <Text style={styles.emptyBody}>
              Post a 1–3 hour gig and match with workers within walking distance — in minutes, not
              days.
            </Text>
            <Press style={styles.emptyCta} onPress={() => router.push("/post")}>
              <Text style={styles.emptyCtaLabel}>Post a gig — free</Text>
            </Press>
          </View>
        )}

        <View style={styles.feeBanner}>
          <Icon name="info" size={15} color={palette.royalDark} />
          <Text style={styles.feeBannerText}>
            Posting is free. When you match, we log a billable event —{" "}
            <Text style={{ fontFamily: font.sansBold }}>₱0 during the pilot</Text>; a small
            per-match fee comes later.
          </Text>
        </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTile: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: palette.royal,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: font.displayBold,
    fontSize: 19,
    letterSpacing: -0.4,
    color: palette.ink,
  },
  roleBadge: {
    backgroundColor: palette.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontFamily: font.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: palette.royalDark,
  },
  zoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.tintSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  zoneChipText: {
    fontFamily: font.sansSemiBold,
    fontSize: 12,
    color: palette.royalDark,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  title: {
    fontFamily: font.displaySemiBold,
    fontSize: 17,
    color: palette.ink,
  },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 15,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
  },
  postBtnLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 12.5,
    color: palette.ink,
  },
  liveTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  expires: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
  },
  liveTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  liveMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
  },
  appsLine: {
    fontFamily: font.sansSemiBold,
    fontSize: 12.5,
    color: palette.royal,
  },
  liveCta: {
    height: 46,
    backgroundColor: palette.royal,
    alignItems: "center",
    justifyContent: "center",
  },
  liveCtaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: palette.white,
  },
  emptyCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.lineDashed,
    borderRadius: 18,
    padding: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.white,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: palette.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: font.displaySemiBold,
    fontSize: 15,
    color: palette.ink,
  },
  emptyBody: {
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 19.5,
    color: palette.slate,
    textAlign: "center",
    maxWidth: 240,
  },
  emptyCta: {
    height: 42,
    paddingHorizontal: 20,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  emptyCtaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  pastRow: {
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
  pastIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: palette.tintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pastTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  pastMeta: {
    fontFamily: font.sans,
    fontSize: 11.5,
    color: palette.muted,
  },
  pastPin: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: palette.success,
  },
  feeBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    paddingVertical: 13,
    backgroundColor: palette.tint,
    borderRadius: 14,
  },
  feeBannerText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 11.5,
    lineHeight: 18,
    color: palette.royalDark,
  },
});
