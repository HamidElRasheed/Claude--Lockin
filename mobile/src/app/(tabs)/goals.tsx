import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Group, Row } from '@/components/Group';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { Screen } from '@/components/Screen';
import { StepperRow } from '@/components/StepperRow';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { Goal, Settings } from '@/lib/types';
import { formatDays } from '@/lib/words';
import { palettes, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; goals: Goal[] };

// The goals you are working on, and a way to add more. Opened from "I dag".
export default function GoalsScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const weekly = useWeeklyTarget();

  const fetchData = useCallback(() => {
    api
      .getGoals()
      .then((goals) => setState({ kind: 'ready', goals: goals.filter((g) => g.active) }))
      .catch(() => setState({ kind: 'error' }));
  }, []);

  // Refresh when coming back from setup.
  useFocusEffect(fetchData);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchData();
  };

  const count = state.kind === 'ready' ? state.goals.length : 0;
  const eyebrow = state.kind === 'ready' && count > 0 ? (count === 1 ? 'Ett aktivt mål' : `${count} aktive mål`) : 'Planen din';

  return (
    <Screen tone="dawn" inTabs>
      <View style={styles.back}>
        <IconButton icon="chevron.left" label="Tilbake til I dag" onPress={() => router.navigate('/')} />
      </View>
      <LargeTitle eyebrow={eyebrow} title="Mål" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {weekly.settings && (
          <View style={styles.weekly}>
            <Group label="Ukemål">
              <StepperRow
                value={weekly.settings.targetDays}
                min={1}
                max={7}
                after=" av 7 dager"
                label="Dager i uka"
                onChange={(targetDays) => weekly.change({ targetDays })}
              />
              <StepperRow
                value={weekly.settings.targetScore}
                min={1}
                max={10}
                before="minst "
                after="/10"
                label="Dagsscore"
                onChange={(targetScore) => weekly.change({ targetScore })}
                last
              />
            </Group>
            <Text style={styles.note}>
              {weekly.failed ? 'Fikk ikke lagret ukemålet. Prøv igjen.' : buffer(weekly.settings)}
            </Text>
          </View>
        )}

        {state.kind === 'loading' && (
          <Voice tone="dawn" muted>
            Et øyeblikk.
          </Voice>
        )}

        {state.kind === 'error' && (
          <Voice tone="dawn" muted>
            Fikk ikke hentet målene.
          </Voice>
        )}

        {state.kind === 'ready' && count === 0 && (
          <Voice tone="dawn" muted>
            Ingen mål ennå. Legg til det første, det tar ti sekunder.
          </Voice>
        )}

        {state.kind === 'ready' && count > 0 && (
          <Group label="Målene">
            {state.goals.map((goal, i) => (
              <Row
                key={goal.id}
                title={goal.title}
                detail={formatDays(goal.days)}
                trailing={goal.time ?? 'Hele dagen'}
                last={i === count - 1}
              />
            ))}
          </Group>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {state.kind === 'error' ? (
          <Button tone="dawn" label="Prøv igjen" onPress={retry} />
        ) : (
          <Button tone="dawn" label="Legg til mål" onPress={() => router.push('/new-goal')} />
        )}
      </View>
    </Screen>
  );
}

// "Du har 2 dager å gå på." There is room to miss, and it is said out loud.
function buffer({ targetDays }: Settings): string {
  const spare = 7 - targetDays;
  if (spare === 0) return 'Hver dag teller denne uka.';
  return spare === 1 ? 'Du har én dag å gå på.' : `Du har ${spare} dager å gå på.`;
}

// The weekly target: shown at once, saved on every step. On failure it goes back to what was saved.
function useWeeklyTarget() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [failed, setFailed] = useState(false);
  const saved = useRef<Settings | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        saved.current = s;
        setSettings(s);
      })
      .catch(() => setSettings(null));
  }, []);

  function change(changes: Partial<Settings>) {
    setSettings((now) => (now ? { ...now, ...changes } : now));
    setFailed(false);
    api
      .updateSettings(changes)
      .then((s) => {
        saved.current = s;
      })
      .catch(() => {
        setSettings(saved.current);
        setFailed(true);
      });
  }

  return { settings, failed, change };
}

const styles = StyleSheet.create({
  back: { alignItems: 'flex-start', marginBottom: space.md },
  scroll: { flex: 1, marginTop: space.lg - 2 },
  content: { paddingBottom: space.lg, gap: space.lg },
  weekly: { gap: space.sm },
  note: { ...type.caption, color: palette.textMuted, marginHorizontal: space.md },
  footer: { marginTop: 'auto', paddingTop: space.md },
});
