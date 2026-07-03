import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGigStore } from "../store/gig-store";
import { font, palette } from "../theme";
import { Icon, IconName } from "./icon";
import { Press } from "./ui";

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  explore: { label: "Explore", icon: "search" },
  "my-gigs": { label: "My Gigs", icon: "briefcase" },
  chat: { label: "Chat", icon: "message" },
  profile: { label: "Profile", icon: "user" },
  postings: { label: "Postings", icon: "list" },
};

/**
 * Custom bottom tab bar matching the design (chip-highlighted active icon,
 * amber notification dots). For the business role a "Post" action button is
 * injected that pushes the post-a-gig flow instead of switching tabs.
 */
export function GigTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const role = useGigStore((s) => s.role);
  const wStatus = useGigStore((s) => s.wStatus);
  const unread = useGigStore((s) => s.unread);
  const eStatus = useGigStore((s) => s.eStatus);
  const apps = useGigStore((s) => s.apps);

  const dotFor = (name: string) => {
    if (name === "my-gigs") return !!wStatus && wStatus !== "RATED";
    if (name === "chat") return role === "worker" && unread > 0;
    if (name === "postings") return eStatus === "POSTED" && apps.length > 0;
    return false;
  };

  const items = state.routes.map((route: any, index: number) => ({
    key: route.key,
    name: route.name as string,
    focused: state.index === index,
    onPress: () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (state.index !== index && !event.defaultPrevented) {
        if (route.name === "chat") useGigStore.getState().markChatRead();
        navigation.navigate(route.name);
      }
    },
  }));

  if (role === "employer") {
    items.splice(1, 0, {
      key: "post-action",
      name: "post",
      focused: false,
      onPress: () => router.push("/post"),
    });
  }

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
      {items.map((item: any) => {
        const meta =
          item.name === "post"
            ? { label: "Post", icon: "plus" as IconName }
            : TAB_META[item.name] ?? { label: item.name, icon: "list" as IconName };
        const color = item.focused ? palette.royal : palette.muted;
        return (
          <Press key={item.key} style={styles.item} onPress={item.onPress} haptic={false}>
            <View style={[styles.chip, item.focused && { backgroundColor: palette.tint }]}>
              <Icon name={meta.icon} size={19} color={color} />
              {dotFor(item.name) && !item.focused && <View style={styles.dot} />}
            </View>
            <Text
              style={[
                styles.label,
                { color, fontFamily: item.focused ? font.sansBold : font.sansMedium },
              ]}
            >
              {meta.label}
            </Text>
          </Press>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  chip: {
    width: 46,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 1,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.amber,
    borderWidth: 1.5,
    borderColor: palette.white,
  },
  label: {
    fontSize: 10.5,
  },
});
