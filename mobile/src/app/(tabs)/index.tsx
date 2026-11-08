import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Group, Row } from '@/components/Group';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { Screen } from '@/components/Screen';
import { StatusMark } from '@/components/StatusMark';
import { TodayHero } from '@/components/TodayHero';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { DailyLog, Stats, Today } from '@/lib/types';
import { formatDay, localDate } from '@/lib/words';
import { palettes, radius, space } from '@/theme';

const palette = palettes.dawn;

// The evening time is not in the API yet; setup will choose it later.
const EVENING = '21:30';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; today: Today; log: DailyLog | null };

// "I dag": the date, a big title, one black card for the day and the plan as a grouped list.
export default function TodayScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchData = useCallback(() => {
    api
      .getToday()
      .then(async (today) => {
        // After the evening, show what was said. A missing log is not an error here.
        const log = today.reviewDone ? await api.getLog(today.date).catch(() => null) : null;
        setState({ kind: 'ready', today, log });
      })
      .catch(() => setState({ kind: 'error' }));
    // The progress lines are a bonus: the card simply goes without them if this fails.
    api
      .getStats(1)
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  // Refresh whenever the tab comes back into view (after the review or setup).
  useFocusEffect(fetchData);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchData();
  };

  const date = formatDay(state.kind === 'ready' ? state.today.date : localDate(new Date()));
  const hasGoals = state.kind === 'ready' && state.today.goals.length > 0;

  return (
    <Screen tone="dawn" inTabs>
      <LargeTitle
        eyebrow={date}
        title="I dag"
        accessory={
          <IconButton icon="plus" label="Legg til mål" onPress={() => router.push('/new-goal')} />
        }
      />

      {state.kind === 'loading' && (
        <View style={styles.message}>
          <Voice tone="dawn" muted>
            Et øyeblikk.
          </Voice>
        </View>
      )}

      {state.kind === 'error' && (
        <>
          <View style={styles.message}>
            <Voice tone="dawn" muted>
              Fikk ikke hentet dagen din.
            </Voice>
          </View>
          <View style={styles.footer}>
            <Button tone="dawn" label="Prøv igjen" onPress={retry} />
          </View>
        </>
      )}

      {state.kind === 'ready' && !hasGoals && (
        <>
          <View style={styles.message}>
            <Voice tone="dawn" muted>
              Ingen mål ennå. Si hva du vil få til, så lager vi planen.
            </Voice>
          </View>
          <View style={styles.footer}>
            <Button tone="dawn" label="Legg til ditt første mål" onPress={() => router.push('/new-goal')} />
          </View>
        </>
      )}

      {state.kind === 'ready' && hasGoals && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TodayHero
            count={state.today.goals.length}
            eyebrow={state.today.reviewDone ? 'Kvelden er gjort' : `Kveld kl. ${EVENING}`}
            line={
              state.today.reviewDone ? 'Dagen er notert. Sov godt.' : 'Snakk om dagen din på to minutter i kveld.'
            }
            stats={stats}
            onPress={state.today.reviewDone ? undefined : () => router.push('/review')}
          />
          <Plan
            today={state.today}
            log={state.log}
            onAdd={() => router.push('/new-goal')}
            onAll={() => router.push('/goals')}
          />
        </ScrollView>
      )}
    </Screen>
  );
}

type PlanProps = { today: Today; log: DailyLog | null; onAdd: () => void; onAll: () => void };

function Plan({ today, log, onAdd, onAll }: PlanProps) {
  return (
    <Group label="Dagens mål">
      {today.goals.map((goal, i) => {
        const entry = log?.entries.find((e) => e.goalId === goal.id);
        return (
          <Row
            key={goal.id}
            leading={<StatusMark tone="dawn" status={today.reviewDone ? (entry?.status ?? null) : 'missed'} />}
            title={goal.title}
            detail={entry?.reason ?? undefined}
            trailing={goal.time ?? 'Hele dagen'}
          />
        );
      })}
      <Row
        leading={<AddMark />}
        title="Legg til mål"
        trailing={<Icon name="chevron.right" color={palette.textMuted} size={13} />}
        onPress={onAdd}
      />
      <Row
        leading={<View style={styles.markSpace} />}
        title="Alle mål og ukemål"
        trailing={<Icon name="chevron.right" color={palette.textMuted} size={13} />}
        onPress={onAll}
        last
      />
    </Group>
  );
}

// A small black circle with a plus, the same size as the status marks above it.
function AddMark() {
  return (
    <View style={styles.addMark}>
      <Icon name="plus" color={palette.actionText} size={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  addMark: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSpace: { width: 22 },
  scroll: { flex: 1, marginTop: 22 },
  content: { gap: 22, paddingBottom: space.lg },
  message: { marginTop: space.lg },
  footer: { marginTop: 'auto', paddingTop: space.lg },
});
