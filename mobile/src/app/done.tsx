import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Orb } from '@/components/Orb';
import { Screen } from '@/components/Screen';
import { StatusMark } from '@/components/StatusMark';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { DailyLog, GoalStatus } from '@/lib/types';
import { palettes, space, type } from '@/theme';

const palette = palettes.dusk;
const statusLabel: Record<GoalStatus, string> = { done: 'Gjort', partial: 'Delvis', missed: 'Ikke i dag' };

// End of the evening: a quiet goodnight and the day at a glance. No judgement.
export default function DoneScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [log, setLog] = useState<DailyLog | null>(null);

  useEffect(() => {
    if (date) api.getLog(date).then(setLog).catch(() => setLog(null));
  }, [date]);

  return (
    <Screen tone="dusk">
      <View style={styles.orb}>
        <Orb tone="dusk" mode="rest" size={260} />
      </View>

      <View style={styles.gap}>
        <Voice tone="dusk">Det var alt for i dag.</Voice>
        <Voice tone="dusk" muted>Sov godt.</Voice>
      </View>

      {log && (
        <View style={styles.list}>
          {log.entries.map((entry) => (
            <View key={entry.goalId} style={styles.row}>
              <StatusMark status={entry.status} />
              <Text style={[styles.goal, entry.status === 'missed' && styles.muted]}>{entry.goalTitle}</Text>
              <Text style={styles.caption}>{statusLabel[entry.status]}</Text>
            </View>
          ))}
          <View style={styles.tomorrow}>
            <Text style={styles.caption}>I morgen</Text>
            <Text style={styles.goal}>{log.tomorrowTip}</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Button tone="dusk" variant="quiet" label="Tilbake til start" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', bottom: -260, alignSelf: 'center' },
  gap: { gap: space.md },
  list: { marginTop: space.xxl, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  goal: { ...type.body, color: palette.text, flex: 1 },
  muted: { color: palette.textMuted },
  caption: { ...type.caption, color: palette.textMuted },
  tomorrow: { marginTop: space.lg, gap: space.xs },
  footer: { marginTop: 'auto' },
});
