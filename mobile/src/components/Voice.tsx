import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { palettes, type Tone, type } from '@/theme';

type Props = {
  tone?: Tone;
  muted?: boolean;
  children: ReactNode;
};

// What the app "says": large, calm serif sentences. The AI has no audio voice.
export function Voice({ tone = 'dawn', muted = false, children }: Props) {
  const palette = palettes[tone];
  return (
    <Text accessibilityRole="header" style={[styles.voice, { color: muted ? palette.textMuted : palette.text }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  voice: { ...type.voice },
});
