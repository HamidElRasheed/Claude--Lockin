import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { DayReport } from '@/components/DayReport';
import { Screen } from '@/components/Screen';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import { weekdayName } from '@/lib/days';
import type { DailyLog } from '@/lib/types';
import { palettes, space, type } from '@/theme';

const palette = palettes.dusk;
const ENTER_MS = 900;

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'ready'; log: DailyLog };

// Right after the evening: the day's report, then goodnight. No judgement.
export default function DoneScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [state, setState] = useState<State>(() => (date ? { kind: 'loading' } : { kind: 'missing' }));
  const [enter] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!date) return;
    api
      .getLog(date)
      .then((log) => setState({ kind: 'ready', log }))
      .catch(() => setState({ kind: 'missing' }));
  }, [date]);

  useEffect(() => {
    if (state.kind === 'loading') return;
    Animated.timing(enter, { toValue: 1, duration: ENTER_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter, state.kind]);

  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [space.lg, 0] });

  return (
    <Screen tone="dusk">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.caption}>{date ? `Kveld · ${weekdayName(date)}` : 'I kveld'}</Text>
          <Voice tone="dusk">{state.kind === 'loading' ? 'Et øyeblikk …' : 'Sov godt.'}</Voice>
        </View>

        <Animated.View style={{ opacity: enter, transform: [{ translateY: rise }] }}>
          {state.kind === 'ready' && <DayReport log={state.log} tone="dusk" />}
          {state.kind === 'missing' && (
            <Voice tone="dusk" muted>
              Kvelden er lagret. Rapporten dukker opp i loggen.
            </Voice>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button tone="dusk" label="Ferdig" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.xl, paddingBottom: space.xl },
  header: { gap: space.xs },
  caption: { ...type.caption, color: palette.textMuted },
  footer: { paddingTop: space.md },
});
