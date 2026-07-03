import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bob, LiveDot } from "../../src/components/animated-bits";
import { GIG_TYPE_ICON, Icon } from "../../src/components/icon";
import { ExploreMapArt, PricePin, YouMarker } from "../../src/components/maps";
import { Card, Chip, Press } from "../../src/components/ui";
import { FILTERS, GIGS, Gig } from "../../src/data/mock";
import { useGigStore } from "../../src/store/gig-store";
import { font, palette, radius } from "../../src/theme";

function GigCard({ gig, applied, onPress }: { gig: Gig; applied: boolean; onPress: () => void }) {
  return (
    <Press onPress={onPress} haptic={false}>
      <Card style={styles.gigCard}>
        <View style={styles.gigIcon}>
          <Icon name={GIG_TYPE_ICON[gig.type]!} size={20} color={palette.royal} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.gigTitle}>{gig.t}</Text>
          <Text style={styles.gigMeta}>
            {gig.biz} · {gig.area} ·{" "}
            <Text style={{ color: palette.royal, fontFamily: font.sansSemiBold }}>{gig.dist}</Text>
          </Text>
          <View style={styles.gigTagsRow}>
            <View style={styles.whenChip}>
              <Text style={styles.whenChipText}>{gig.when}</Text>
            </View>
            <Text style={styles.slots}>{gig.slots}</Text>
            {applied && <Text style={styles.appliedTag}>Applied ✓</Text>}
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={styles.pay}>₱{gig.pay}</Text>
          <Text style={styles.payMeta}>{gig.hrs} · cash</Text>
        </View>
      </Card>
    </Press>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const applied = useGigStore((s) => s.applied);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<"list" | "map">("list");

  const gigs = GIGS.filter((g) => filter === "All" || g.type === filter);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandTile}>
            <Icon name="logo" size={14} color={palette.white} strokeWidth={2.4} />
          </View>
          <Text style={styles.brand}>GigOn</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.zoneChip}>
            <Icon name="mapPin" size={13} color={palette.royal} strokeWidth={2.2} />
            <Text style={styles.zoneChipText}>Mactan · Zone 1</Text>
          </View>
          <Press style={styles.bellBtn} haptic={false}>
            <Icon name="bell" size={20} color={palette.slate} />
            <View style={styles.bellDot} />
          </Press>
        </View>
      </View>

      {/* filters */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {view === "list" ? (
          <FlatList
            data={gigs}
            keyExtractor={(g) => g.id}
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 120, gap: 8 }}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <LiveDot />
                  <Text style={styles.listHeaderText}>{gigs.length} gigs open now · nearest first</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.sortText}>Sort: Nearest</Text>
                  <Icon name="chevronDown" size={11} color={palette.slate} strokeWidth={2.5} />
                </View>
              </View>
            }
            ListFooterComponent={
              <View style={styles.listFooter}>
                <Icon name="clock" size={12} color={palette.muted} />
                <Text style={styles.listFooterText}>
                  That's everything within 3 km — new gigs appear instantly
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <GigCard
                gig={item}
                applied={!!applied[item.id]}
                onPress={() => router.push({ pathname: "/gig/[id]", params: { id: item.id } })}
              />
            )}
          />
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <ExploreMapArt />
            <View style={styles.youAnchor}>
              <YouMarker />
            </View>
            {gigs.map((g) => (
              <View key={g.id} style={[styles.pinAnchor, { left: `${g.mx}%`, top: `${g.my}%` }]}>
                <Bob delay={g.bob * 1000} style={styles.pinInner}>
                  <Press
                    haptic={false}
                    onPress={() => router.push({ pathname: "/gig/[id]", params: { id: g.id } })}
                  >
                    <PricePin label={`₱${g.pay}`} bg={applied[g.id] ? palette.success : palette.royal} />
                  </Press>
                </Bob>
              </View>
            ))}
            <View style={[styles.mapChip, { left: 12, top: 12 }]}>
              <LiveDot />
              <Text style={styles.mapChipText}>{gigs.length} gigs open now</Text>
            </View>
            <View style={[styles.mapChip, { right: 12, top: 12 }]}>
              <Text style={styles.mapChipMuted}>Pilot zone · 2–3 km</Text>
            </View>
          </View>
        )}

        {/* list/map toggle pill */}
        <Press
          style={styles.pill}
          onPress={() => setView(view === "list" ? "map" : "list")}
        >
          <Icon name={view === "list" ? "map" : "list"} size={15} color={palette.white} />
          <Text style={styles.pillLabel}>{view === "list" ? "Map" : "List"}</Text>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: palette.amber,
    borderWidth: 1.5,
    borderColor: palette.white,
  },
  filterRow: {
    paddingVertical: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    backgroundColor: palette.white,
  },
  body: {
    flex: 1,
    backgroundColor: palette.bgSoft,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  listHeaderText: {
    fontFamily: font.sans,
    fontSize: 11.5,
    color: palette.muted,
  },
  sortText: {
    fontFamily: font.sansMedium,
    fontSize: 11.5,
    color: palette.slate,
  },
  gigCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 13,
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
    lineHeight: 18,
    color: palette.ink,
  },
  gigMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: palette.muted,
  },
  gigTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  whenChip: {
    backgroundColor: palette.tintSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  whenChipText: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: palette.slate,
  },
  slots: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
  },
  appliedTag: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: palette.success,
  },
  pay: {
    fontFamily: font.displayBold,
    fontSize: 16.5,
    letterSpacing: -0.2,
    color: palette.royal,
  },
  payMeta: {
    fontFamily: font.sans,
    fontSize: 10.5,
    color: palette.muted,
  },
  listFooter: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 14,
  },
  listFooterText: {
    fontFamily: font.sans,
    fontSize: 11,
    color: palette.muted,
  },
  youAnchor: {
    position: "absolute",
    left: "48%",
    top: "55%",
    width: 17,
    height: 17,
    marginLeft: -8.5,
    marginTop: -8.5,
    zIndex: 2,
  },
  pinAnchor: {
    position: "absolute",
    width: 0,
    height: 0,
    zIndex: 3,
  },
  pinInner: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    width: 120,
    marginLeft: -60,
  },
  mapChip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  mapChipText: {
    fontFamily: font.sansSemiBold,
    fontSize: 11.5,
    color: palette.ink,
  },
  mapChipMuted: {
    fontFamily: font.sansMedium,
    fontSize: 10.5,
    color: palette.slate,
  },
  pill: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    paddingHorizontal: 19,
    borderRadius: radius.pill,
    backgroundColor: palette.ink,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  pillLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: palette.white,
  },
});
