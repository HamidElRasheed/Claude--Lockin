import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StatusMark } from '@/components/StatusMark';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { Today } from '@/lib/types';
import { countWord, formatDay, greeting } from '@/lib/words';
import { palettes, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; today: Today };

// Morning: date, a big greeting, one line about the day, then the plan as a plain list.
export default function MorningScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const fetchData = useCallback(() => {
    api
      .getToday()
      .then((today) => setState({ kind: 'ready', today }))
      .catch(() => setState({ kind: 'error' }));
  }, []);

  // Refresh whenever the tab comes back into view (after the review or setup).
  useFocusEffect(fetchData);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchData();
  };

  const date = state.kind === 'ready' ? formatDay(state.today.date) : '';

  return (
    <Screen tone="dawn" inTabs>
      <Text style={styles.date}>{date}</Text>
      <Voice tone="dawn">{greeting(new Date())}</Voice>

      {state.kind === 'loading' && (
        <View style={styles.gap}>
          <Voice tone="dawn" muted>Et øyeblikk.</Voice>
        </View>
      )}

      {state.kind === 'error' && (
        <>
          <View style={styles.gap}>
            <Voice tone="dawn" muted>Fikk ikke hentet dagen din.</Voice>
          </View>
          <View style={styles.footer}>
            <Button tone="dawn" label="Prøv igjen" onPress={retry} />
          </View>
        </>
      )}

      {state.kind === 'ready' && (
        <Ready today={state.today} onReview={() => router.push('/review')} onSetup={() => router.push('/onboarding')} />
      )}
    </Screen>
  );
}

function Ready({ today, onReview, onSetup }: { today: Today; onReview: () => void; onSetup: () => void }) {
  const [first] = today.goals;

  if (!first) {
    return (
      <>
        <View style={styles.gap}>
          <Voice tone="dawn" muted>Ingen mål i dag.</Voice>
        </View>
        <View style={styles.footer}>
          <Button tone="dawn" label="Sett opp mål" onPress={onSetup} />
        </View>
      </>
    );
  }

  const intro = `${countWord(today.goals.length)} i dag. Først ${first.title.toLowerCase()}${first.time ? ` kl. ${first.time}` : ''}.`;

  return (
    <>
      <View style={styles.gap}>
        <Voice tone="dawn" muted>{intro}</Voice>
      </View>

      <View style={styles.list}>
        {today.goals.map((goal) => (
          <View key={goal.id} style={styles.row}>
            <Text style={styles.goal}>{goal.title}</Text>
            <Text style={styles.time}>{goal.time ?? 'I dag'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        {today.reviewDone ? (
          <View style={styles.doneRow}>
            <StatusMark status="done" tone="dawn" />
            <Text style={styles.caption}>Kvelden er gjort.</Text>
          </View>
        ) : (
          <Button tone="dawn" label="Start kvelden" onPress={onReview} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  date: { ...type.caption, color: palette.textMuted, marginBottom: space.xs },
  gap: { marginTop: space.sm },
  list: { marginTop: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  goal: { ...type.body, color: palette.text },
  time: { ...type.body, color: palette.textMuted, fontVariant: ['tabular-nums'] },
  footer: { marginTop: 'auto', paddingTop: space.lg, gap: space.sm },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, justifyContent: 'center' },
  caption: { ...type.caption, color: palette.textMuted },
});
