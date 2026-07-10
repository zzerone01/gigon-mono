import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking } from "react-native";

export type LocPermission = "checking" | "prompt" | "granted" | "blocked";

// "Not now" lasts for the app session only — the soft-ask returns next launch.
let sessionDismissed = false;

/**
 * Foreground location with a full consent cycle:
 * - Silent pre-check, so already-granted users get a fix with no prompt.
 * - `request()` shows the OS prompt; a hard denial (can't ask again) flips
 *   to "blocked", where the only path is `openSettings()`.
 * - An AppState listener re-checks on foreground, so coming back from the
 *   Settings app heals the blocked state automatically.
 */
export function useLiveLocation(onFix?: (c: { lat: number; lng: number }) => void) {
  const [permission, setPermission] = useState<LocPermission>("checking");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dismissed, setDismissed] = useState(sessionDismissed);
  const onFixRef = useRef(onFix);
  onFixRef.current = onFix;

  const getFix = useCallback(async () => {
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(c);
      onFixRef.current?.(c);
    } catch {
      // GPS off / timeout — the saved-area fallback keeps working
    }
  }, []);

  const check = useCallback(async () => {
    const p = await Location.getForegroundPermissionsAsync();
    if (p.granted) {
      setPermission("granted");
      void getFix();
    } else if (p.canAskAgain) {
      setPermission("prompt");
    } else {
      setPermission("blocked");
    }
  }, [getFix]);

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });
    return () => sub.remove();
  }, [check]);

  const request = useCallback(async () => {
    const p = await Location.requestForegroundPermissionsAsync();
    if (p.granted) {
      setPermission("granted");
      void getFix();
      return;
    }
    setPermission(p.canAskAgain ? "prompt" : "blocked");
    sessionDismissed = true; // collapse the card; the chip stays available
    setDismissed(true);
  }, [getFix]);

  const dismiss = useCallback(() => {
    sessionDismissed = true;
    setDismissed(true);
  }, []);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return { permission, coords, dismissed, request, dismiss, openSettings };
}
