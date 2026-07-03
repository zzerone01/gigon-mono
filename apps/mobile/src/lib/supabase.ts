import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "@repo/supabase/types";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

// The anon key is a publishable client key (RLS + RPC auth guard the data);
// EXPO_PUBLIC_ env vars can override for other environments.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://uoeatrexoeghoigbxage.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWF0cmV4b2VnaG9pZ2J4YWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMzQ5MTgsImV4cCI6MjA5ODYxMDkxOH0.pjcHflLtOSOxJJQWYVX74r0Y6-pQdA3iO2T-xdx5uDU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the session fresh while the app is foregrounded (Supabase RN pattern).
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
