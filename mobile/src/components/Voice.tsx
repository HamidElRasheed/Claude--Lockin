import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { palettes, type Tone, type } from '@/theme';

type Props = {
  tone?: Tone;
  muted?: boolean;
  children: ReactNode;
};

// What the app "says": one big bold line, or a quieter lead line when muted. The AI has no audio voice.
export function Voice({ tone = 'dawn', muted = false, children }: Props) {
  const palette = palettes[tone];
  return (
    <Text accessibilityRole={muted ? 'text' : 'header'} style={muted ? [styles.lead, { color: palette.textMuted }] : [styles.title, { color: palette.text }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { ...type.title },
  lead: { ...type.lead },
});
