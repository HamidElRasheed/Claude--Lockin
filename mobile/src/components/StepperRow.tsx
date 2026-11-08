import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;
const ROW = 54;
const STEP = space.xl + space.xs; // 36; with hitSlop the target reaches 44 pt

type Props = {
  value: number;
  min: number;
  max: number;
  // Text around the bold number, e.g. after = " av 7 dager" gives "5 av 7 dager".
  before?: string;
  after?: string;
  // Read aloud, e.g. "dager i uka".
  label: string;
  onChange: (value: number) => void;
  last?: boolean;
};

// One row in an iOS grouped list: a sentence with the number in bold, and −/+ on the right.
export function StepperRow({ value, min, max, before = '', after = '', label, onChange, last = false }: Props) {
  function step(by: number) {
    const next = Math.min(max, Math.max(min, value + by));
    if (next === value) return;
    Haptics.selectionAsync();
    onChange(next);
  }

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: `${before}${value}${after}`.trim() }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <View style={[styles.content, !last && styles.divider]}>
        <Text style={styles.text}>
          {before}
          <Text style={styles.number}>{value}</Text>
          {after}
        </Text>
        <View style={styles.buttons}>
          <StepButton icon="minus" disabled={value <= min} onPress={() => step(-1)} />
          <StepButton icon="plus" disabled={value >= max} onPress={() => step(1)} />
        </View>
      </View>
    </View>
  );
}

function StepButton({ icon, disabled, onPress }: { icon: 'minus' | 'plus'; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      hitSlop={space.xs}
      disabled={disabled}
      onPress={onPress}
      importantForAccessibility="no"
      style={({ pressed }) => [styles.step, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Icon name={icon} color={palette.text} size={14} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.md, minHeight: ROW },
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
  text: { ...type.body, flex: 1, color: palette.text, fontVariant: ['tabular-nums'] },
  number: { fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: space.sm },
  step: {
    width: STEP,
    height: STEP,
    borderRadius: radius.pill,
    backgroundColor: palette.tonal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.3 },
});
