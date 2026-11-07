import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { StatusMark } from '@/components/StatusMark';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { DailyLog } from '@/lib/types';
import { formatDay } from '@/lib/words';
import { palettes, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; logs: DailyLog[] };

// Log list: one quiet row per evening, newest first.
export default function LogListScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const fetchData = useCallback(() => {
    api
      .getLogs()
      .then((logs) => setState({ kind: 'ready', logs }))
      .catch(() => setState({ kind: 'error' }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchData();
  };

  return (
    <Screen tone="dawn">
      <View style={styles.header}>
        <Voice tone="dawn">Dagene dine.</Voice>
        <IconButton icon="xmark" label="Lukk" onPress={() => router.back()} />
      </View>

      {state.kind === 'loading' && <Voice tone="dawn" muted>Et øyeblikk.</Voice>}

      {state.kind === 'error' && (
        <View style={styles.gap}>
          <Voice tone="dawn" muted>Fikk ikke hentet loggen.</Voice>
          <Button tone="dawn" label="Prøv igjen" onPress={retry} />
        </View>
      )}

      {state.kind === 'ready' && state.logs.length === 0 && (
        <Voice tone="dawn" muted>Ingen kvelder ennå. Etter første kveldsgjennomgang dukker dagen opp her.</Voice>
      )}

      {state.kind === 'ready' && state.logs.length > 0 && (
        <FlatList
          data={state.logs}
          keyExtractor={(log) => log.date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/log/[date]', params: { date: item.date } })}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowTop}>
                <Text style={styles.day}>{formatDay(item.date)}</Text>
                <View style={styles.marks}>
                  {item.entries.map((e) => (
                    <StatusMark key={e.goalId} status={e.status} tone="dawn" />
                  ))}
                  <Icon name="chevron.right" color={palette.textMuted} size={13} />
                </View>
              </View>
              <Text style={styles.summary} numberOfLines={2}>
                {item.summary}
              </Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.xl },
  gap: { gap: space.lg },
  list: { paddingBottom: space.xl },
  row: { paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, gap: space.xs },
  pressed: { opacity: 0.6 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  day: { ...type.body, color: palette.text, fontWeight: '600' },
  marks: { flexDirection: 'row', gap: space.xs, alignItems: 'center' },
  summary: { ...type.body, color: palette.textMuted },
});
