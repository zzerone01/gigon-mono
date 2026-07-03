import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pop } from "../src/components/animated-bits";
import { GIG_TYPE_ICON, Icon } from "../src/components/icon";
import { Stepper } from "../src/components/stepper";
import { Avatar, MonoBadge, Press } from "../src/components/ui";
import { firstName, gigById } from "../src/data/mock";
import { WORKER_BADGES, useGigStore, workerStatusIndex } from "../src/store/gig-store";
import { font, palette, radius } from "../src/theme";

export default function ActiveGigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wStatus = useGigStore((s) => s.wStatus);
  const wGig = useGigStore((s) => s.wGig);
  const unread = useGigStore((s) => s.unread);
  const dFiled = useGigStore((s) => s.dFiled);
  const arrive = useGigStore((s) => s.arrive);
  const markChatRead = useGigStore((s) => s.markChatRead);
  const openSheet = useGigStore((s) => s.openSheet);

  const gig = gigById(wGig);
  const status = wStatus ?? "APPLIED";
  const badge = WORKER_BADGES[status];
  const completed = status === "COMPLETED" || status === "RATED";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Press style={styles.headerBtn} onPress={() => router.back()} haptic={false}>
          <Icon name="arrowLeft" size={19} color={palette.ink} />
        </Press>
        <Text style={styles.headerTitle}>Current gig</Text>
        <MonoBadge label={badge.t} bg={badge.bg} color={badge.c} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 13 }}
      >
        <View style={{ paddingHorizontal: 2 }}>
          <Stepper codes={["APPLIED", "MATCHED", "ON SITE", "DONE"]} index={workerStatusIndex[status]} />
        </View>

        {status === "MATCHED" && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.matchedBanner}>
            <View style={styles.matchedIcon}>
              <Icon name="logo" size={20} color={palette.amber} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.matchedTitle}>Your gig is on.</Text>
              <Text style={styles.matchedBody}>
                {gig.biz} picked you. Head over and tap “I've arrived” when you're there.
              </Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.rowCard}>
          <View style={styles.gigIcon}>
            <Icon name={GIG_TYPE_ICON[gig.type]!} size={20} color={palette.royal} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gigTitle}>{gig.t}</Text>
            <Text style={styles.gigMeta}>
              {gig.when} · {gig.dist}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 1 }}>
            <Text style={styles.gigPay}>₱{gig.pay}</Text>
            <Text style={styles.gigPayMeta}>cash</Text>
          </View>
        </View>

        <View style={[styles.rowCard, { paddingVertical: 11 }]}>
          <Avatar initials={gig.einit} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={styles.erName}>{gig.er}</Text>
            <Text style={styles.gigMeta}>
              {gig.biz} · {gig.erate}★
            </Text>
          </View>
          <Press
            style={styles.chatBtn}
            onPress={() => {
              markChatRead();
              router.push("/chat-room");
            }}
            haptic={false}
          >
            <Icon name="message" size={14} color={palette.ink} />
            <Text style={styles.chatBtnLabel}>Chat</Text>
            {unread > 0 && <View style={styles.unreadDot} />}
          </Press>
        </View>

        {dFiled && (
          <View style={styles.disputeBanner}>
            <Icon name="alertTriangle" size={15} color={palette.red} />
            <Text style={styles.disputeBannerText}>
              <Text style={{ fontFamily: font.sansBold, color: palette.red }}>
                Dispute #D-1042 open · DISPUTED.
              </Text>{" "}
              The GigOn team reviews within 24 h. Outcomes affect reputation, not pay.
            </Text>
          </View>
        )}

        {status === "MATCHED" && (
          <View style={{ gap: 10, marginTop: 2 }}>
            <Press style={styles.arriveCta} onPress={arrive}>
              <Icon name="navigate" size={17} color={palette.ink} strokeWidth={2.2} />
              <Text style={styles.arriveCtaLabel}>I've arrived</Text>
            </Press>
            <Text style={styles.arriveNote}>
              Tap when you're at {gig.biz} — this starts the gig (IN_PROGRESS).{"\n"}No background
              GPS: arrival is always your tap.
            </Text>
          </View>
        )}

        {status === "IN_PROGRESS" && (
          <View style={styles.pinCard}>
            <View style={{ flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
              <View style={styles.pinDots}>
                <Text style={styles.pinDotsText}>···</Text>
              </View>
              <Text style={styles.pinCardText}>
                <Text style={{ fontFamily: font.sansSemiBold, color: palette.ink }}>
                  Done and paid in cash?
                </Text>{" "}
                Ask {firstName(gig.er)} for the 4-digit completion PIN, then enter it to close the
                gig.
              </Text>
            </View>
            <Press style={styles.pinCta} onPress={() => router.push("/pin")}>
              <Text style={styles.pinCtaLabel}>Enter completion PIN</Text>
            </Press>
          </View>
        )}

        {completed && (
          <View style={styles.doneCard}>
            <Pop>
              <View style={styles.doneCheck}>
                <Icon name="check" size={24} color={palette.white} strokeWidth={2.6} />
              </View>
            </Pop>
            <Text style={styles.doneTitle}>COMPLETED — PIN verified</Text>
            <Text style={styles.doneBody}>
              Logged in the append-only audit trail. Reviews are unlocked for both sides.
            </Text>
            {status === "COMPLETED" && (
              <Press style={styles.rateCta} onPress={() => router.push("/rate")}>
                <Text style={styles.rateCtaLabel}>Rate {firstName(gig.er)}</Text>
              </Press>
            )}
            {status === "RATED" && <Text style={styles.ratedText}>Review posted ✓</Text>}
          </View>
        )}

        <View style={styles.cashNote}>
          <Icon name="card" size={15} color={palette.slate} />
          <Text style={styles.cashNoteText}>
            Pay is 100% cash, on the spot. The PIN records that both sides agree the job is done —
            it never moves money.
          </Text>
        </View>

        {!dFiled && (status === "IN_PROGRESS" || status === "COMPLETED") && (
          <Press style={{ alignSelf: "center", padding: 2 }} onPress={() => openSheet("dispute")} haptic={false}>
            <Text style={styles.disputeLink}>Something wrong? Open a dispute</Text>
          </Press>
        )}
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
    flex: 1,
    fontFamily: font.displaySemiBold,
    fontSize: 16,
    color: palette.ink,
  },
  matchedBanner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: palette.royal,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  matchedIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchedTitle: {
    fontFamily: font.displaySemiBold,
    fontSize: 15,
    color: palette.white,
  },
  matchedBody: {
    fontFamily: font.sans,
    fontSize: 11.5,
    lineHeight: 16.5,
    color: palette.onNavyMuted,
  },
  rowCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    fontSize: 16,
    color: palette.royal,
  },
  gigPayMeta: {
    fontFamily: font.sans,
    fontSize: 10.5,
    color: palette.muted,
  },
  erName: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 38,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    backgroundColor: palette.white,
  },
  chatBtnLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 12.5,
    color: palette.ink,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: palette.amber,
  },
  disputeBanner: {
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
  disputeBannerText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18.5,
    color: palette.body,
  },
  arriveCta: {
    height: 54,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  arriveCtaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 15,
    color: palette.ink,
  },
  arriveNote: {
    fontFamily: font.sans,
    fontSize: 11.5,
    lineHeight: 18,
    color: palette.muted,
    textAlign: "center",
  },
  pinCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    padding: 14,
  },
  pinDots: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDotsText: {
    fontFamily: font.mono,
    fontSize: 12,
    fontWeight: "700",
    color: palette.white,
  },
  pinCardText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 19.5,
    color: palette.body,
  },
  pinCta: {
    height: 50,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  pinCtaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  doneCard: {
    borderWidth: 1.5,
    borderColor: palette.successBorder,
    backgroundColor: palette.successBg,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  doneCheck: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.success,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: {
    fontFamily: font.displaySemiBold,
    fontSize: 15,
    color: palette.ink,
  },
  doneBody: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18,
    color: palette.body,
    textAlign: "center",
  },
  rateCta: {
    height: 42,
    paddingHorizontal: 20,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rateCtaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  ratedText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: palette.success,
  },
  cashNote: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    paddingVertical: 13,
    backgroundColor: palette.bgSoft,
    borderRadius: 14,
  },
  cashNoteText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 11.5,
    lineHeight: 18,
    color: palette.slate,
  },
  disputeLink: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
    textDecorationLine: "underline",
  },
});
