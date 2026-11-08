import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Stats } from '@/lib/types';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

type Props = {
  count: number;
  eyebrow: string;
  line: string;
  stats: Stats | null;
  onPress?: () => void;
};

// The black card on "I dag": today's number, one sentence, and last week's three thin progress lines.
export function TodayHero({ count, eyebrow, line, stats, onPress }: Props) {
  const bars = (stats?.goals ?? [])
    .map((g) => ({ ...g, total: g.done + g.partial + g.missed }))
    .filter((g) => g.total > 0)
    .slice(0, 3);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Start kveldsgjennomgangen' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.numberRow}>
        <Text style={styles.number}>{count}</Text>
        <Text style={styles.unit}>mål i dag</Text>
      </View>
      <Text style={styles.line}>{line}</Text>

      {bars.length > 0 && (
        <View style={styles.bars} accessibilityLabel="Siste sju dager">
          {bars.map((g) => (
            <View key={g.goalId} style={styles.bar}>
              <Text style={styles.score}>
                {g.done}/{g.total}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round((g.rate ?? 0) * 100)}%` }]} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {g.title}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const TRACK = 4;

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.hero,
    borderRadius: radius.lg,
    padding: 22,
    gap: 18,
  },
  pressed: { opacity: 0.92 },
  eyebrow: { ...type.caption, fontWeight: '600', color: palette.heroMuted },
  numberRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  number: { fontSize: 56, lineHeight: 58, fontWeight: '700', letterSpacing: -1.7, color: palette.heroText },
  unit: { ...type.body, fontWeight: '600', color: palette.heroMuted },
  line: { fontSize: 15, lineHeight: 22, color: palette.heroMuted },
  bars: { flexDirection: 'row', gap: 14 },
  bar: { flex: 1, gap: 6 },
  score: { ...type.body, fontWeight: '700', color: palette.heroText, fontVariant: ['tabular-nums'] },
  track: { height: TRACK, borderRadius: TRACK / 2, backgroundColor: palette.heroTrack, overflow: 'hidden' },
  fill: { height: TRACK, borderRadius: TRACK / 2, backgroundColor: palette.heroText },
  name: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: palette.heroMuted },
});
