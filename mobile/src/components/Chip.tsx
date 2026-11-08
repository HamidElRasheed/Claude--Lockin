import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';

import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  // "round" is a 40 pt circle for single letters (weekdays).
  round?: boolean;
  accessibilityLabel?: string;
};

// A tap-to-choose pill: grey when off, black with white text when on.
export function Chip({ label, selected = false, onPress, round = false, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      hitSlop={round ? 4 : 0}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        round && styles.round,
        { backgroundColor: selected ? palette.action : palette.tonal },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: selected ? palette.actionText : palette.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: { width: 40, paddingHorizontal: 0 },
  label: { ...type.body, fontSize: 15, ...type.strong },
  pressed: { opacity: 0.8 },
});
