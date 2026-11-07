import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StatusMark } from '@/components/StatusMark';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { DailyLog, GoalStatus } from '@/lib/types';
import { formatDay } from '@/lib/words';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;
const statusLabel: Record<GoalStatus, string> = { done: 'Gjort', partial: 'Delvis', missed: 'Ikke i dag' };

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'ready'; log: DailyLog };

// One day: goal statuses with the reasons the user gave, a short report and one tip for tomorrow.
export default function LogDayScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!date) return;
    api
      .getLog(date)
      .then((log) => setState({ kind: 'ready', log }))
      .catch(() => setState({ kind: 'missing' }));
  }, [date]);

  return (
    <Screen tone="dawn">
      <View style={styles.header}>
        <Text style={styles.caption}>{date ? formatDay(date) : ''}</Text>
        <Button tone="dawn" variant="quiet" label="Tilbake" onPress={() => router.back()} />
      </View>

      {state.kind === 'loading' && <Voice tone="dawn" muted>Et øyeblikk.</Voice>}
      {state.kind === 'missing' && <Voice tone="dawn" muted>Fant ingen kveld for denne dagen.</Voice>}

      {state.kind === 'ready' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Voice tone="dawn">{state.log.summary}</Voice>

          <View style={styles.entries}>
            {state.log.entries.map((entry) => (
              <View key={entry.goalId} style={styles.entry}>
                <StatusMark status={entry.status} tone="dawn" />
                <View style={styles.entryText}>
                  <Text style={styles.goal}>{entry.goalTitle}</Text>
                  <Text style={styles.caption}>
                    {statusLabel[entry.status]}
                    {entry.reason ? ` · ${entry.reason.toLowerCase()}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {state.log.reflection && <Text style={styles.reflection}>«{state.log.reflection}»</Text>}

          <View style={styles.tomorrow}>
            <Text style={styles.caption}>I morgen</Text>
            <Text style={styles.goal}>{state.log.tomorrowTip}</Text>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  content: { gap: space.xl, paddingBottom: space.xl },
  entries: { gap: space.md },
  entry: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  entryText: { flex: 1, gap: 2, marginTop: -6 },
  goal: { ...type.body, color: palette.text },
  caption: { ...type.caption, color: palette.textMuted },
  reflection: { ...type.body, color: palette.textMuted },
  tomorrow: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: space.lg, gap: space.xs },
});
