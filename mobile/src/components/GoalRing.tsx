import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import type { GoalStatus } from '@/lib/types';
import { palettes, space, type Tone } from '@/theme';

type Props = {
  // null = not answered yet (dashed ring).
  status: GoalStatus | null;
  tone?: Tone;
  size?: number;
};

const STROKE = 2;

// The larger status ring used in grouped lists: filled with a tick = done,
// half filled = partial, thin ring = missed, dashed = not answered yet. Never red.
export function GoalRing({ status, tone = 'dusk', size = space.lg }: Props) {
  const palette = palettes[tone];
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (status === 'done') {
    return (
      <View style={[styles.ring, box, styles.center, { backgroundColor: palette.mark }]}>
        <Icon name="checkmark" color={palette.actionText} size={size / 2} />
      </View>
    );
  }
  if (status === 'partial') {
    return (
      <View style={[styles.ring, box, { borderWidth: STROKE, borderColor: palette.mark }]}>
        <View style={[styles.half, { backgroundColor: palette.mark }]} />
      </View>
    );
  }
  if (status === 'missed') {
    return <View style={[styles.ring, box, styles.faint, { borderWidth: STROKE, borderColor: palette.textMuted }]} />;
  }
  return <View style={[styles.ring, box, styles.dashed, { borderColor: palette.textMuted }]} />;
}

const styles = StyleSheet.create({
  ring: { overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  half: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' },
  faint: { opacity: 0.6 },
  dashed: { borderWidth: STROKE, borderStyle: 'dashed' },
});
