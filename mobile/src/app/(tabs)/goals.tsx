import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { Goal } from '@/lib/types';
import { formatDays } from '@/lib/words';
import { palettes, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; goals: Goal[] };

// The goals you are working on, and a way to add more.
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

  return (
    <Screen tone="dawn" inTabs>
      <Voice tone="dawn">Målene dine.</Voice>

      {state.kind === 'loading' && <Voice tone="dawn" muted>Et øyeblikk.</Voice>}
      {state.kind === 'error' && <Voice tone="dawn" muted>Fikk ikke hentet målene.</Voice>}

      {state.kind === 'ready' && state.goals.length === 0 && (
        <Voice tone="dawn" muted>Ingen mål ennå. Fortell meg hva du vil få til.</Voice>
      )}

      {state.kind === 'ready' && state.goals.length > 0 && (
        <FlatList
          style={styles.list}
          data={state.goals}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.caption}>
                {formatDays(item.days)}
                {item.time ? ` · kl. ${item.time}` : ''}
              </Text>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <Button tone="dawn" label="Legg til mål" onPress={() => router.push('/onboarding')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, marginTop: space.xl },
  listContent: { paddingBottom: space.lg },
  card: { paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, gap: 2 },
  title: { ...type.body, ...type.strong, color: palette.text },
  caption: { ...type.caption, color: palette.textMuted },
  footer: { marginTop: 'auto', paddingTop: space.md },
});
