import { StyleSheet, Text, View } from 'react-native';

import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

const numberSize = { fontSize: 28, lineHeight: 34, letterSpacing: -0.6 };

type Props = {
  label: string;
  value: string;
  note?: string | null;
};

// A small white number card: what, how many, and one short line about why.
export function StatCard({ label, value, note }: Props) {
  return (
    <View style={styles.card} accessible accessibilityLabel={[label, value, note].filter(Boolean).join(', ')}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value}>{value}</Text>
      {note ? (
        <Text style={styles.note} numberOfLines={2}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '40%',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  label: { ...type.caption, ...type.strong, color: palette.textMuted },
  value: { ...numberSize, fontWeight: '700', color: palette.text },
  note: { ...type.caption, fontWeight: '400', color: palette.textMuted },
});
