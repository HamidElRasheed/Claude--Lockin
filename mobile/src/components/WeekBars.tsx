import { StyleSheet, Text, View } from 'react-native';

import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

// Column height of a full bar, and the stub shown for a day with nothing (or nothing done).
const chart = { height: 56, stub: 8, ring: 1.5 };

export type Bar = { key: string; label: string; rate: number | null; marked?: boolean };

type Props = {
  bars: Bar[];
  // "hero" sits on the black card, "plain" on a white surface.
  on?: 'hero' | 'plain';
};

// Plain-View bar chart: one column per day or week, height = rate. A marked column gets a dashed
// ring and a bright label, which is how the heavy day is pointed out without any red.
export function WeekBars({ bars, on = 'hero' }: Props) {
  const c =
    on === 'hero'
      ? { fill: palette.heroText, track: palette.heroTrack, label: palette.heroMuted, strong: palette.heroText }
      : { fill: palette.text, track: palette.tonal, label: palette.textMuted, strong: palette.text };

  return (
    <View style={styles.wrap}>
      <View style={styles.columns}>
        {bars.map((bar) => {
          const filled = bar.rate !== null && bar.rate > 0;
          const height = filled ? Math.max(chart.stub, Math.round((bar.rate ?? 0) * chart.height)) : chart.stub;
          const spoken = bar.rate === null ? 'ingen data' : `${Math.round(bar.rate * 100)} prosent`;
          return (
            <View key={bar.key} style={styles.column} accessible accessibilityLabel={`${bar.label}: ${spoken}`}>
              <View style={[styles.ring, bar.marked && { borderColor: c.label }]}>
                <View style={[styles.bar, { height, backgroundColor: filled ? c.fill : c.track }]} />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.labels} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {bars.map((bar) => (
          <Text key={bar.key} style={[styles.label, { color: bar.marked ? c.strong : c.label }]}>
            {bar.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  columns: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, height: chart.height + 2 * (chart.ring + 2) },
  column: { flex: 1, justifyContent: 'flex-end' },
  ring: {
    borderWidth: chart.ring,
    borderStyle: 'dashed',
    borderColor: 'transparent',
    borderRadius: radius.sm,
    padding: 2,
  },
  bar: { borderRadius: radius.sm - 3 },
  labels: { flexDirection: 'row', gap: space.sm },
  label: { ...type.caption, ...type.strong, flex: 1, textAlign: 'center' },
});
