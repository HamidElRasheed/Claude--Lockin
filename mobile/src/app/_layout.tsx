import { Stack } from 'expo-router';

import { palettes } from '@/theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: palettes.dawn.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="review"
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: palettes.dusk.background } }}
      />
      <Stack.Screen name="done" options={{ contentStyle: { backgroundColor: palettes.dusk.background } }} />
      <Stack.Screen name="day/[date]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="new-goal" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
