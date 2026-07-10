import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LANGUAGE_OPTIONS, SKILL_OPTIONS, initials, ratingLabel } from "../data/mock";
import { base64ToBytes } from "../lib/base64";
import { supabase } from "../lib/supabase";
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
  const userId = useGigStore((s) => s.userId);
  const doSwitchRole = useGigStore((s) => s.switchRole);
  const doUpdateProfile = useGigStore((s) => s.updateProfile);
  const doSignOut = useGigStore((s) => s.signOut);
  const doDeleteAccount = useGigStore((s) => s.deleteAccount);
  const isWorker = role === "worker";
  const [photoBusy, setPhotoBusy] = useState(false);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [availability, setAvailability] = useState(profile?.availability ?? "");

  useEffect(() => {
    setBio(profile?.bio ?? "");
    setAvailability(profile?.availability ?? "");
    // sync only when a different account loads — not on every profile patch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const saveField = async (patch: { bio?: string; availability?: string }) => {
    const err = await doUpdateProfile(patch);
    if (err) Alert.alert("Couldn't save", err);
  };

  const toggleLanguage = async (lang: string) => {
    // read the store directly — the render-scoped `profile` can be stale on quick taps
    const cur = useGigStore.getState().profile?.languages ?? [];
    const next = cur.includes(lang) ? cur.filter((l) => l !== lang) : [...cur, lang];
    const err = await doUpdateProfile({ languages: next });
    if (err) Alert.alert("Couldn't save languages", err);
  };

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

  const pickPhoto = async () => {
    if (photoBusy || !userId) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    const asset = res.assets?.[0];
    if (res.canceled || !asset?.base64) return;
    setPhotoBusy(true);
    try {
      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, base64ToBytes(asset.base64), { contentType: "image/jpeg", upsert: true });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const err = await doUpdateProfile({ avatarUrl: data.publicUrl });
      if (err) throw new Error(err);
    } catch (e) {
      Alert.alert("Couldn't update photo", (e as Error).message);
    }
    setPhotoBusy(false);
  };

  const toggleSkill = async (skill: string) => {
    const cur = useGigStore.getState().profile?.skills ?? [];
    const next = cur.includes(skill) ? cur.filter((s) => s !== skill) : [...cur, skill];
    const err = await doUpdateProfile({ skills: next });
    if (err) Alert.alert("Couldn't save skills", err);
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
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
      >
        <View style={styles.profileCard}>
          <Press onPress={pickPhoto} haptic={false} style={{ opacity: photoBusy ? 0.5 : 1 }}>
            <Avatar
              initials={initials(displayName)}
              uri={profile?.avatar_url}
              size={54}
              radiusOverride={14}
            />
            <View style={styles.cameraBadge}>
              <Icon name="camera" size={10} color={palette.white} strokeWidth={2} />
            </View>
          </Press>
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
              {SKILL_OPTIONS.map((skill) => {
                const on = (profile?.skills ?? []).includes(skill);
                return (
                  <Press
                    key={skill}
                    onPress={() => toggleSkill(skill)}
                    style={[styles.skillChip, !on && styles.skillChipOff]}
                  >
                    <Text style={[styles.skillChipText, !on && { color: palette.slate }]}>
                      {skill}
                    </Text>
                  </Press>
                );
              })}
            </View>
            <Text style={styles.skillHint}>
              Tap to toggle — shown to businesses on your applications.
            </Text>

            <Text style={styles.fieldLabel}>About you</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              onEndEditing={() => {
                if (bio !== (profile?.bio ?? "")) saveField({ bio });
              }}
              placeholder="One or two sentences — e.g. hotel housekeeping for 3 years, fast and careful."
              placeholderTextColor={palette.muted}
              multiline
              maxLength={200}
              style={styles.bioInput}
            />

            <Text style={styles.fieldLabel}>Languages</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {LANGUAGE_OPTIONS.map((lang) => {
                const on = (profile?.languages ?? []).includes(lang);
                return (
                  <Press
                    key={lang}
                    onPress={() => toggleLanguage(lang)}
                    style={[styles.skillChip, !on && styles.skillChipOff]}
                  >
                    <Text style={[styles.skillChipText, !on && { color: palette.slate }]}>
                      {lang}
                    </Text>
                  </Press>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Usual availability</Text>
            <View style={styles.availRow}>
              <Icon name="clock" size={15} color={palette.slate} />
              <TextInput
                value={availability}
                onChangeText={setAvailability}
                onEndEditing={() => {
                  if (availability !== (profile?.availability ?? "")) saveField({ availability });
                }}
                placeholder="e.g. Weekdays · 1 – 6 PM"
                placeholderTextColor={palette.muted}
                maxLength={60}
                style={styles.availInput}
              />
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
  skillChipOff: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    paddingVertical: 4,
  },
  skillHint: {
    fontFamily: font.sans,
    fontSize: 10.5,
    lineHeight: 15,
    color: palette.muted,
  },
  fieldLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: palette.muted,
    marginTop: 4,
  },
  bioInput: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: palette.ink,
    textAlignVertical: "top",
  },
  availRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  availInput: {
    flex: 1,
    height: 40,
    fontFamily: font.sans,
    fontSize: 12.5,
    color: palette.ink,
  },
  cameraBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: palette.royal,
    borderWidth: 2,
    borderColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
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
