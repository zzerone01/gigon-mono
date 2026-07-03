import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "../src/components/icon";
import { Avatar, MonoBadge, Press } from "../src/components/ui";
import { firstName, gigById } from "../src/data/mock";
import {
  EMPLOYER_BADGES,
  WORKER_BADGES,
  useGigStore,
  useMatchedApplicant,
} from "../src/store/gig-store";
import { font, palette, radius } from "../src/theme";

const WORKER_QUICKS = ["On my way po", "Where is the entrance?", "Running 5 min late"];
const EMPLOYER_QUICKS = ["Supplies are inside", "Call when you arrive", "Thank you!"];

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = useGigStore((s) => s.role);
  const wStatus = useGigStore((s) => s.wStatus);
  const eStatus = useGigStore((s) => s.eStatus);
  const wGig = useGigStore((s) => s.wGig);
  const wChat = useGigStore((s) => s.wChat);
  const eChat = useGigStore((s) => s.eChat);
  const sendChat = useGigStore((s) => s.sendChat);
  const markChatRead = useGigStore((s) => s.markChatRead);
  const a = useMatchedApplicant();
  const gig = gigById(wGig);

  const isWorker = role === "worker";
  const msgs = isWorker ? wChat : eChat;
  const name = isWorker ? gig.biz : a.name;
  const initials = isWorker ? gig.einit : a.init;
  const sub = isWorker
    ? `${firstName(gig.er)} · ${gig.erate}★ · ${gig.area}`
    : `${a.rt}★ · ${a.jobs} gigs · ${a.dist}`;
  const badge = isWorker
    ? WORKER_BADGES[wStatus ?? "MATCHED"]
    : EMPLOYER_BADGES[eStatus ?? "MATCHED"];
  const quicks = isWorker ? WORKER_QUICKS : EMPLOYER_QUICKS;

  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    markChatRead();
  }, [markChatRead]);

  const send = (text: string) => {
    if (!text.trim()) return;
    sendChat(text);
    setInput("");
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
        <Avatar initials={initials} size={36} />
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={styles.headerSub}>{sub}</Text>
        </View>
        <MonoBadge label={badge.t} bg={palette.tintSoft} color={palette.royalDark} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: palette.bgSoft }}
        contentContainerStyle={{ padding: 14, paddingVertical: 16, gap: 8 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <View style={styles.systemChip}>
          <Text style={styles.systemChipText}>
            Matched today · in-app chat only, no numbers shared
          </Text>
        </View>
        {msgs.map((m, i) => (
          <View key={i} style={{ alignItems: m.me ? "flex-end" : "flex-start" }}>
            <View
              style={[
                styles.bubble,
                m.me
                  ? { backgroundColor: palette.royal, borderColor: palette.royal }
                  : { backgroundColor: palette.white, borderColor: palette.line },
              ]}
            >
              <Text style={[styles.bubbleText, { color: m.me ? palette.white : palette.ink }]}>
                {m.text}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  { color: m.me ? palette.onNavyMuted : palette.muted },
                ]}
              >
                {m.time}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ backgroundColor: palette.white }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}
        >
          {quicks.map((q) => (
            <Press key={q} style={styles.quick} onPress={() => send(q)} haptic={false}>
              <Text style={styles.quickText}>{q}</Text>
            </Press>
          ))}
        </ScrollView>
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 14 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor={palette.muted}
            style={styles.input}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Press style={styles.sendBtn} onPress={() => send(input)} haptic={false}>
            <Icon name="send" size={18} color={palette.white} />
          </Press>
        </View>
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
  headerName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14.5,
    color: palette.ink,
  },
  headerSub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
  },
  systemChip: {
    alignSelf: "center",
    backgroundColor: palette.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  systemChipText: {
    fontFamily: font.sans,
    fontSize: 10.5,
    color: palette.muted,
  },
  bubble: {
    maxWidth: "78%",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  bubbleText: {
    fontFamily: font.sans,
    fontSize: 13.5,
    lineHeight: 19.5,
  },
  bubbleTime: {
    fontFamily: font.sans,
    fontSize: 9.5,
    marginTop: 3,
    textAlign: "right",
  },
  quick: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: palette.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: palette.royalDark,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontFamily: font.sans,
    fontSize: 13.5,
    color: palette.ink,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: palette.royal,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
