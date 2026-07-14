import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LiveDot } from "../../src/components/animated-bits";
import { GIG_TYPE_ICON, Icon } from "../../src/components/icon";
import { PricePin } from "../../src/components/maps";
import { Card, Chip, Press } from "../../src/components/ui";
import { FILTERS, Gig } from "../../src/data/mock";
import { MACTAN_CENTER, distanceMeters } from "../../src/lib/geo";
import { useLiveLocation } from "../../src/lib/use-live-location";
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
  const feed = useGigStore((s) => s.feed);
  const profile = useGigStore((s) => s.profile);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<"list" | "map">("map");
  const mapRef = useRef<MapView>(null);

  // Fresh fix → persist (>150 m moved) and re-sort the feed from the new spot.
  const onFix = useCallback(async (c: { lat: number; lng: number }) => {
    const s = useGigStore.getState();
    const p = s.profile;
    if (p?.lat != null && p?.lng != null && distanceMeters(c, { lat: p.lat, lng: p.lng }) < 150)
      return;
    await s.updateProfile({ lat: c.lat, lng: c.lng });
    await s.loadWorker();
  }, []);
  const {
    permission: locPerm,
    coords: liveYou,
    request: requestLoc,
    openSettings,
  } = useLiveLocation(onFix);

  const gigs = useMemo(
    () => feed.filter((g) => filter === "All" || g.type === filter),
    [feed, filter],
  );
  const you = {
    latitude: liveYou?.lat ?? profile?.lat ?? MACTAN_CENTER.lat,
    longitude: liveYou?.lng ?? profile?.lng ?? MACTAN_CENTER.lng,
  };

  // Recenter the live map when the first (or a fresh) fix lands.
  useEffect(() => {
    if (!liveYou) return;
    mapRef.current?.animateToRegion(
      {
        latitude: liveYou.lat,
        longitude: liveYou.lng,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      },
      600,
    );
  }, [liveYou]);

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
            <Text style={styles.zoneChipText}>{profile?.area ?? "Philippines"} · Zone 1</Text>
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
            <MapView
              ref={mapRef}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: you.latitude,
                longitude: you.longitude,
                latitudeDelta: 0.045,
                longitudeDelta: 0.045,
              }}
              showsCompass={false}
              toolbarEnabled={false}
            >
              <Marker coordinate={you} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.youWrap}>
                  <View style={styles.youDot} />
                  <View style={styles.youTag}>
                    <Text style={styles.youTagText}>YOU</Text>
                  </View>
                </View>
              </Marker>
              {gigs.map((g) => (
                <Marker
                  key={g.id}
                  coordinate={{ latitude: g.lat, longitude: g.lng }}
                  anchor={{ x: 0.5, y: 1 }}
                  onPress={() => router.push({ pathname: "/gig/[id]", params: { id: g.id } })}
                >
                  <PricePin label={`₱${g.pay}`} bg={applied[g.id] ? palette.success : palette.royal} />
                </Marker>
              ))}
            </MapView>
            <View style={[styles.mapChip, { left: 12, top: 12 }]}>
              <LiveDot />
              <Text style={styles.mapChipText}>{gigs.length} gigs open now</Text>
            </View>

            {/* location consent cycle — App Review 5.1.1(iv): the pre-prompt
                explainer must have a single proceed button ("Continue", no
                "Allow" wording) and no dismiss path. */}
            {locPerm === "blocked" ? (
              <Press
                style={[styles.mapChip, styles.locChip, { right: 12, top: 12 }]}
                onPress={openSettings}
                haptic={false}
              >
                <Icon name="alertTriangle" size={12} color={palette.amber} strokeWidth={2.2} />
                <Text style={styles.locChipText}>Location off · Settings</Text>
              </Press>
            ) : (
              <View style={[styles.mapChip, { right: 12, top: 12 }]}>
                <Text style={styles.mapChipMuted}>Pilot zone · 2–3 km</Text>
              </View>
            )}

            {locPerm === "prompt" && (
              <View style={styles.locCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={styles.locCardIcon}>
                    <Icon name="navigate" size={17} color={palette.royal} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.locCardTitle}>See gigs around you</Text>
                    <Text style={styles.locCardBody}>
                      GigOn sorts gigs by real distance. Businesses only ever see an approximate
                      distance — never your exact spot.
                    </Text>
                  </View>
                </View>
                <Press style={styles.locBtnPrimary} onPress={requestLoc}>
                  <Text style={styles.locBtnPrimaryText}>Continue</Text>
                </Press>
              </View>
            )}
          </View>
        )}

        {/* list/map toggle pill */}
        <Press style={styles.pill} onPress={() => setView(view === "list" ? "map" : "list")}>
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
  youWrap: {
    alignItems: "center",
    gap: 3,
  },
  youDot: {
    width: 17,
    height: 17,
    borderRadius: 999,
    backgroundColor: palette.amber,
    borderWidth: 3,
    borderColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  youTag: {
    backgroundColor: palette.ink,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  youTagText: {
    fontFamily: font.sansSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: palette.white,
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
  locChip: {
    gap: 5,
  },
  locChipText: {
    fontFamily: font.sansSemiBold,
    fontSize: 10.5,
    color: palette.royalDark,
  },
  locCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 84,
    gap: 12,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    padding: 15,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  locCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: palette.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  locCardTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 13.5,
    color: palette.ink,
  },
  locCardBody: {
    fontFamily: font.sans,
    fontSize: 11.5,
    lineHeight: 16.5,
    color: palette.slate,
  },
  locBtnPrimary: {
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.royal,
  },
  locBtnPrimaryText: {
    fontFamily: font.sansSemiBold,
    fontSize: 12,
    color: palette.white,
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
