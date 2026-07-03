import { Tabs } from "expo-router";

import { GigTabBar } from "../../src/components/tab-bar";

export default function WorkerLayout() {
  return (
    <Tabs
      tabBar={(props) => <GigTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="my-gigs" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
