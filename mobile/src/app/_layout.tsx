import { Stack, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PrivacyCard } from '@/components/PrivacyCard';
import { acceptPrivacy, hasAcceptedPrivacy } from '@/lib/consent';

import { palettes } from '@/theme';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [accepted, setAccepted] = useState(hasAcceptedPrivacy);
  // Once, on first launch: the privacy card over everything (not over the full privacy page itself).
  const showPrivacy = !accepted && !hasAcceptedPrivacy() && pathname !== '/privacy';

  return (
    <View style={{ flex: 1 }}>
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
      <Stack.Screen name="privacy" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
      {showPrivacy && (
        <PrivacyCard
          onAccept={() => {
            acceptPrivacy();
            setAccepted(true);
          }}
          onMore={() => router.push('/privacy')}
        />
      )}
    </View>
  );
}
