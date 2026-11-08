import { StyleSheet, Text, View } from 'react-native';

import type { Stats } from '@/lib/types';
import { weekdayLetter, weekdayName, weekdayOrder } from '@/lib/weekdays';
import { palettes, space, type } from '@/theme';

const palette = palettes.dawn;

const cell = { size: 22, gap: 4, radius: 6 };

type Props = {
  goals: Stats['goals'];
};

// One row per goal, one square per weekday. Black at the strength of the rate; an empty
// outlined square where there is no data. A heavy weekday shows up as a pale column.
export function Heatmap({ goals }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={styles.title} />
        <View style={styles.cells}>
          {weekdayOrder.map((wd) => (
            <Text key={wd} style={styles.letter}>
              {weekdayLetter[wd]}
            </Text>
          ))}
        </View>
      </View>
      {goals.map((goal) => (
        <View key={goal.goalId} style={styles.row}>
          <Text style={[styles.title, styles.goal]} numberOfLines={1}>
            {goal.title}
          </Text>
          <View style={styles.cells}>
            {weekdayOrder.map((wd) => {
              const rate = goal.weekdays[wd];
              const spoken = rate === null ? 'ingen data' : `${Math.round(rate * 100)} prosent`;
              return (
                <View
                  key={wd}
                  accessible
                  accessibilityLabel={`${weekdayName[wd]}: ${spoken}`}
                  style={[styles.cell, rate === null ? styles.empty : styles.track]}
                >
                  {rate !== null && rate > 0 && <View style={[styles.fill, { opacity: rate }]} />}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm + 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flex: 1 },
  goal: { ...type.body, color: palette.text },
  cells: { flexDirection: 'row', gap: cell.gap },
  letter: { ...type.caption, ...type.strong, width: cell.size, textAlign: 'center', color: palette.textMuted },
  cell: { width: cell.size, height: cell.size, borderRadius: cell.radius, overflow: 'hidden' },
  empty: { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: palette.line },
  track: { backgroundColor: palette.tonal },
  fill: { ...StyleSheet.absoluteFill, backgroundColor: palette.text },
});
