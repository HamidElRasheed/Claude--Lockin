import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { DayReport } from '@/components/DayReport';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Voice } from '@/components/Voice';
import { api, ApiError } from '@/lib/api';
import { capitalize, dateLabel, weekdayName } from '@/lib/days';
import type { DailyLog } from '@/lib/types';
import { control, palettes, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ready'; log: DailyLog };

// One day from the log: the same report as right after the evening, in the light mood.
export default function LogDayScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const fetchLog = useCallback(() => {
    if (!date) return;
    api
      .getLog(date)
      .then((log) => setState({ kind: 'ready', log }))
      .catch((error: unknown) =>
        setState({ kind: error instanceof ApiError && error.status === 404 ? 'missing' : 'error' }),
      );
  }, [date]);

  useEffect(fetchLog, [fetchLog]);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchLog();
  };

  return (
    <Screen tone="dawn">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tilbake til loggen"
        hitSlop={8}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Icon name="chevron.left" color={palette.text} size={18} />
        <Text style={styles.backText}>Logg</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {date && (
          <View style={styles.header}>
            <Text style={styles.caption}>{dateLabel(date)}</Text>
            <Voice tone="dawn">{capitalize(weekdayName(date))}</Voice>
          </View>
        )}

        {state.kind === 'loading' && <Voice tone="dawn" muted>Et øyeblikk …</Voice>}
        {state.kind === 'missing' && <Voice tone="dawn" muted>Fant ingen kveld for denne dagen.</Voice>}
        {state.kind === 'error' && (
          <View style={styles.gap}>
            <Voice tone="dawn" muted>Fikk ikke hentet dagen.</Voice>
            <Button tone="dawn" variant="tonal" label="Prøv igjen" onPress={retry} fill={false} />
          </View>
        )}
        {state.kind === 'ready' && <DayReport log={state.log} tone="dawn" scoreLabel="mål denne dagen" />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    minHeight: control.iconButton,
    marginLeft: -space.sm + 2,
    marginTop: -space.sm,
  },
  pressed: { opacity: 0.5 },
  backText: { ...type.body, fontWeight: '500', color: palette.text },
  content: { gap: space.lg, paddingTop: space.sm, paddingBottom: space.xl },
  header: { gap: 2 },
  caption: { ...type.caption, ...type.strong, color: palette.textMuted },
  gap: { gap: space.lg, alignItems: 'flex-start' },
});
