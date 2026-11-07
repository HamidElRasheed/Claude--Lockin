import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Orb } from '@/components/Orb';
import { Screen } from '@/components/Screen';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import { countWord, greeting } from '@/lib/words';
import type { Today } from '@/lib/types';
import { palettes, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; today: Today };

// Morning: the app tells you, in one calm sentence, what today holds.
export default function MorningScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const fetchData = useCallback(() => {
    api
      .getToday()
      .then((today) => setState({ kind: 'ready', today }))
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
      <View style={styles.orb}>
        <Orb tone="dawn" size={150} />
      </View>

      <Voice tone="dawn">{greeting(new Date())}</Voice>

      {state.kind === 'loading' && <Voice tone="dawn" muted>Et øyeblikk.</Voice>}

      {state.kind === 'error' && (
        <>
          <Voice tone="dawn" muted>Fikk ikke hentet dagen din.</Voice>
          <View style={styles.footer}>
            <Button tone="dawn" label="Prøv igjen" onPress={retry} />
          </View>
        </>
      )}

      {state.kind === 'ready' && <Ready today={state.today} onReview={() => router.push('/review')} onWeek={() => router.push('/week')} onLog={() => router.push('/log')} onSetup={() => router.push('/onboarding')} />}
    </Screen>
  );
}

function Ready({
  today,
  onReview,
  onWeek,
  onLog,
  onSetup,
}: {
  today: Today;
  onReview: () => void;
  onWeek: () => void;
  onLog: () => void;
  onSetup: () => void;
}) {
  const [first] = today.goals;

  if (!first) {
    return (
      <>
        <View style={styles.gap}>
          <Voice tone="dawn" muted>Ingen mål i dag. Nyt den.</Voice>
        </View>
        <View style={styles.footer}>
          <Button tone="dawn" variant="outline" label="Sett opp mål" onPress={onSetup} />
        </View>
      </>
    );
  }

  const intro = `${countWord(today.goals.length)} i dag. Først ${first.title.toLowerCase()}${first.time ? `, kl. ${first.time}` : ''}.`;

  return (
    <>
      <View style={styles.gap}>
        <Voice tone="dawn" muted>{intro}</Voice>
      </View>

      <View style={styles.list}>
        {today.goals.map((goal, i) => (
          <View key={goal.id} style={styles.row}>
            <Text style={[styles.time, i === 0 && styles.timeFirst]}>{goal.time ?? '–'}</Text>
            <Text style={[styles.goal, i > 0 && styles.goalLater]}>{goal.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.caption}>{today.reviewDone ? 'Kvelden er gjort.' : 'Vi snakkes i kveld.'}</Text>
        <View style={styles.links}>
          {!today.reviewDone && <Button tone="dawn" variant="outline" label="Start kvelden" onPress={onReview} />}
          <Button tone="dawn" variant="quiet" label="Uken din" onPress={onWeek} />
          <Button tone="dawn" variant="quiet" label="Dagene" onPress={onLog} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', top: -150, right: -130 },
  gap: { marginTop: space.lg },
  list: { marginTop: 'auto', gap: space.md },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  time: { ...type.caption, width: 48, color: palette.textMuted, fontVariant: ['tabular-nums'] },
  timeFirst: { color: palette.text, fontWeight: '600' },
  goal: { ...type.body, color: palette.text },
  goalLater: { color: palette.textMuted },
  footer: { marginTop: space.xxl, gap: space.md },
  caption: { ...type.caption, color: palette.textMuted },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, alignItems: 'center' },
});
