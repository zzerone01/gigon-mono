import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { gigById, useGigStore, useMatchedApplicant } from "../store/gig-store";
import { font, palette, radius } from "../theme";
import { Icon } from "./icon";
import { Avatar, Press } from "./ui";

/**
 * Chat tab: empty state until a match confirms, then a conversation row
 * that opens the chat room (design: "Chat unlocks when you match").
 */
export function ChatTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = useGigStore((s) => s.role);
  const wStatus = useGigStore((s) => s.wStatus);
  const eStatus = useGigStore((s) => s.eStatus);
  const wGig = useGigStore((s) => s.wGig);
  const msgs = useGigStore((s) => s.chatMsgs);
  const unread = useGigStore((s) => s.unread);
  const a = useMatchedApplicant();
  const gig = gigById(wGig);

  const isWorker = role === "worker";
  const enabled = isWorker
    ? !!wStatus && wStatus !== "APPLIED"
    : !!eStatus && eStatus !== "POSTED";
  const last = msgs[msgs.length - 1];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>
      {enabled ? (
        <View style={{ padding: 14, gap: 10, backgroundColor: palette.bgSoft, flex: 1 }}>
          <Press style={styles.row} onPress={() => router.push("/chat-room")} haptic={false}>
            <Avatar initials={isWorker ? gig.einit : a.init} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowName}>{isWorker ? gig.biz : a.name}</Text>
              <Text style={styles.rowLast} numberOfLines={1}>
                {last ? last.text : "Say hi — you're matched."}
              </Text>
            </View>
            {isWorker && unread > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unread}</Text>
              </View>
            ) : (
              <Icon name="chevronRight" size={16} color={palette.lineDashed} />
            )}
          </Press>
          <Text style={styles.note}>
            1:1 coordination chat, in-app only — no numbers exchanged.
          </Text>
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="message" size={30} color={palette.royal} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>Chat unlocks when you match</Text>
          <Text style={styles.emptyBody}>
            1:1 coordination chat opens the moment a gig is confirmed — no numbers exchanged.
          </Text>
        </View>
      )}
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
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    padding: 14,
  },
  rowName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  rowLast: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: palette.amber,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: palette.ink,
  },
  note: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
    textAlign: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: palette.tintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  emptyBody: {
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 19.5,
    color: palette.slate,
    textAlign: "center",
  },
});
