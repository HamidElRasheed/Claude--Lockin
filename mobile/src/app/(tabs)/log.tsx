import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { StatusMark } from '@/components/StatusMark';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import { capitalize, dateLabel, dayScore, formatPoints, formatScore, weekdayName } from '@/lib/days';
import type { DailyLog } from '@/lib/types';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; logs: DailyLog[] };

// The log: one grouped list, one row per evening, newest first.
export default function LogListScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const fetchData = useCallback(() => {
    api
      .getLogs()
      .then((logs) => setState({ kind: 'ready', logs }))
      .catch(() => setState({ kind: 'error' }));
  }, []);

  // A finished evening shows up as soon as you come back to this tab.
  useFocusEffect(fetchData);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchData();
  };

  return (
    <Screen tone="dawn" inTabs>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.caption}>Logg</Text>
          <Voice tone="dawn">Dagene</Voice>
        </View>

        {state.kind === 'loading' && <Voice tone="dawn" muted>Et øyeblikk …</Voice>}

        {state.kind === 'error' && (
          <View style={styles.gap}>
            <Voice tone="dawn" muted>Fikk ikke hentet loggen.</Voice>
            <Button tone="dawn" variant="tonal" label="Prøv igjen" onPress={retry} fill={false} />
          </View>
        )}

        {state.kind === 'ready' && state.logs.length === 0 && (
          <Voice tone="dawn" muted>Ingen kvelder ennå. Etter første kveldsgjennomgang dukker dagen opp her.</Voice>
        )}

        {state.kind === 'ready' && state.logs.length > 0 && (
          <View style={styles.group}>
            {state.logs.map((log, i) => (
              <LogRow
                key={log.date}
                log={log}
                last={i === state.logs.length - 1}
                onPress={() => router.push({ pathname: '/day/[date]', params: { date: log.date } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function LogRow({ log, last, onPress }: { log: DailyLog; last: boolean; onPress: () => void }) {
  const { points, total } = dayScore(log.entries);
  const day = capitalize(weekdayName(log.date));
  const hasScore = log.score !== null && log.score !== undefined;
  const goals = `${formatPoints(points)} av ${total} mål`;
  const spoken = hasScore ? `dagsscore ${formatScore(log.score ?? 0)} av 10, ${goals}` : goals;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day} ${dateLabel(log.date)}, ${spoken}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowBody, !last && styles.separator]}>
        <View style={styles.when}>
          <Text style={styles.day}>{day}</Text>
          <View style={styles.meta}>
            <Text style={styles.date}>{dateLabel(log.date)}</Text>
            <View style={styles.dots}>
              {log.entries.map((e) => (
                <StatusMark key={e.goalId} status={e.status} tone="dawn" />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.right}>
          {hasScore ? (
            <View style={styles.scoreLine}>
              <Text style={styles.score}>{formatScore(log.score ?? 0)}</Text>
              <Text style={styles.scoreOf}>/10</Text>
            </View>
          ) : (
            <Text style={styles.scoreOld}>{`${formatPoints(points)}/${total}`}</Text>
          )}
          <Icon name="chevron.right" color={palette.textMuted} size={13} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingBottom: space.xxl },
  header: { gap: 2 },
  caption: { ...type.caption, ...type.strong, color: palette.textMuted },
  gap: { gap: space.lg, alignItems: 'flex-start' },
  group: { backgroundColor: palette.surface, borderRadius: radius.md, overflow: 'hidden' },
  row: { paddingLeft: space.md },
  pressed: { backgroundColor: palette.tonal },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: space.xxxl - space.sm,
    paddingVertical: space.sm + space.xs,
    paddingRight: space.md,
  },
  separator: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  when: { flex: 1, gap: 2 },
  day: { ...type.body, ...type.strong, color: palette.text },
  date: { ...type.caption, fontWeight: '400', color: palette.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  right: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 4 },
  dots: { flexDirection: 'row', gap: space.xs },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  score: { fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6, color: palette.text, fontVariant: ['tabular-nums'] },
  scoreOf: { ...type.caption, ...type.strong, color: palette.textMuted },
  scoreOld: { ...type.body, ...type.strong, color: palette.textMuted, fontVariant: ['tabular-nums'] },
});
