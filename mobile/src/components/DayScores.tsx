import { StyleSheet, Text, View } from 'react-native';

import { formatScore } from '@/lib/days';
import { weekdayLetter, weekdayOf } from '@/lib/weekdays';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;
const BAR = 72; // height of a full 10/10 column

type Props = {
  days: { date: string; score: number | null }[];
  target: number;
};

// The day score for each day of the week, Monday to Sunday, on a white card.
// Number on top, a column whose height is the score, a thin line at the weekly target.
// At or over the target = black, under = grey, no evening = an empty dash. Never red.
export function DayScores({ days, target }: Props) {
  const targetBottom = (target / 10) * BAR;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.label}>Dagspoeng</Text>
        <Text style={styles.legend}>Linjen er målet ditt, {target}</Text>
      </View>
      <View style={styles.row}>
        {days.map((day) => {
          const has = day.score !== null;
          const reached = has && (day.score ?? 0) >= target;
          const letter = weekdayLetter[weekdayOf(day.date)];
          const said = has ? `${formatScore(day.score ?? 0)} av 10` : 'ingen kveld';
          return (
            <View key={day.date} style={styles.day} accessible accessibilityLabel={`${letter}: ${said}`}>
              <Text style={[styles.value, !reached && styles.valueUnder]}>{has ? formatScore(day.score ?? 0) : '–'}</Text>
              <View style={styles.track}>
                <View style={[styles.targetLine, { bottom: targetBottom }]} />
                {has && (
                  <View
                    style={[
                      styles.fill,
                      { height: Math.max(4, ((day.score ?? 0) / 10) * BAR) },
                      { backgroundColor: reached ? palette.text : palette.textMuted },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.letter, reached && styles.letterStrong]}>{letter}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderRadius: radius.lg - 4, padding: space.md + 2, gap: space.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { ...type.caption, ...type.strong, color: palette.text },
  legend: { ...type.caption, fontWeight: '400', color: palette.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xs + 2 },
  day: { flex: 1, alignItems: 'center', gap: space.xs + 2 },
  value: { ...type.caption, ...type.strong, color: palette.text, fontVariant: ['tabular-nums'] },
  valueUnder: { color: palette.textMuted },
  track: {
    width: '100%',
    maxWidth: 30,
    height: BAR,
    borderRadius: radius.sm,
    backgroundColor: palette.tonal,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  // A white notch across the column: shows on the grey track and cuts through a black fill.
  targetLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: palette.surface, zIndex: 1 },
  fill: { width: '100%', borderRadius: radius.sm },
  letter: { ...type.caption, color: palette.textMuted },
  letterStrong: { ...type.strong, color: palette.text },
});
