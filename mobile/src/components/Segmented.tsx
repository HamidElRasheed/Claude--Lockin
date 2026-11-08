import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palettes, radius, type } from '@/theme';

const palette = palettes.dawn;

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

// iOS-style segmented control: a grey track with a white pill on the chosen option.
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={[styles.option, on && styles.on]}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: palette.tonal, borderRadius: radius.pill, padding: 3 },
  option: { flex: 1, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: palette.surface },
  label: { ...type.body, fontSize: 15, fontWeight: '500', color: palette.textMuted },
  labelOn: { ...type.strong, color: palette.text },
});
