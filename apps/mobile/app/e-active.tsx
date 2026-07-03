import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LiveDot, Pop } from "../src/components/animated-bits";
import { Icon } from "../src/components/icon";
import { Stepper } from "../src/components/stepper";
import { Avatar, MonoBadge, Press } from "../src/components/ui";
import { firstName } from "../src/data/mock";
import {
  EMPLOYER_BADGES,
  employerStatusIndex,
  useGigStore,
  useMatchedApplicant,
} from "../src/store/gig-store";
import { font, palette, radius } from "../src/theme";

export default function EmployerActiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const eStatus = useGigStore((s) => s.eStatus);
  const pinIssued = useGigStore((s) => s.pinIssued);
  const issuePin = useGigStore((s) => s.issuePin);
  const openSheet = useGigStore((s) => s.openSheet);
  const posting = useGigStore((s) => s.posting);
  const pinDigits = useGigStore((s) => s.pinDigits);
  const a = useMatchedApplicant();

  const status = eStatus ?? "POSTED";
  const badge = EMPLOYER_BADGES[status];
  const first = firstName(a.name);
  const isDone = status === "COMPLETED" || status === "RATED";
  const statusLine =
    status === "MATCHED"
      ? `${first} is matched — coordinate in chat. They'll tap “I've arrived” on site.`
      : status === "IN_PROGRESS"
        ? "On site — they tapped “I've arrived”. Issue the PIN once the job is done and paid."
        : "PIN confirmed by both sides. Gig closed and logged.";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Press style={styles.headerBtn} onPress={() => router.back()} haptic={false}>
          <Icon name="arrowLeft" size={19} color={palette.ink} />
        </Press>
        <Text style={styles.headerTitle}>Gig status</Text>
        <MonoBadge label={badge.t} bg={badge.bg} color={badge.c} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 13 }}
      >
        <View style={{ paddingHorizontal: 2 }}>
          <Stepper
            codes={["POSTED", "MATCHED", "ON SITE", "DONE"]}
            index={employerStatusIndex[status]}
          />
        </View>

        <View style={styles.titleCard}>
          <Text style={styles.titleText}>{posting?.title}</Text>
          <Text style={styles.titleMeta}>
            {posting?.meta}
          </Text>
        </View>

        <View style={styles.workerCard}>
          <Avatar initials={a.init} size={44} bg={palette.royal} color={palette.white} radiusOverride={12} />
          <View style={{ flex: 1 }}>
            <Text style={styles.workerName}>{a.name}</Text>
            <Text style={styles.workerMeta}>
              {a.rt}★ · {a.jobs} gigs · {a.dist} away
            </Text>
          </View>
          <Press style={styles.chatBtn} onPress={() => router.push("/chat-room")} haptic={false}>
            <Icon name="message" size={14} color={palette.ink} />
            <Text style={styles.chatBtnLabel}>Chat</Text>
          </Press>
        </View>

        <View style={styles.eventLine}>
          <Text style={styles.eventLineText}>
            event: match_confirmed → billable_event · charge ₱0 (pilot)
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={{ marginTop: 4 }}>
            <LiveDot size={8} />
          </View>
          <Text style={styles.statusText}>{statusLine}</Text>
        </View>

        {status === "IN_PROGRESS" && !pinIssued && (
          <View style={styles.issueCard}>
            <Text style={styles.issueText}>
              <Text style={{ fontFamily: font.sansSemiBold, color: palette.ink }}>
                Job done and paid in cash?
              </Text>{" "}
              Issue the one-time PIN and tell it to {first} — they enter it to close the gig.
            </Text>
            <Press style={styles.issueCta} onPress={issuePin}>
              <Text style={styles.issueCtaLabel}>Issue completion PIN</Text>
            </Press>
          </View>
        )}

        {status === "IN_PROGRESS" && pinIssued && (
          <View style={styles.pinCard}>
            <Text style={styles.pinCardLabel}>Tell {first} this PIN</Text>
            {pinDigits ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {pinDigits.split("").map((d, i) => (
                  <View key={i} style={styles.pinDigit}>
                    <Text style={styles.pinDigitText}>{d}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Press
                style={{ height: 40, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: palette.amber, backgroundColor: palette.white, alignItems: "center", justifyContent: "center" }}
                onPress={issuePin}
              >
                <Text style={{ fontFamily: font.sansSemiBold, fontSize: 12, color: palette.amberDark }}>
                  Show PIN again (re-issue)
                </Text>
              </Press>
            )}
            <Text style={styles.pinCardNote}>
              One-time · valid 24 h · 3 wrong tries locks it for 60 s{"\n"}
              <Text style={{ color: palette.amberDark, fontFamily: font.sansSemiBold }}>
                Waiting for {first} to enter it…
              </Text>
            </Text>
          </View>
        )}

        {isDone && (
          <View style={styles.doneCard}>
            <Pop>
              <View style={styles.doneCheck}>
                <Icon name="check" size={24} color={palette.white} strokeWidth={2.6} />
              </View>
            </Pop>
            <Text style={styles.doneTitle}>COMPLETED — confirmed by both sides</Text>
            <Text style={styles.doneBody}>₱0 charged (pilot). Reviews are unlocked.</Text>
            {status === "COMPLETED" && (
              <Press style={styles.rateCta} onPress={() => router.push("/e-rate")}>
                <Text style={styles.rateCtaLabel}>Rate {first}</Text>
              </Press>
            )}
            {status === "RATED" && <Text style={styles.ratedText}>Review posted ✓</Text>}
          </View>
        )}

        {status === "MATCHED" && (
          <View style={{ gap: 4 }}>
            <Press
              style={{ alignSelf: "center", padding: 2 }}
              onPress={() => openSheet("noshow")}
              haptic={false}
            >
              <Text style={styles.noShowLink}>Worker hasn't arrived? Report a no-show</Text>
            </Press>
            <Press
              style={{ alignSelf: "center", padding: 2 }}
              onPress={() => openSheet("cancel")}
              haptic={false}
            >
              <Text style={styles.noShowLink}>Plans changed? Cancel this gig</Text>
            </Press>
          </View>
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
  titleCard: {
    gap: 2,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  titleText: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: palette.ink,
  },
  titleMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
  },
  workerCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: palette.royal,
    backgroundColor: palette.tintSoft,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  workerName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  workerMeta: {
    fontFamily: font.sans,
    fontSize: 11.5,
    color: palette.slate,
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
  eventLine: {
    backgroundColor: palette.bgSoft,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  eventLineText: {
    fontFamily: font.mono,
    fontSize: 10,
    color: palette.slate,
  },
  statusCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  statusText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 19.5,
    color: palette.body,
  },
  issueCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    padding: 14,
  },
  issueText: {
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 19.5,
    color: palette.body,
  },
  issueCta: {
    height: 50,
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  issueCtaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  pinCard: {
    gap: 12,
    borderWidth: 1.5,
    borderColor: palette.amber,
    backgroundColor: palette.amberBg,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  pinCardLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: palette.amberDark,
  },
  pinDigit: {
    width: 48,
    height: 56,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.amber,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDigitText: {
    fontFamily: font.displayBold,
    fontSize: 26,
    color: palette.ink,
  },
  pinCardNote: {
    fontFamily: font.sans,
    fontSize: 11,
    lineHeight: 16.5,
    color: palette.muted,
    textAlign: "center",
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
    textAlign: "center",
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
  noShowLink: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
    textDecorationLine: "underline",
  },
});
