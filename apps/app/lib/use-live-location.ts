"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LocPermission = "checking" | "prompt" | "granted" | "denied" | "unsupported";

const DISMISS_KEY = "gigon-loc-dismissed";

/**
 * Browser geolocation with a full consent cycle:
 * - Permissions API pre-check, so "granted" users get a fix with no prompt
 *   and "denied" users are never re-prompted (browsers silently fail there).
 * - `request()` triggers the native prompt from a user gesture (soft-ask UI).
 * - A Permissions API `onchange` listener recovers automatically when the
 *   user flips the site setting later — the denied banner heals itself.
 * - "Not now" is remembered per browser session only, so the soft-ask
 *   returns next visit instead of nagging within the visit.
 */
export function useLiveLocation(onFix?: (c: { lat: number; lng: number }) => void) {
  const [permission, setPermission] = useState<LocPermission>("checking");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dismissed, setDismissed] = useState(true); // true until we read sessionStorage
  const onFixRef = useRef(onFix);
  onFixRef.current = onFix;

  const getFix = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPermission("granted");
        setCoords(c);
        onFixRef.current?.(c);
      },
      (err) => {
        setPermission(err.code === err.PERMISSION_DENIED ? "denied" : "prompt");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
      return;
    }
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    let status: PermissionStatus | null = null;
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((st) => {
          status = st;
          const apply = () => {
            if (st.state === "granted") getFix();
            else setPermission(st.state === "denied" ? "denied" : "prompt");
          };
          apply();
          st.onchange = apply;
        })
        .catch(() => setPermission("prompt"));
    } else {
      // No Permissions API (older Safari): stay in "prompt"; request() decides.
      setPermission("prompt");
    }
    return () => {
      if (status) status.onchange = null;
    };
  }, [getFix]);

  const request = useCallback(() => {
    getFix();
  }, [getFix]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  }, []);

  return { permission, coords, dismissed, request, dismiss };
}
