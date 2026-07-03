import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { Icon } from "../src/components/icon";
import { useGigStore } from "../src/store/gig-store";
import { palette } from "../src/theme";

export default function Index() {
  const booted = useGigStore((s) => s.booted);
  const userId = useGigStore((s) => s.userId);
  const profile = useGigStore((s) => s.profile);

  if (!booted) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          backgroundColor: palette.white,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: palette.royal,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="logo" size={28} color={palette.white} strokeWidth={2.4} />
        </View>
        <ActivityIndicator color={palette.royal} />
      </View>
    );
  }

  if (!userId) return <Redirect href="/onboarding/phone" />;
  if (!profile?.onboarded) return <Redirect href="/onboarding/role" />;
  return (
    <Redirect
      href={profile.active_role === "employer" ? "/(employer)/postings" : "/(worker)/explore"}
    />
  );
}
