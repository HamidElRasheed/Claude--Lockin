import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CircleView } from '@/components/CircleView';
import { Heatmap } from '@/components/Heatmap';
import { HeroCard } from '@/components/HeroCard';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Voice } from '@/components/Voice';
import { WeekBars, type Bar } from '@/components/WeekBars';
import { api } from '@/lib/api';
import type { Stats } from '@/lib/types';
import { percent, weekdayLetter, weekdayName, weekdayOrder } from '@/lib/weekdays';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

const WEEKS = 4;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; stats: Stats };

// Progress over the last four weeks: plain counting, no AI. No streaks, nothing to break.
export default function ProgressScreen() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  // "Meg" is your own four weeks; "Sirkelen" is the friend-circle demo (visual only).
  const [mode, setMode] = useState<'me' | 'circle'>('me');

  const fetchData = useCallback(() => {
    api.getStats(WEEKS).then(
      (stats) => setState({ kind: 'ready', stats }),
      () => setState((prev) => (prev.kind === 'ready' ? prev : { kind: 'error' })),
    );
  }, []);

  // Refresh when the tab comes back, so tonight's review shows up straight away.
  useFocusEffect(fetchData);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchData();
  };

  return (
    <Screen tone="dawn" inTabs>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.caption}>{mode === 'me' ? `Siste ${WEEKS} uker` : 'Denne uka'}</Text>
          <Voice tone="dawn">Fremgang</Voice>
        </View>

        <Segmented
          options={[
            { value: 'me', label: 'Meg' },
            { value: 'circle', label: 'Sirkelen' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'circle' && <CircleView />}

        {mode === 'me' && state.kind === 'loading' && (
          <View style={styles.quiet}>
            <ActivityIndicator color={palette.textMuted} />
          </View>
        )}

        {mode === 'me' && state.kind === 'error' && (
          <View style={styles.quiet}>
            <Text style={styles.muted}>Fikk ikke hentet tallene dine.</Text>
            <Button tone="dawn" variant="tonal" label="Prøv igjen" onPress={retry} />
          </View>
        )}

        {mode === 'me' &&
          state.kind === 'ready' &&
          (state.stats.overall.rate === null ? (
            <Text style={styles.muted}>Ingen kvelder ennå. Etter noen gjennomganger ser du mønstrene dine her.</Text>
          ) : (
            <Dashboard stats={state.stats} />
          ))}
      </ScrollView>
    </Screen>
  );
}

function Dashboard({ stats }: { stats: Stats }) {
  const { overall } = stats;

  const weekBars: Bar[] = stats.weeks.map((w) => ({ key: w.week, label: `U${Number(w.week.split('W')[1])}`, rate: w.rate }));
  const dayBars: Bar[] = weekdayOrder.map((wd) => ({
    key: wd,
    label: weekdayLetter[wd],
    rate: stats.weekdays[wd],
    marked: wd === overall.hardestWeekday && overall.hardestWeekday !== overall.bestWeekday,
  }));
  const goals = stats.goals.filter((g) => g.done + g.partial + g.missed > 0);

  return (
    <View style={styles.sections}>
      <HeroCard value={percent(overall.rate)} label={`${overall.reviews} kvelder`}>
        <WeekBars bars={weekBars} />
      </HeroCard>

      <Section label="Ukedagene dine">
        <View style={styles.surface}>
          <WeekBars bars={dayBars} on="plain" />
          {overall.bestWeekday && overall.hardestWeekday && overall.bestWeekday !== overall.hardestWeekday && (
            <Text style={styles.note}>
              Best: {weekdayName[overall.bestWeekday]} · Tyngst: {weekdayName[overall.hardestWeekday]}
            </Text>
          )}
        </View>
      </Section>

      {goals.length > 0 && (
        <Section label="Målene dine per ukedag">
          <View style={styles.surface}>
            <Heatmap goals={goals} />
          </View>
        </Section>
      )}

      {goals.length > 0 && (
        <Section label="Hvert mål">
          <View style={styles.list}>
            {goals.map((g, i) => {
              const total = g.done + g.partial + g.missed;
              return (
                <View
                  key={g.goalId}
                  style={[styles.row, i > 0 && styles.divider]}
                  accessible
                  accessibilityLabel={`${g.title}: ${g.done} av ${total} gjort`}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {g.title}
                    </Text>
                    <Text style={styles.rowCount}>
                      {g.done} av {total}
                    </Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.round((g.rate ?? 0) * 100)}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </Section>
      )}
    </View>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel} accessibilityRole="header">
        {label}
      </Text>
      {children}
    </View>
  );
}

const trackHeight = 6;

const styles = StyleSheet.create({
  content: { paddingBottom: space.xl, gap: space.lg },
  header: { gap: 2 },
  caption: { ...type.caption, ...type.strong, color: palette.textMuted },
  quiet: { gap: space.md, alignItems: 'flex-start', paddingTop: space.sm },
  muted: { ...type.body, color: palette.textMuted },
  sections: { gap: space.lg },
  section: { gap: space.sm + 4 },
  sectionLabel: { ...type.caption, ...type.strong, color: palette.textMuted },
  surface: { backgroundColor: palette.surface, borderRadius: radius.lg - 4, padding: space.md + 2, gap: space.md },
  note: { ...type.body, color: palette.text },
  list: { backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: space.md },
  row: { paddingVertical: space.md - 2, gap: space.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  rowTitle: { ...type.body, color: palette.text, flex: 1 },
  rowCount: { ...type.body, color: palette.textMuted },
  track: { height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: palette.tonal, overflow: 'hidden' },
  fill: { height: trackHeight, borderRadius: trackHeight / 2, backgroundColor: palette.text },
});
