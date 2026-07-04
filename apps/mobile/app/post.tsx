import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GIG_TYPE_ICON, Icon } from "../src/components/icon";
import { PostMapArt } from "../src/components/maps";
import { Chip, Press } from "../src/components/ui";
import { useGigStore } from "../src/store/gig-store";
import { font, palette, radius } from "../src/theme";

const TYPES = ["Cleaning", "Laundry", "Delivery", "Errands"];
const WHENS = ["Today", "Tomorrow"];
const DURATIONS = ["1 hr", "2 hrs", "3 hrs"];

export default function PostGigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = useGigStore();
  const bizLabel = `${s.profile?.business_name ?? "Your business"} · ${s.profile?.area ?? "Philippines"}`;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Press style={styles.headerBtn} onPress={() => router.back()} haptic={false}>
          <Icon name="arrowLeft" size={19} color={palette.ink} />
        </Press>
        <Text style={styles.headerTitle}>Post a gig</Text>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>Free</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 16, gap: 15 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 7 }}>
          <Text style={styles.label}>What kind of work?</Text>
          <View style={styles.typeGrid}>
            {TYPES.map((tp) => {
              const on = s.pfType === tp;
              return (
                <Press
                  key={tp}
                  onPress={() => s.setPostField({ pfType: tp })}
                  style={[
                    styles.typeBtn,
                    on
                      ? { backgroundColor: palette.tintSoft, borderColor: palette.royal }
                      : { backgroundColor: palette.white, borderColor: palette.line },
                  ]}
                >
                  <Icon
                    name={GIG_TYPE_ICON[tp]!}
                    size={17}
                    color={on ? palette.royalDark : palette.slate}
                    strokeWidth={1.8}
                  />
                  <Text style={[styles.typeBtnLabel, { color: on ? palette.royalDark : palette.slate }]}>
                    {tp}
                  </Text>
                </Press>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={s.pfTitle}
            onChangeText={(v) => s.setPostField({ pfTitle: v })}
            style={styles.input}
          />
        </View>

        <View style={{ gap: 7 }}>
          <Text style={styles.label}>When</Text>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {WHENS.map((w) => (
              <Chip
                key={w}
                label={w}
                active={s.pfWhen === w}
                onPress={() => s.setPostField({ pfWhen: w })}
                height={36}
              />
            ))}
            <TextInput
              value={s.pfTime}
              onChangeText={(v) => s.setPostField({ pfTime: v })}
              style={styles.timeInput}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {DURATIONS.map((d) => (
              <Chip
                key={d}
                label={d}
                active={s.pfDur === d}
                onPress={() => s.setPostField({ pfDur: d })}
                height={36}
              />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={styles.label}>Pay (cash)</Text>
            <View style={styles.payRow}>
              <View style={styles.payPrefix}>
                <Text style={styles.payPrefixText}>₱</Text>
              </View>
              <TextInput
                value={s.pfPay}
                onChangeText={(v) => s.setPostField({ pfPay: v.replace(/[^0-9]/g, "") })}
                keyboardType="number-pad"
                style={styles.payInput}
              />
            </View>
          </View>
          <View style={{ width: 132, gap: 7 }}>
            <Text style={styles.label}>Workers</Text>
            <View style={styles.slotsRow}>
              <Press style={styles.slotsBtn} onPress={() => s.setPfSlots(-1)} haptic={false}>
                <Text style={styles.slotsBtnText}>−</Text>
              </Press>
              <Text style={styles.slotsValue}>{s.pfSlots}</Text>
              <Press style={styles.slotsBtn} onPress={() => s.setPfSlots(1)} haptic={false}>
                <Text style={styles.slotsBtnText}>+</Text>
              </Press>
            </View>
          </View>
        </View>
        <Text style={styles.payNote}>
          Paid on the spot, 100% to the worker — GigOn never takes a cut from wages.
        </Text>

        <View style={{ gap: 7 }}>
          <Text style={styles.label}>Location pin</Text>
          <View style={styles.mapBox}>
            <PostMapArt />
            <View style={styles.mapPinAnchor}>
              <View style={styles.mapPinTile}>
                <Icon name="mapPin" size={15} color={palette.white} strokeWidth={2.2} />
              </View>
              <View style={styles.mapPinPointer} />
            </View>
            <View style={[styles.mapChip, { left: 10 }]}>
              <Text style={styles.mapChipText}>{bizLabel}</Text>
            </View>
            <View style={[styles.mapChip, { right: 10 }]}>
              <Text style={styles.mapChipMuted}>Adjust</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <Text style={styles.label}>
            Details <Text style={{ fontFamily: font.sans, color: palette.muted }}>(optional)</Text>
          </Text>
          <TextInput
            value={s.pfDesc}
            onChangeText={(v) => s.setPostField({ pfDesc: v })}
            multiline
            style={styles.textArea}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Press
          style={styles.cta}
          onPress={async () => {
            const err = await s.postGig();
            if (!err) router.back();
          }}
        >
          <Text style={styles.ctaLabel}>Post gig — free</Text>
        </Press>
        <Text style={styles.footerNote}>
          Goes live instantly to workers within 3 km. You only “pay” when it works — and during the
          pilot, not even then (₱0).
        </Text>
      </View>
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
  freeBadge: {
    borderWidth: 1,
    borderColor: palette.successBorder,
    backgroundColor: palette.successBg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  freeBadgeText: {
    fontFamily: font.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: palette.success,
  },
  label: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeBtn: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    height: 48,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  typeBtnLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    paddingHorizontal: 13,
    fontFamily: font.sans,
    fontSize: 14,
    color: palette.ink,
  },
  timeInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    fontFamily: font.sans,
    fontSize: 12.5,
    color: palette.ink,
    minWidth: 0,
  },
  payRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    height: 46,
    overflow: "hidden",
  },
  payPrefix: {
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: palette.tintSoft,
    borderRightWidth: 1,
    borderRightColor: palette.line,
  },
  payPrefixText: {
    fontFamily: font.displayBold,
    fontSize: 15,
    color: palette.royal,
  },
  payInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontFamily: font.displayBold,
    fontSize: 15,
    color: palette.ink,
    minWidth: 0,
  },
  slotsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.sm,
    height: 46,
    overflow: "hidden",
  },
  slotsBtn: {
    width: 42,
    height: "100%",
    backgroundColor: palette.tintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  slotsBtnText: {
    fontFamily: font.sansSemiBold,
    fontSize: 18,
    color: palette.royal,
  },
  slotsValue: {
    flex: 1,
    textAlign: "center",
    fontFamily: font.displayBold,
    fontSize: 15,
    color: palette.ink,
  },
  payNote: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
    marginTop: -8,
  },
  mapBox: {
    height: 118,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: palette.tintSoft,
  },
  mapPinAnchor: {
    position: "absolute",
    left: "50%",
    top: "46%",
    width: 0,
    height: 0,
    alignItems: "center",
  },
  mapPinTile: {
    position: "absolute",
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: palette.royal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  mapPinPointer: {
    position: "absolute",
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: palette.royal,
  },
  mapChip: {
    position: "absolute",
    bottom: 10,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  mapChipText: {
    fontFamily: font.sansSemiBold,
    fontSize: 10.5,
    color: palette.royalDark,
  },
  mapChipMuted: {
    fontFamily: font.sansMedium,
    fontSize: 10.5,
    color: palette.slate,
  },
  textArea: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 19.5,
    color: palette.ink,
    textAlignVertical: "top",
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
    backgroundColor: palette.amber,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 15,
    color: palette.ink,
  },
  footerNote: {
    fontFamily: font.sans,
    fontSize: 10.5,
    lineHeight: 16,
    color: palette.muted,
    textAlign: "center",
    marginTop: 8,
  },
});
