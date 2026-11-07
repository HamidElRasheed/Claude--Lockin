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
      <Stack.Screen name="review" options={{ contentStyle: { backgroundColor: palettes.dusk.background } }} />
      <Stack.Screen name="done" options={{ contentStyle: { backgroundColor: palettes.dusk.background } }} />
    </Stack>
  );
}
