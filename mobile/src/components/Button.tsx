import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { control, palettes, radius, space, type Tone, type } from '@/theme';

type Variant = 'primary' | 'tonal' | 'text';

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  variant?: Variant;
  icon?: SFSymbol;
  loading?: boolean;
  disabled?: boolean;
  fill?: boolean;
};

// Three levels, one look:
// primary = the one thing to do here (warm, full width, arrow), tonal = a real secondary choice,
// text = a quiet way out. All give a soft press-in and a light tap of haptics.
export function Button({
  label,
  onPress,
  tone = 'dawn',
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fill = variant === 'primary',
}: Props) {
  const palette = palettes[tone];
  const [scale] = useState(() => new Animated.Value(1));
  const inactive = disabled || loading;

  const animateTo = (value: number) =>
    Animated.timing(scale, { toValue: value, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

  const colors = {
    primary: { bg: palette.action, fg: palette.actionText },
    tonal: { bg: palette.tonal, fg: palette.tonalText },
    text: { bg: 'transparent', fg: palette.text },
  }[variant];

  const trailing = icon ?? (variant === 'primary' ? 'arrow.right' : undefined);

  return (
    <Animated.View style={[fill && styles.fill, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        onPress={onPress}
        onPressIn={() => {
          animateTo(0.97);
          Haptics.selectionAsync();
        }}
        onPressOut={() => animateTo(1)}
        disabled={inactive}
        style={({ pressed }) => [
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'text' && styles.text,
          { backgroundColor: colors.bg },
          pressed && variant !== 'text' && styles.pressed,
          inactive && styles.inactive,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.fg} />
        ) : (
          <View style={styles.row}>
            <Text style={[styles.label, variant === 'primary' && styles.strong, { color: colors.fg }]}>{label}</Text>
            {trailing && <Icon name={trailing} color={colors.fg} size={variant === 'primary' ? 17 : 15} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { alignSelf: 'stretch' },
  base: {
    minHeight: control.height,
    paddingHorizontal: space.lg,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { minHeight: control.primaryHeight },
  text: { paddingHorizontal: space.sm, minHeight: control.iconButton },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { ...type.body, fontWeight: '500' },
  strong: { fontWeight: '600' },
  pressed: { opacity: 0.88 },
  inactive: { opacity: 0.45 },
});
