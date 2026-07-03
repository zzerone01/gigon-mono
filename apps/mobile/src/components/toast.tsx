import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGigStore } from "../store/gig-store";
import { font, palette } from "../theme";
import { Icon } from "./icon";

/** Global in-app notification toast (top of screen, tappable to navigate). */
export function ToastHost() {
  const toast = useGigStore((s) => s.toast);
  const dismissToast = useGigStore((s) => s.dismissToast);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!toast) return null;

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInUp.duration(280)}
      exiting={FadeOutUp.duration(180)}
      style={[styles.wrap, { top: insets.top + 6 }]}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.toast}
        onPress={() => {
          const route = toast.route;
          dismissToast();
          if (route) router.push(route as never);
        }}
      >
        <View style={styles.iconBox}>
          <Icon name="logo" size={16} color={palette.amber} strokeWidth={2.4} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{toast.title}</Text>
          <Text style={styles.body}>{toast.body}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 50,
  },
  toast: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
    backgroundColor: palette.royalDark,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 8,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: palette.white,
    lineHeight: 17,
  },
  body: {
    fontFamily: font.sans,
    fontSize: 11.5,
    color: palette.onNavyMuted,
    lineHeight: 16.5,
  },
});
