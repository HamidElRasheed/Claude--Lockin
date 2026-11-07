import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { orb, palettes, type Tone } from '@/theme';

export type OrbMode = 'idle' | 'listening' | 'thinking' | 'rest';

type Props = {
  mode?: OrbMode;
  tone?: Tone;
  size?: number;
};

const scaleFor: Record<OrbMode, number> = { idle: 1, listening: 1.22, thinking: 1.05, rest: 0.7 };

// A living light that breathes slowly, swells while you talk and settles when you are done.
export function Orb({ mode = 'idle', tone = 'dusk', size = orb.size }: Props) {
  const palette = palettes[tone];
  const [base] = useState(() => new Animated.Value(scaleFor[mode]));
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(base, {
      toValue: scaleFor[mode],
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [base, mode]);

  useEffect(() => {
    const half = mode === 'listening' ? orb.listenMs : orb.breatheMs;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mode, pulse]);

  const breath = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, mode === 'listening' ? 1.1 : 1.06] });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: mode === 'listening' ? [0.6, 1] : [0.25, 0.5],
  });
  const scale = Animated.multiply(base, breath);
  const halo = size * 1.9;

  return (
    <View style={[styles.wrap, { width: halo, height: halo }]} pointerEvents="none" accessibilityElementsHidden>
      <Animated.View
        style={[
          styles.circle,
          { width: halo, height: halo, borderRadius: halo / 2, borderWidth: 1, borderColor: palette.orb, opacity: haloOpacity, transform: [{ scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.orb,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute' },
});
