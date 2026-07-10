import * as Haptics from "expo-haptics";
import { ReactNode } from "react";
import {
  Image,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { font, palette, radius } from "../theme";

/** Pressable with subtle scale feedback + light haptic — the app's default touchable. */
export function Press({
  style,
  haptic = true,
  children,
  onPress,
  ...rest
}: PressableProps & {
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  children?: ReactNode;
}) {
  return (
    <Pressable
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [
        style,
        pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

/** Monospace state-machine badge (APPLIED / MATCHED / …). */
export function MonoBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[styles.monoBadge, { backgroundColor: bg }]}>
      <Text style={[styles.monoBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

/** Squared avatar — profile photo when available, initials otherwise. */
export function Avatar({
  initials,
  uri,
  size = 44,
  bg = palette.tint,
  color = palette.royalDark,
  radiusOverride,
}: {
  initials: string;
  uri?: string | null;
  size?: number;
  bg?: string;
  color?: string;
  radiusOverride?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radiusOverride ?? radius.sm,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text style={{ fontFamily: font.sansBold, fontSize: size * 0.32, color }}>{initials}</Text>
      )}
    </View>
  );
}

/** Rounded filter/selector chip. */
export function Chip({
  label,
  active,
  onPress,
  height = 32,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  height?: number;
}) {
  return (
    <Press
      onPress={onPress}
      style={[
        styles.chip,
        { height },
        active
          ? { backgroundColor: palette.royal, borderColor: palette.royal }
          : { backgroundColor: palette.white, borderColor: palette.line },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? palette.white : palette.slate },
        ]}
      >
        {label}
      </Text>
    </Press>
  );
}

/** Amber uppercase section label ("ACTIVE", "HISTORY", …). */
export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

/** Card surface with the design's border + soft shadow. */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  monoBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  monoBadgeText: {
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  chip: {
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontFamily: font.sansMedium,
    fontSize: 12.5,
  },
  sectionLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: palette.amberDark,
  },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.lg,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
});
