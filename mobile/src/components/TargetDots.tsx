import { StyleSheet, Text, View } from 'react-native';

import { formatScore } from '@/lib/days';
import { weekdayLetter, weekdayOf } from '@/lib/weekdays';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;
const DOT = space.lg + space.xs; // 28

type Props = {
  days: { date: string; score: number | null }[];
  target: number;
};

// The weekly target on the black hero card: one dot per day, Monday to Sunday.
// Filled = at or over the target, ring = reviewed but under, faint = no review. Never red.
export function TargetDots({ days, target }: Props) {
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const reached = day.score !== null && day.score >= target;
        const reviewed = day.score !== null;
        const letter = weekdayLetter[weekdayOf(day.date)];
        const said = reviewed ? `${formatScore(day.score ?? 0)} av 10` : 'ingen kveld';
        return (
          <View key={day.date} style={styles.day} accessible accessibilityLabel={`${letter}: ${said}`}>
            <View
              style={[
                styles.dot,
                reached && { backgroundColor: palette.heroText, borderColor: palette.heroText },
                reviewed && !reached && { borderColor: palette.heroMuted },
              ]}
            />
            <Text style={[styles.letter, reached && styles.letterStrong]}>{letter}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: space.sm },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.heroTrack,
  },
  letter: { ...type.caption, color: palette.heroMuted },
  letterStrong: { color: palette.heroText, ...type.strong },
});
