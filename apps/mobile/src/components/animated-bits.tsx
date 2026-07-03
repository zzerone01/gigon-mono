import { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { palette } from "../theme";

/** Blinking "live" dot (gigBlink). */
export function LiveDot({ size = 7, color = palette.success }: { size?: number; color?: string }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size, backgroundColor: color }, style]}
    />
  );
}

/** Expanding sonar ring behind a location dot (gigPulse). */
export function PulseRing({
  size = 44,
  color = palette.amber,
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }), -1);
  }, [t]);
  const anim = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - t.value),
    transform: [{ scale: 0.55 + 1.45 * t.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        },
        style,
        anim,
      ]}
    />
  );
}

/** Gentle vertical float for map pins (gigBob). */
export function Bob({
  delay = 0,
  children,
  style,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [delay, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Pop-in for success checks (gigPop). */
export function Pop({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.6)) });
  }, [t]);
  const anim = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ scale: 0.4 + 0.6 * t.value }],
  }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
