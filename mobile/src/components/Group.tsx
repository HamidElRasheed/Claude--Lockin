import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

// iOS grouped list: a small grey heading, then one white box of rows.
export function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.box}>{children}</View>
    </View>
  );
}

type RowProps = {
  title: string;
  detail?: string;
  trailing?: ReactNode | string;
  leading?: ReactNode;
  // The last row has no divider under it.
  last?: boolean;
  onPress?: () => void;
};

// One row, at least 54 pt. The divider starts after the leading mark, like Apple's lists.
export function Row({ title, detail, trailing, leading, last = false, onPress }: RowProps) {
  const body = (
    <>
      {leading}
      <View style={[styles.content, !last && styles.divider]}>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
        {typeof trailing === 'string' ? <Text style={styles.trailing}>{trailing}</Text> : trailing}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const ROW = 54;

const styles = StyleSheet.create({
  group: { gap: space.sm },
  label: { ...type.caption, fontWeight: '600', color: palette.textMuted, marginHorizontal: space.md },
  box: { backgroundColor: palette.surface, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: space.md, minHeight: ROW },
  pressed: { backgroundColor: palette.tonal },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: ROW,
    paddingRight: space.md,
    paddingVertical: space.sm,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  text: { flex: 1, gap: 2 },
  title: { ...type.body, fontWeight: '500', color: palette.text },
  detail: { ...type.caption, color: palette.textMuted },
  trailing: { ...type.body, fontSize: 15, color: palette.textMuted, fontVariant: ['tabular-nums'] },
});
