import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { palettes } from '@/theme';

// The four places you move between. The evening review opens from the orb in the middle.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palettes.dawn.background } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="goals" />
    </Tabs>
  );
}
