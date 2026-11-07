import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Orb } from '@/components/Orb';
import { Screen } from '@/components/Screen';
import { Voice } from '@/components/Voice';
import { api } from '@/lib/api';
import type { WeeklyReport } from '@/lib/types';
import { isoWeek } from '@/lib/words';
import { palettes, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; report: WeeklyReport };

// The weekly report reads like a short letter: what happened, why, and one concrete offer.
export default function WeekScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [answered, setAnswered] = useState<'yes' | 'no' | null>(null);

  const fetchData = useCallback(() => {
    api
      .getWeeklyReport(isoWeek(new Date()))
      .then((report) => setState({ kind: 'ready', report }))
      .catch(() => setState({ kind: 'error' }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchData();
  };

  const weekNumber = state.kind === 'ready' ? Number(state.report.week.split('W')[1]) : null;

  return (
    <Screen tone="dawn">
      <View style={styles.header}>
        <Orb tone="dawn" size={14} />
        <Text style={styles.caption}>{weekNumber ? `Uke ${weekNumber}` : 'Uken din'}</Text>
        <Button tone="dawn" variant="quiet" label="Lukk" onPress={() => router.back()} />
      </View>

      {state.kind === 'loading' && <Voice tone="dawn" muted>Leser uken din.</Voice>}

      {state.kind === 'error' && (
        <>
          <Voice tone="dawn" muted>Fikk ikke hentet uken din.</Voice>
          <View style={styles.footer}>
            <Button tone="dawn" label="Prøv igjen" onPress={retry} />
          </View>
        </>
      )}

      {state.kind === 'ready' && (
        <Letter report={state.report} answered={answered} onAnswer={setAnswered} />
      )}
    </Screen>
  );
}

function Letter({
  report,
  answered,
  onAnswer,
}: {
  report: WeeklyReport;
  answered: 'yes' | 'no' | null;
  onAnswer: (a: 'yes' | 'no') => void;
}) {
  const [suggestion] = report.suggestions;
  const empty = report.patterns.length === 0 && report.wentWell.length === 0;

  if (empty) {
    return <Voice tone="dawn" muted>Uken har så vidt begynt. Snakk med meg noen kvelder, så ser vi mønstrene sammen.</Voice>;
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.letter} showsVerticalScrollIndicator={false}>
        {report.patterns.map((p, i) => (
          <Voice key={`p${i}`} tone="dawn" muted={i > 0}>
            {p}
          </Voice>
        ))}
        {report.wentWell.map((w, i) => (
          <Voice key={`w${i}`} tone="dawn" muted>
            {w}
          </Voice>
        ))}
      </ScrollView>

      {suggestion && (
        <View style={styles.footer}>
          {answered === null ? (
            <>
              <Text style={styles.body}>{suggestion.text}</Text>
              <Button tone="dawn" label="Ja, gjør det" onPress={() => onAnswer('yes')} />
              <Button tone="dawn" variant="quiet" label="Ikke nå" onPress={() => onAnswer('no')} />
            </>
          ) : (
            <Text style={styles.body}>{answered === 'yes' ? 'Avtalt. Vi prøver det neste uke.' : 'Greit. Vi lar det være som det er.'}</Text>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xl },
  caption: { ...type.caption, color: palette.textMuted, flex: 1 },
  scroll: { flex: 1 },
  letter: { gap: space.lg, paddingBottom: space.lg },
  footer: { gap: space.sm, paddingTop: space.md },
  body: { ...type.body, color: palette.text, marginBottom: space.sm },
});
