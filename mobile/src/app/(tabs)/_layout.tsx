import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { palettes } from '@/theme';

// Four places in a floating capsule, the evening review on the black microphone in the middle.
// "goals" is a tab screen without a tab: it opens from the button on "I dag".
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
