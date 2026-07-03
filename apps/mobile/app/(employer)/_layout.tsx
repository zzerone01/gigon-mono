import { Tabs } from "expo-router";

import { GigTabBar } from "../../src/components/tab-bar";

export default function EmployerLayout() {
  return (
    <Tabs
      tabBar={(props) => <GigTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="postings" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
