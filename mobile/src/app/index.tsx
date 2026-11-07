import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import type { Today } from '@/lib/types';
import { colors, radius, space, type } from '@/theme';

// Morning screen: today's goals. Placeholder — real design comes later.
export default function MorningScreen() {
  const router = useRouter();
  const [today, setToday] = useState<Today | null>(null);

  useEffect(() => {
    api.getToday().then(setToday).catch(() => setToday(null));
  }, []);

  return (
    <Screen title="I dag">
      {today?.goals.map((goal) => (
        <View key={goal.id} style={styles.row}>
          <Text style={styles.goal}>{goal.title}</Text>
          {goal.time && <Text style={styles.time}>{goal.time}</Text>}
        </View>
      ))}

      <View style={styles.links}>
        <Pressable onPress={() => router.push('/review')} style={styles.primary}>
          <Text style={styles.primaryText}>Start kveldsgjennomgang</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/log')}>
          <Text style={styles.link}>Logg</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/week')}>
          <Text style={styles.link}>Ukesrapport</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/onboarding')}>
          <Text style={styles.link}>Oppsett</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  goal: { ...type.body, color: colors.text },
  time: { ...type.body, color: colors.textMuted },
  links: { marginTop: 'auto', gap: space.md, paddingBottom: space.xl },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  primaryText: { ...type.body, color: colors.surface, fontWeight: '600' },
  link: { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
