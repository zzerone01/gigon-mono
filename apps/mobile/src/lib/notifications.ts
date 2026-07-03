import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "./api";

// Foreground pushes show as banners; in-app realtime toasts stay the primary
// surface, so no sound/badge.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

/**
 * Ask for permission, fetch the Expo push token and register it with the
 * API. No-ops quietly where push can't work (Expo Go SDK 53+, simulators,
 * permission denied) — the app is fully usable without it.
 */
export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post("/api/push/register", { token, platform: Platform.OS });
    registeredToken = token;
  } catch {
    // Expo Go can't fetch push tokens since SDK 53 — expected, skip silently.
  }
}

/** Forget this device's token on sign-out. */
export async function unregisterPushToken(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  if (!token) return;
  await api.post("/api/push/unregister", { token }).catch(() => {});
}
