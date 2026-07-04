import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { initials, ratingLabel } from "../data/mock";
import { useGigStore } from "../store/gig-store";
import { font, palette, radius } from "../theme";
import { Icon } from "./icon";
import { Avatar, Press, SectionLabel } from "./ui";

function Stat({ value, label, color = palette.royal, last }: { value: string; label: string; color?: string; last?: boolean }) {
  return (
    <View style={[styles.stat, !last && { borderRightWidth: 1, borderRightColor: palette.lineSoft }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Shared profile tab — worker and business variants + role switch. */
export function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = useGigStore((s) => s.role);
  const profile = useGigStore((s) => s.profile);
  const doSwitchRole = useGigStore((s) => s.switchRole);
  const doSignOut = useGigStore((s) => s.signOut);
  const doDeleteAccount = useGigStore((s) => s.deleteAccount);
  const isWorker = role === "worker";

  const displayName = isWorker
    ? (profile?.full_name ?? "You")
    : (profile?.business_name ?? profile?.full_name ?? "Your business");
  const joined = profile
    ? new Date(profile.created_at).toLocaleDateString("en-PH", { month: "short", year: "numeric" })
    : "";
  const rating = profile ? ratingLabel(profile) : "New";
  const ratingStr = rating === "New" ? "New" : `${rating}★`;

  const switchRole = async () => {
    const next = await doSwitchRole();
    router.replace(next === "employer" ? "/(employer)/postings" : "/(worker)/explore");
  };

  const signOut = async () => {
    await doSignOut();
    router.replace("/onboarding/phone");
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your profile, gigs, applications, matches, chats, and reviews. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const error = await doDeleteAccount();
            if (error) {
              Alert.alert("Couldn't delete account", error);
              return;
            }
            router.replace("/onboarding/phone");
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bgSoft }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
      >
        <View style={styles.profileCard}>
          <Avatar initials={initials(displayName)} size={54} radiusOverride={14} />
          <View style={{ gap: 3, flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <Text style={styles.profileName}>{displayName}</Text>
              {!isWorker && profile?.employer_verified && (
                <View style={styles.verifiedChip}>
                  <Icon name="shield" size={10} color={palette.success} strokeWidth={2.4} />
                  <Text style={styles.verifiedText}>Invite-verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileSub}>
              {isWorker ? "Worker" : "Business"} · {profile?.area ?? "Philippines"} · joined {joined}
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Stat value={ratingStr} label="RATING" />
          <Stat
            value={String(profile?.jobs_completed ?? 0)}
            label={isWorker ? "COMPLETED" : "GIGS DONE"}
          />
          <Stat
            value={String(profile?.no_show_count ?? 0)}
            label="NO-SHOWS"
            color={(profile?.no_show_count ?? 0) > 0 ? palette.red : palette.success}
            last
          />
        </View>

        {isWorker ? (
          <View style={styles.infoCard}>
            <SectionLabel>Work preferences</SectionLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {(profile?.skills ?? []).map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
              <View style={styles.addSkillChip}>
                <Text style={styles.addSkillChipText}>+ Add skill</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="clock" size={15} color={palette.slate} />
              <Text style={styles.infoRowText}>Weekdays · 1 – 6 PM</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="mapPin" size={15} color={palette.slate} />
              <Text style={styles.infoRowText}>Preferred radius · 2 km</Text>
            </View>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <SectionLabel>Business</SectionLabel>
            <View style={styles.infoRow}>
              <Icon name="mapPin" size={15} color={palette.slate} />
              <Text style={styles.infoRowText}>{profile?.area ?? "Philippines"} · pilot zone 1</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="card" size={15} color={palette.slate} />
              <Text style={styles.infoRowText}>Cash only — GigOn never touches wages</Text>
            </View>
          </View>
        )}

        <View style={styles.settingsCard}>
          <Press style={[styles.settingsRow, styles.settingsDivider]} onPress={switchRole} haptic={false}>
            <Icon name="switchArrows" size={16} color={palette.royal} />
            <Text style={styles.switchLabel}>
              {isWorker ? "Switch to business mode" : "Switch to worker mode"}
            </Text>
            <Icon name="chevronRight" size={15} color={palette.lineDashed} />
          </Press>
          <View style={[styles.settingsRow, styles.settingsDivider, { alignItems: "flex-start" }]}>
            <View style={{ marginTop: 2 }}>
              <Icon name="file" size={16} color={palette.slate} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.settingsTitle}>Terms & fee notice</Text>
              <Text style={styles.settingsBody}>
                Free during the pilot — a small per-match fee for businesses is planned later.
                Workers are never charged.
              </Text>
            </View>
          </View>
          <View style={styles.settingsRow}>
            <Icon name="globe" size={16} color={palette.slate} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.settingsTitle}>Language · English</Text>
              <Text style={styles.settingsBody}>Cebuano coming soon</Text>
            </View>
          </View>
        </View>

        <Press style={{ padding: 8, alignSelf: "center" }} onPress={signOut} haptic={false}>
          <Text style={styles.signOut}>Sign out</Text>
        </Press>
        <Press style={{ padding: 8, alignSelf: "center" }} onPress={deleteAccount} haptic={false}>
          <Text style={styles.deleteAccount}>Delete account</Text>
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
  profileCard: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    padding: 16,
  },
  profileName: {
    fontFamily: font.displaySemiBold,
    fontSize: 17,
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
  profileSub: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    overflow: "hidden",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  statValue: {
    fontFamily: font.displayBold,
    fontSize: 19,
  },
  statLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.7,
    color: palette.muted,
  },
  infoCard: {
    gap: 9,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  skillChip: {
    backgroundColor: palette.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  skillChipText: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: palette.royalDark,
  },
  addSkillChip: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.lineDashed,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  addSkillChipText: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: palette.slate,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoRowText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 13,
    color: palette.body,
  },
  settingsCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: palette.lineSoft,
  },
  switchLabel: {
    flex: 1,
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.royal,
  },
  settingsTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  settingsBody: {
    fontFamily: font.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: palette.muted,
  },
  signOut: {
    fontFamily: font.sans,
    fontSize: 12.5,
    color: palette.muted,
  },
  deleteAccount: {
    fontFamily: font.sans,
    fontSize: 12.5,
    color: palette.red,
  },
});
