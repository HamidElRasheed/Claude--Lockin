import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Group, Row } from '@/components/Group';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { Screen } from '@/components/Screen';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { Goal } from '@/lib/types';
import { formatDays } from '@/lib/words';
import { space } from '@/theme';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; goals: Goal[] };

// The goals you are working on, and a way to add more. Opened from "I dag".
export default function GoalsScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

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

      {state.kind === 'loading' && (
        <View style={styles.message}>
          <Voice tone="dawn" muted>
            Et øyeblikk.
          </Voice>
        </View>
      )}

      {state.kind === 'error' && (
        <View style={styles.message}>
          <Voice tone="dawn" muted>
            Fikk ikke hentet målene.
          </Voice>
        </View>
      )}

      {state.kind === 'ready' && count === 0 && (
        <View style={styles.message}>
          <Voice tone="dawn" muted>
            Ingen mål ennå. Fortell meg hva du vil få til.
          </Voice>
        </View>
      )}

      {state.kind === 'ready' && count > 0 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Group>
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
        </ScrollView>
      )}

      <View style={styles.footer}>
        {state.kind === 'error' ? (
          <Button tone="dawn" label="Prøv igjen" onPress={retry} />
        ) : (
          <Button tone="dawn" label="Legg til mål" onPress={() => router.push('/onboarding')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: 'flex-start', marginBottom: space.md },
  scroll: { flex: 1, marginTop: 22 },
  content: { paddingBottom: space.lg },
  message: { marginTop: space.lg },
  footer: { marginTop: 'auto', paddingTop: space.md },
});
