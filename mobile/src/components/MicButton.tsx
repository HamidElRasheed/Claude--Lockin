import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { orb, palettes, space, type Tone } from '@/theme';

export type MicState = 'idle' | 'listening' | 'thinking' | 'off';

type Props = {
  state: MicState;
  onPress: () => void;
  tone?: Tone;
};

const SIZE = space.xxxl + space.sm; // 80
const HALO = SIZE + space.md + space.xs; // a 10 pt ring around it

// The big round microphone at the bottom of the evening. Tap to start, tap to stop.
// A soft ring breathes around it while it listens.
export function MicButton({ state, onPress, tone = 'dusk' }: Props) {
  const palette = palettes[tone];
  const [pulse] = useState(() => new Animated.Value(0));
  const [press] = useState(() => new Animated.Value(1));
  const listening = state === 'listening';

  useEffect(() => {
    pulse.setValue(0);
    if (!listening) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: orb.listenMs * 1.4, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: orb.listenMs * 1.4, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  const animateTo = (value: number) =>
    Animated.timing(press, { toValue: value, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });

  return (
    <View style={styles.wrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          { backgroundColor: listening ? palette.tonal : palette.orbGlow, opacity: haloOpacity, transform: [{ scale: haloScale }] },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: press }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Stopp opptaket' : 'Start opptaket'}
          accessibilityState={{ disabled: state === 'thinking' || state === 'off', busy: state === 'thinking' }}
          disabled={state === 'thinking' || state === 'off'}
          onPress={onPress}
          onPressIn={() => animateTo(0.94)}
          onPressOut={() => animateTo(1)}
          style={[styles.button, { backgroundColor: palette.action }, state === 'off' && styles.off]}
        >
          {state === 'thinking' ? (
            <ActivityIndicator color={palette.actionText} />
          ) : (
            <Icon name={listening ? 'stop.fill' : 'mic.fill'} color={palette.actionText} size={listening ? 24 : 28} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: HALO, height: HALO, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: HALO, height: HALO, borderRadius: HALO / 2 },
  button: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.35 },
});
