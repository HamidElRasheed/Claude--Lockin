import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import type { GoalStatus } from '@/lib/types';
import { palettes, type Tone } from '@/theme';

type Props = {
  // null = not mentioned yet (dashed ring).
  status: GoalStatus | null;
  tone?: Tone;
};

const SIZE = 22;
const BORDER = 2;

// Calm status ring: filled with a tick = done, half = partial, empty ring = missed or not yet.
// Never red, never a cross.
export function StatusMark({ status, tone = 'dusk' }: Props) {
  const palette = palettes[tone];

  if (status === 'done') {
    return (
      <View accessibilityLabel="Gjort" style={[styles.mark, { backgroundColor: palette.mark }]}>
        <Icon name="checkmark" color={palette.actionText} size={11} />
      </View>
    );
  }
  if (status === 'partial') {
    return (
      <View accessibilityLabel="Delvis" style={[styles.mark, styles.ring, styles.halfWrap, { borderColor: palette.mark }]}>
        <View style={[styles.half, { backgroundColor: palette.mark }]} />
      </View>
    );
  }
  if (status === null) {
    return (
      <View
        accessibilityLabel="Ikke nevnt"
        style={[styles.mark, styles.ring, styles.dashed, { borderColor: palette.textMuted }]}
      />
    );
  }
  return (
    <View accessibilityLabel="Ikke gjort" style={[styles.mark, styles.ring, styles.empty, { borderColor: palette.text }]} />
  );
}

const styles = StyleSheet.create({
  mark: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: BORDER },
  // The sketch's empty ring is the text colour at about 22 %.
  empty: { opacity: 0.22 },
  dashed: { borderStyle: 'dashed' },
  halfWrap: { alignItems: 'flex-end' },
  half: { width: '50%', height: '100%' },
});
