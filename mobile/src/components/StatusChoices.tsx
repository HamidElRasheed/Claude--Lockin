import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GoalStatus } from '@/lib/types';
import { control, palettes, radius, space, type } from '@/theme';

const palette = palettes.dusk;
const label: Record<GoalStatus, string> = { done: 'Gjort', partial: 'Delvis', missed: 'Ikke' };
const spoken: Record<GoalStatus, string> = { done: 'Gjort', partial: 'Delvis', missed: 'Ikke i dag' };

// Three calm pill answers. "Gjort" is the light one, the other two are quiet. Never red.
export function StatusChoices({ onPick }: { onPick: (status: GoalStatus) => void }) {
  return (
    <View style={styles.row}>
      {(['done', 'partial', 'missed'] as const).map((status) => {
        const primary = status === 'done';
        return (
          <Pressable
            key={status}
            accessibilityRole="button"
            accessibilityLabel={spoken[status]}
            onPress={() => {
              Haptics.selectionAsync();
              onPick(status);
            }}
            style={({ pressed }) => [
              styles.choice,
              { backgroundColor: primary ? palette.action : palette.tonal },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.text, { color: primary ? palette.actionText : palette.text }]}>{label[status]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  choice: {
    flex: 1,
    minHeight: control.iconButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  text: { ...type.body, ...type.strong },
});
