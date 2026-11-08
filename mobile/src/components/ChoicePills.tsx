import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

const pillHeight = 44;

type Props = {
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
  loading?: boolean;
};

// Two equal pills side by side inside a card: a black yes and a grey "not now".
export function ChoicePills({ yes, no, onYes, onNo, loading = false }: Props) {
  return (
    <View style={styles.row}>
      <Pill label={yes} onPress={onYes} primary loading={loading} />
      <Pill label={no} onPress={onNo} disabled={loading} />
    </View>
  );
}

type PillProps = { label: string; onPress: () => void; primary?: boolean; loading?: boolean; disabled?: boolean };

function Pill({ label, onPress, primary = false, loading = false, disabled = false }: PillProps) {
  const fg = primary ? palette.actionText : palette.tonalText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      disabled={disabled || loading}
      onPressIn={() => Haptics.selectionAsync()}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: primary ? palette.action : palette.tonal },
        pressed && styles.pressed,
        disabled && styles.inactive,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.label, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  pill: { flex: 1, height: pillHeight, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { ...type.body, fontSize: 15, ...type.strong },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.45 },
});
