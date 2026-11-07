import { Pressable, StyleSheet, Text } from 'react-native';

import { palettes, radius, space, type Tone, type } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  variant?: 'primary' | 'quiet' | 'outline';
  disabled?: boolean;
};

// One primary per screen; everything else is quiet or outline.
export function Button({ label, onPress, tone = 'dawn', variant = 'primary', disabled = false }: Props) {
  const palette = palettes[tone];
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary && { backgroundColor: palette.action },
        variant === 'outline' && { borderWidth: 1, borderColor: palette.line },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: isPrimary ? palette.actionText : variant === 'outline' ? palette.text : palette.textMuted },
          isPrimary && styles.strong,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...type.body },
  strong: { fontWeight: '600' },
  dimmed: { opacity: 0.6 },
});
