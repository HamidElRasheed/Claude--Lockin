import type { SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/Icon';
import { control, palettes, radius, type Tone } from '@/theme';

type Props = {
  icon: SFSymbol;
  label: string;
  onPress: () => void;
  tone?: Tone;
};

// Round 44 pt target for close/back/remove. Always has a spoken label.
export function IconButton({ icon, label, onPress, tone = 'dawn' }: Props) {
  const palette = palettes[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.base, { backgroundColor: pressed ? palette.line : palette.tonal }]}
    >
      <Icon name={icon} color={palette.tonalText} size={15} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: control.iconButton,
    height: control.iconButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
