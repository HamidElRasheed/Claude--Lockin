import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palettes, radius, space, type, type Tone } from '@/theme';

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  tone?: Tone;
};

const SIZE = space.xxl + space.xs; // 52, comfortably above the 44 pt touch target
const rows = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
];

// 1–10 as round buttons in two rows. The chosen one is filled, the rest are quiet rings.
export function ScorePicker({ value, onChange, tone = 'dusk' }: Props) {
  const palette = palettes[tone];

  function pick(n: number) {
    Haptics.selectionAsync();
    onChange(n);
  }

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {rows.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map((n) => {
            const chosen = value === n;
            return (
              <Pressable
                key={n}
                accessibilityRole="radio"
                accessibilityLabel={`${n} av 10`}
                accessibilityState={{ selected: chosen }}
                onPress={() => pick(n)}
                style={({ pressed }) => [
                  styles.circle,
                  { borderColor: chosen ? palette.action : palette.line },
                  chosen && { backgroundColor: palette.action },
                  pressed && !chosen && { backgroundColor: palette.tonal },
                ]}
              >
                <Text style={[styles.number, { color: chosen ? palette.actionText : palette.text }]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.ends}>
        <Text style={[styles.end, { color: palette.textMuted }]}>Lite fornøyd</Text>
        <Text style={[styles.end, { color: palette.textMuted }]}>Veldig fornøyd</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { ...type.body, ...type.strong, fontVariant: ['tabular-nums'] },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  end: { ...type.caption },
});
