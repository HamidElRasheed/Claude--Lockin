import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoalRing } from '@/components/GoalRing';
import { statusWord } from '@/lib/days';
import type { GoalStatus } from '@/lib/types';
import { palettes, space, type } from '@/theme';

const palette = palettes.dusk;
const REVEAL_MS = 700;

type Props = {
  title: string;
  time: string | null;
  status: GoalStatus | null;
  reason: string | null;
  // Shown under the title while the goal has no status, e.g. "ikke nevnt".
  pendingNote?: string | null;
  // Wait this long before the mark settles: gives the staggered tick-off.
  delay?: number;
  // Another goal is in focus: this one steps back.
  dimmed?: boolean;
  // Last row in the group: no separator under it.
  last?: boolean;
  onPress?: () => void;
};

function lowerFirst(text: string) {
  return text.charAt(0).toLocaleLowerCase('nb') + text.slice(1);
}

// One goal in the evening's grouped list. When it gets a status the ring softly
// fills in and the reason rises under the title.
export function ReviewGoalRow({
  title,
  time,
  status,
  reason,
  pendingNote = null,
  delay = 0,
  dimmed = false,
  last = false,
  onPress,
}: Props) {
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
  const pendingOpacity = reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const rise = reveal.interpolate({ inputRange: [0, 1], outputRange: [space.xs, 0] });
  // A goal set back to pending keeps its old mark only until it has faded out.
  const note = status && shown ? lowerFirst(shown.reason ?? statusWord[shown.status]) : null;

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
            <GoalRing status={null} />
          </Animated.View>
          {shown && (
            <Animated.View style={[styles.layer, { opacity: reveal, transform: [{ scale: markScale }] }]}>
              <GoalRing status={shown.status} />
            </Animated.View>
          )}
        </View>
        <View style={[styles.body, !last && styles.separator]}>
          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {note ? (
              <Animated.Text style={[styles.note, { opacity: reveal, transform: [{ translateY: rise }] }]} numberOfLines={1}>
                {note}
              </Animated.Text>
            ) : (
              pendingNote && <Text style={styles.note}>{pendingNote}</Text>
            )}
          </View>
          {time && <Text style={styles.time}>{time}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.md },
  pressed: { backgroundColor: palette.tonal },
  mark: { width: space.lg, height: space.lg },
  layer: { position: 'absolute' },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: space.xxl + space.sm,
    paddingVertical: space.sm + space.xs,
    paddingRight: space.md,
  },
  separator: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  text: { flex: 1, gap: 2 },
  title: { ...type.body, ...type.strong, color: palette.text },
  note: { ...type.caption, fontWeight: '400', color: palette.textMuted },
  time: { ...type.caption, color: palette.textMuted, fontVariant: ['tabular-nums'] },
});
