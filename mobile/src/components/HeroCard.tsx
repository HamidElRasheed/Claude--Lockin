import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

// The one big number on a screen. Black card, white text, a chart underneath.
const numberSize = { fontSize: 44, lineHeight: 48, letterSpacing: -1.3 };

type Props = {
  value: string;
  label: string;
  children?: ReactNode;
};

export function HeroCard({ value, label, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top} accessible accessibilityLabel={`${value}, ${label}`}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.hero, borderRadius: radius.lg, padding: space.lg - 4, gap: space.md },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  value: { ...numberSize, fontWeight: '700', color: palette.heroText },
  label: { ...type.caption, fontSize: 15, ...type.strong, color: palette.heroMuted },
});
