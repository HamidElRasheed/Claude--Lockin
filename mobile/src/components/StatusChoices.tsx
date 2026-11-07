import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusMark } from '@/components/StatusMark';
import type { GoalStatus } from '@/lib/types';
import { control, palettes, radius, space, type } from '@/theme';

const palette = palettes.dusk;
const label: Record<GoalStatus, string> = { done: 'Gjort', partial: 'Delvis', missed: 'Ikke i dag' };

// Three calm, equal answers with the same marks the log uses. Never red.
export function StatusChoices({ onPick }: { onPick: (status: GoalStatus) => void }) {
  return (
    <View style={styles.row}>
      {(['done', 'partial', 'missed'] as const).map((status) => (
        <Pressable
          key={status}
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync();
            onPick(status);
          }}
          style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
        >
          <StatusMark status={status} />
          <Text style={styles.text}>{label[status]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  choice: {
    flex: 1,
    minHeight: control.primaryHeight + space.md,
    borderRadius: radius.button,
    backgroundColor: palette.tonal,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  pressed: { backgroundColor: palette.line },
  text: { ...type.body, color: palette.text, fontWeight: '500' },
});
