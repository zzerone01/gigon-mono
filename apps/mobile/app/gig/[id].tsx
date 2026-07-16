import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GIG_TYPE_ICON, Icon } from "../../src/components/icon";
import { DetailMapArt, PricePin } from "../../src/components/maps";
import { Avatar, Press } from "../../src/components/ui";
import { gigById, useGigStore } from "../../src/store/gig-store";
import { font, palette, radius } from "../../src/theme";

export default function GigDetailScreen() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gig = gigById(id);
  const applied = useGigStore((s) => !!s.applied[gig.id]);
  const apply = useGigStore((s) => s.apply);
  const isPreview = preview === "1";

  return (
    <View style={styles.screen}>
      {/* map header */}
      <View style={[styles.mapHeader, { height: 164 + insets.top }]}>
        <DetailMapArt />
        <View style={styles.pinAnchor}>
          <View style={styles.pinInner}>
            <PricePin label={`₱${gig.pay}`} />
          </View>
        </View>
        <View style={styles.youAnchor}>
          <View style={styles.youDot} />
        </View>
        <Press
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
          haptic={false}
        >
          <Icon name="arrowLeft" size={19} color={palette.ink} />
        </Press>
        <View style={styles.distChip}>
          <Text style={styles.distChipText}>{gig.dist} from you</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {isPreview && (
          <View style={styles.previewBanner}>
            <Icon name="info" size={14} color={palette.royalDark} />
            <Text style={styles.previewBannerText}>
              Live! This is how workers see your post.
            </Text>
          </View>
        )}
        <View style={{ gap: 6 }}>
          <View style={styles.metaRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{gig.type}</Text>
            </View>
            <Text style={styles.postedText}>{gig.slots} · posted 20 min ago</Text>
          </View>
          <Text style={styles.title}>{gig.t}</Text>
          <View style={styles.payRow}>
            <Text style={styles.pay}>₱{gig.pay}</Text>
            <Text style={styles.payMeta}>{gig.hrs} · cash on completion</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: palette.lineSoft }]}>
            <Icon name="clock" size={16} color={palette.slate} />
            <Text style={styles.infoText}>{gig.when}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="mapPin" size={16} color={palette.slate} />
            <Text style={styles.infoText}>
              {gig.biz}, {gig.area} —{" "}
              <Text style={{ color: palette.royal, fontFamily: font.sansSemiBold }}>
                {gig.dist} away
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.employerCard}>
          <Avatar initials={gig.einit} uri={gig.ephoto} size={42} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.employerNameRow}>
              <Text style={styles.employerName}>{gig.er}</Text>
              <View style={styles.verifiedChip}>
                <Icon name="shield" size={10} color={palette.success} strokeWidth={2.4} />
                <Text style={styles.verifiedText}>Invite-verified</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Icon name="star" size={12} fill={palette.amber} />
              <Text style={styles.employerMeta}>
                {gig.erate}
                {gig.ereviews > 0 ? ` (${gig.ereviews} reviews)` : ""} · {gig.ejobs} gigs · since{" "}
                {gig.since}
              </Text>
            </View>
          </View>
          <Icon name="chevronRight" size={16} color={palette.lineDashed} />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.sectionLabel}>About this gig</Text>
          <Text style={styles.desc}>{gig.desc}</Text>
        </View>

        <View style={styles.trustBox}>
          <View style={styles.trustRow}>
            <Icon name="card" size={15} color={palette.royal} />
            <Text style={styles.trustText}>
              <Text style={{ fontFamily: font.sansSemiBold }}>Cash, direct.</Text> You're paid ₱
              {gig.pay} on the spot and keep 100% — GigOn never touches wages.
            </Text>
          </View>
          <View style={styles.trustRow}>
            <Icon name="shield" size={15} color={palette.royal} />
            <Text style={styles.trustText}>
              <Text style={{ fontFamily: font.sansSemiBold }}>Confirmed by both sides.</Text> A
              one-time PIN closes the gig — that's what unlocks reviews.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isPreview ? (
          <>
            <Press
              style={[styles.cta, { backgroundColor: palette.royal }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.ctaLabel, { color: palette.white }]}>Done — back to postings</Text>
            </Press>
            <Text style={styles.footerNote}>
              Workers see an “Apply — 1 tap” button here.
            </Text>
          </>
        ) : (
          <>
            <Press
              style={[
                styles.cta,
                applied
                  ? { backgroundColor: palette.white, borderWidth: 1.5, borderColor: palette.royal }
                  : { backgroundColor: palette.amber },
              ]}
              onPress={() => apply(gig.id)}
              disabled={applied}
              haptic={!applied}
            >
              <Text style={[styles.ctaLabel, { color: applied ? palette.royal : palette.ink }]}>
                {applied ? "Applied ✓ — waiting for reply" : "Apply — 1 tap"}
              </Text>
            </Press>
            <Text style={styles.footerNote}>
              One tap — no cover letter. The business sees your rating and history.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.white,
  },
  mapHeader: {
    backgroundColor: palette.tintSoft,
    overflow: "hidden",
  },
  pinAnchor: {
    position: "absolute",
    left: "50%",
    top: "48%",
    width: 0,
    height: 0,
  },
  pinInner: {
    position: "absolute",
    bottom: 0,
    width: 120,
    marginLeft: -60,
    alignItems: "center",
  },
  youAnchor: {
    position: "absolute",
    left: "36%",
    top: "74%",
  },
  youDot: {
    width: 13,
    height: 13,
    borderRadius: 999,
    backgroundColor: palette.amber,
    borderWidth: 2.5,
    borderColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    position: "absolute",
    left: 12,
    width: 42,
    height: 42,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  distChip: {
    position: "absolute",
    right: 12,
    bottom: 10,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  distChipText: {
    fontFamily: font.sansSemiBold,
    fontSize: 11,
    color: palette.royal,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 13,
  },
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.tint,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  previewBannerText: {
    flex: 1,
    fontFamily: font.sansSemiBold,
    fontSize: 12,
    color: palette.royalDark,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    backgroundColor: palette.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontFamily: font.sansSemiBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: palette.royalDark,
  },
  postedText: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: 21,
    letterSpacing: -0.4,
    lineHeight: 25,
    color: palette.ink,
  },
  payRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  pay: {
    fontFamily: font.displayBold,
    fontSize: 25,
    letterSpacing: -0.5,
    color: palette.royal,
  },
  payMeta: {
    fontFamily: font.sans,
    fontSize: 12.5,
    color: palette.slate,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  infoText: {
    flex: 1,
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: palette.ink,
  },
  employerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  employerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  employerName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: palette.ink,
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: palette.successBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: {
    fontFamily: font.sansSemiBold,
    fontSize: 10,
    color: palette.success,
  },
  employerMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.slate,
  },
  sectionLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: palette.amberDark,
  },
  desc: {
    fontFamily: font.sans,
    fontSize: 13.5,
    lineHeight: 21.5,
    color: palette.body,
  },
  trustBox: {
    gap: 9,
    padding: 14,
    backgroundColor: palette.bgSoft,
    borderRadius: 14,
  },
  trustRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  trustText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18.5,
    color: palette.body,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: palette.white,
  },
  cta: {
    height: 52,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 15,
  },
  footerNote: {
    fontFamily: font.sans,
    fontSize: 10.5,
    color: palette.muted,
    textAlign: "center",
    marginTop: 8,
  },
});
