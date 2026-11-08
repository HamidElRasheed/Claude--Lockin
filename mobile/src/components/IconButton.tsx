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

// Round 44 pt target for add/close/back/remove. White on the light mood, soft grey on the dark one.
export function IconButton({ icon, label, onPress, tone = 'dawn' }: Props) {
  const palette = palettes[tone];
  const background = tone === 'dawn' ? palette.surface : palette.tonal;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.base, { backgroundColor: background }, pressed && styles.pressed]}
    >
      <Icon name={icon} color={palette.text} size={17} />
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
  pressed: { opacity: 0.6 },
});
