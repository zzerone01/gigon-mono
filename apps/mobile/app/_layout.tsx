import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SheetHost } from "../src/components/sheets";
import { ToastHost } from "../src/components/toast";
import { useGigStore } from "../src/store/gig-store";
import { palette } from "../src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    useGigStore.getState().boot();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.white },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/phone" />
        <Stack.Screen name="onboarding/otp" />
        <Stack.Screen name="onboarding/role" />
        <Stack.Screen name="onboarding/location" />
        <Stack.Screen name="(worker)" options={{ animation: "fade" }} />
        <Stack.Screen name="(employer)" options={{ animation: "fade" }} />
        <Stack.Screen name="gig/[id]" />
        <Stack.Screen name="active" />
        <Stack.Screen name="pin" />
        <Stack.Screen name="rate" options={{ animation: "fade_from_bottom" }} />
        <Stack.Screen name="post" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="e-applicants" />
        <Stack.Screen name="e-active" />
        <Stack.Screen name="e-rate" options={{ animation: "fade_from_bottom" }} />
        <Stack.Screen name="chat-room" />
      </Stack>
      <ToastHost />
      <SheetHost />
    </GestureHandlerRootView>
  );
}
