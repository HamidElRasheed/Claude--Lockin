import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palettes, space, type } from '@/theme';

const palette = palettes.dawn;

type Props = {
  // Small grey line above the title, usually the date.
  eyebrow?: string;
  title: string;
  // A round button to the right, aligned with the title's baseline.
  accessory?: ReactNode;
};

// Apple-style screen header: a small grey line, a 34 pt bold title, and an optional button.
export function LargeTitle({ eyebrow, title, accessory }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.eyebrow}>{eyebrow ?? ' '}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md },
  text: { flex: 1, gap: 2 },
  eyebrow: { ...type.caption, fontWeight: '600', color: palette.textMuted },
  title: { ...type.title, color: palette.text },
});
