import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusMark } from '@/components/StatusMark';
import type { GoalStatus } from '@/lib/types';
import { palettes, space, type } from '@/theme';

const palette = palettes.dusk;
const REVEAL_MS = 700;
const statusWord: Record<GoalStatus, string> = { done: 'gjort', partial: 'delvis', missed: 'ikke i dag' };

type Props = {
  title: string;
  time: string | null;
  status: GoalStatus | null;
  reason: string | null;
  // Wait this long before the mark settles: gives the staggered tick-off.
  delay?: number;
  // Another goal is in focus: this one steps back.
  dimmed?: boolean;
  onPress?: () => void;
};

function lowerFirst(text: string) {
  return text.charAt(0).toLocaleLowerCase('nb') + text.slice(1);
}

// One goal in the evening list. When it gets a status the mark softly fills in
// and the reason rises under the title.
export function ReviewGoalRow({ title, time, status, reason, delay = 0, dimmed = false, onPress }: Props) {
  const [reveal] = useState(() => new Animated.Value(status ? 1 : 0));
  const [focus] = useState(() => new Animated.Value(dimmed ? 0.35 : 1));
  const [shown, setShown] = useState<{ status: GoalStatus; reason: string | null } | null>(
    status ? { status, reason } : null,
  );

  useEffect(() => {
    // Back to pending: the old mark simply fades out of view.
    reveal.setValue(0);
    if (!status) return;
    const timer = setTimeout(() => {
      setShown({ status, reason });
      Haptics.selectionAsync();
      Animated.timing(reveal, {
        toValue: 1,
        duration: REVEAL_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
    // delay only matters for the change that triggers the reveal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, reason, reveal]);

  useEffect(() => {
    Animated.timing(focus, {
      toValue: dimmed ? 0.35 : 1,
      duration: 500,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [dimmed, focus]);

  const markScale = reveal.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pendingOpacity = reveal.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  const rise = reveal.interpolate({ inputRange: [0, 1], outputRange: [space.xs, 0] });
  const note = shown ? lowerFirst(shown.reason ?? statusWord[shown.status]) : null;

  return (
    <Animated.View style={{ opacity: focus }}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${title}${shown ? `, ${statusWord[shown.status]}` : ''}`}
        accessibilityHint={onPress ? 'Trykk for å endre' : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.mark}>
          <Animated.View style={[styles.layer, { opacity: pendingOpacity }]}>
            <StatusMark status="missed" />
          </Animated.View>
          {shown && (
            <Animated.View style={[styles.layer, { opacity: reveal, transform: [{ scale: markScale }] }]}>
              <StatusMark status={shown.status} />
            </Animated.View>
          )}
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {note && (
            <Animated.Text style={[styles.note, { opacity: reveal, transform: [{ translateY: rise }] }]} numberOfLines={1}>
              {note}
            </Animated.Text>
          )}
        </View>
        {time && <Text style={styles.time}>{time}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.sm },
  pressed: { opacity: 0.6 },
  mark: { width: space.md, height: type.body.lineHeight, alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute' },
  text: { flex: 1 },
  title: { ...type.body, color: palette.text },
  note: { ...type.caption, color: palette.textMuted },
  time: { ...type.caption, color: palette.textMuted, lineHeight: type.body.lineHeight },
});
