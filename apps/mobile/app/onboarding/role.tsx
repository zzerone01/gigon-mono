import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconName } from "../../src/components/icon";
import { Press } from "../../src/components/ui";
import { Role, useGigStore } from "../../src/store/gig-store";
import { font, palette, radius } from "../../src/theme";

function ProgressBars({ filled }: { filled: number }) {
  return (
    <View style={styles.progressRow}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.progressBar, { backgroundColor: i < filled ? palette.royal : palette.line }]}
        />
      ))}
    </View>
  );
}

function RoleCard({
  role,
  icon,
  title,
  body,
}: {
  role: Role;
  icon: IconName;
  title: string;
  body: string;
}) {
  const onbRole = useGigStore((s) => s.onbRole);
  const setOnbRole = useGigStore((s) => s.setOnbRole);
  const on = onbRole === role;
  return (
    <Press
      onPress={() => setOnbRole(role)}
      style={[
        styles.roleCard,
        {
          backgroundColor: on ? palette.tintSoft : palette.white,
          borderColor: on ? palette.royal : palette.line,
        },
      ]}
    >
      <View style={styles.roleIcon}>
        <Icon name={icon} size={22} color={palette.royal} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleBody}>{body}</Text>
      </View>
      <View style={[styles.radio, { borderColor: on ? palette.royal : palette.lineDashed }]}>
        {on && <View style={styles.radioDot} />}
      </View>
    </Press>
  );
}

export default function RoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onbRole = useGigStore((s) => s.onbRole);
  const onbName = useGigStore((s) => s.onbName);
  const onbBusiness = useGigStore((s) => s.onbBusiness);
  const onbInvite = useGigStore((s) => s.onbInvite);
  const setOnbFields = useGigStore((s) => s.setOnbFields);
  const [error, setError] = useState("");

  const next = () => {
    if (!onbName.trim()) {
      setError("Tell us your name.");
      return;
    }
    if (onbRole === "employer" && !onbInvite.trim()) {
      setError("Enter your pilot invite code.");
      return;
    }
    setError("");
    router.push("/onboarding/location");
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ProgressBars filled={2} />
      <ScrollView style={styles.main} contentContainerStyle={{ gap: 14 }}>
        <View style={{ gap: 6, paddingHorizontal: 4 }}>
          <Text style={styles.heading}>How will you use GigOn?</Text>
          <Text style={styles.sub}>One account, one active role — switch any time in settings.</Text>
        </View>
        <RoleCard
          role="worker"
          icon="briefcase"
          title="I'm looking for work"
          body="See paid gigs within walking distance. Free — you keep 100% of your pay."
        />
        <RoleCard
          role="employer"
          icon="store"
          title="I'm hiring for my business"
          body="Post 1–3 hour gigs and match in minutes. Invite code required during the pilot."
        />
        <View style={{ gap: 6, paddingHorizontal: 4 }}>
          <Text style={styles.inviteLabel}>Your name</Text>
          <TextInput
            value={onbName}
            onChangeText={(v) => setOnbFields({ onbName: v })}
            placeholder="Juan Dela Cruz"
            placeholderTextColor={palette.muted}
            style={styles.nameInput}
          />
        </View>
        {onbRole === "employer" && (
          <Animated.View entering={FadeIn.duration(250)} style={{ gap: 14 }}>
            <View style={{ gap: 6, paddingHorizontal: 4 }}>
              <Text style={styles.inviteLabel}>Business name</Text>
              <TextInput
                value={onbBusiness}
                onChangeText={(v) => setOnbFields({ onbBusiness: v })}
                placeholder="Kape Lokal"
                placeholderTextColor={palette.muted}
                style={styles.nameInput}
              />
            </View>
            <View style={{ gap: 6, paddingHorizontal: 4 }}>
              <Text style={styles.inviteLabel}>Invite code</Text>
              <TextInput
                value={onbInvite}
                onChangeText={(v) => setOnbFields({ onbInvite: v.toUpperCase() })}
                placeholder="MACTAN-30"
                placeholderTextColor={palette.muted}
                autoCapitalize="characters"
                style={styles.inviteInput}
              />
              <Text style={styles.inviteHelper}>Pilot merchants are invite-verified by the GigOn team.</Text>
            </View>
          </Animated.View>
        )}
        {!!error && (
          <Text style={{ fontFamily: font.sansSemiBold, fontSize: 12.5, color: palette.red, paddingHorizontal: 4 }}>
            {error}
          </Text>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 16 }}>
        <Press style={styles.cta} onPress={next}>
          <Text style={styles.ctaLabel}>Continue</Text>
        </Press>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.white,
  },
  progressRow: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  progressBar: {
    width: 24,
    height: 4,
    borderRadius: radius.pill,
  },
  main: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heading: {
    fontFamily: font.displayBold,
    fontSize: 24,
    letterSpacing: -0.5,
    lineHeight: 28,
    color: palette.ink,
  },
  sub: {
    fontFamily: font.sans,
    fontSize: 13,
    color: palette.slate,
  },
  roleCard: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    padding: 16,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 15.5,
    color: palette.ink,
  },
  roleBody: {
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 18.5,
    color: palette.slate,
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: palette.royal,
  },
  inviteLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 12.5,
    color: palette.ink,
  },
  nameInput: {
    height: 44,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    paddingHorizontal: 13,
    fontFamily: font.sans,
    fontSize: 14,
    color: palette.ink,
  },
  inviteInput: {
    height: 44,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    paddingHorizontal: 13,
    backgroundColor: palette.tintSoft,
    fontFamily: font.mono,
    fontSize: 14,
    letterSpacing: 1.1,
    fontWeight: "600",
    color: palette.royal,
  },
  inviteHelper: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
  },
  cta: {
    height: 50,
    backgroundColor: palette.royal,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 15,
    color: palette.white,
  },
});
