import { StyleSheet, View } from 'react-native';

import type { GoalStatus } from '@/lib/types';
import { palettes, type Tone } from '@/theme';

type Props = {
  status: GoalStatus;
  tone?: Tone;
};

const SIZE = 10;

// Calm status dot: filled = done, half = partial, empty ring = missed. Never red.
export function StatusMark({ status, tone = 'dusk' }: Props) {
  const palette = palettes[tone];
  if (status === 'done') {
    return <View style={[styles.dot, { backgroundColor: palette.orb }]} />;
  }
  if (status === 'partial') {
    return (
      <View style={[styles.dot, styles.ring, { borderColor: palette.orb }]}>
        <View style={[styles.half, { backgroundColor: palette.orb }]} />
      </View>
    );
  }
  return <View style={[styles.dot, styles.ring, { borderColor: palette.textMuted }]} />;
}

const styles = StyleSheet.create({
  dot: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: 'hidden' },
  ring: { borderWidth: 1.5 },
  half: { width: '50%', height: '100%' },
});
