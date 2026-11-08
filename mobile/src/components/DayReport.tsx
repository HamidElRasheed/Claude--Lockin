import { useEffect, useState } from 'react';
import { Animated, Easing, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoalRing } from '@/components/GoalRing';
import { Icon } from '@/components/Icon';
import { dayScore, formatPoints, statusWord } from '@/lib/days';
import type { DailyLog } from '@/lib/types';
import { palettes, radius, space, type Tone, type } from '@/theme';

type Props = {
  log: DailyLog;
  tone: Tone;
  // Under the big score, e.g. "mål i dag".
  scoreLabel?: string;
};

const SCORE_SIZE = space.xxl + space.sm; // 56
const BAR_MS = 900;

// The day at a glance: a big score, the AI's short summary, one tip for tomorrow,
// and every goal with the reason the user gave. Used right after the evening and in the log.
export function DayReport({ log, tone, scoreLabel = 'mål i dag' }: Props) {
  const palette = palettes[tone];
  const { points, total } = dayScore(log.entries);
  const share = total ? points / total : 0;
  const [bar] = useState(() => new Animated.Value(0));
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    Animated.timing(bar, {
      toValue: share,
      duration: BAR_MS,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [bar, share]);

  function toggleReflection() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowReflection((open) => !open);
  }

  const label = { ...type.caption, color: palette.textMuted };

  return (
    <View style={styles.wrap}>
      <View
        style={styles.score}
        accessible
        accessibilityLabel={`${formatPoints(points)} av ${total} ${scoreLabel}`}
      >
        <View style={styles.scoreLine}>
          <Text style={[styles.scoreNumber, { color: palette.text }]}>{formatPoints(points)}</Text>
          <Text style={[styles.scoreOf, { color: palette.textMuted }]}>av {total}</Text>
        </View>
        <View style={[styles.track, { backgroundColor: palette.line }]}>
          <Animated.View style={[styles.fill, { backgroundColor: palette.text, transform: [{ scaleX: bar }] }]} />
        </View>
        <Text style={label}>{scoreLabel}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={label}>Dagen din</Text>
        <Text style={[styles.summary, { color: palette.text }]}>{log.summary}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.hero }]}>
        <Text style={[label, { color: palette.heroMuted }]}>I morgen</Text>
        <Text style={[styles.tip, { color: palette.heroText }]}>{log.tomorrowTip}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[label, styles.sectionLabel]}>Målene</Text>
        <View style={[styles.group, { backgroundColor: palette.surface }]}>
          {log.entries.map((entry, i) => (
            <View key={entry.goalId} style={styles.row} accessible accessibilityLabel={`${entry.goalTitle}, ${entry.reason ?? statusWord[entry.status]}`}>
              <GoalRing status={entry.status} tone={tone} size={space.lg - 2} />
              <View
                style={[
                  styles.rowBody,
                  i < log.entries.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
                ]}
              >
                <Text style={[styles.goal, { color: palette.text }]} numberOfLines={1}>
                  {entry.goalTitle}
                </Text>
                <Text style={[styles.reason, { color: palette.textMuted }]} numberOfLines={2}>
                  {entry.reason ? lowerFirst(entry.reason) : statusWord[entry.status]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {log.reflection && (
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showReflection }}
            onPress={toggleReflection}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
          >
            <Text style={label}>Det du sa</Text>
            <Icon name={showReflection ? 'chevron.up' : 'chevron.down'} color={palette.textMuted} size={12} />
          </Pressable>
          {showReflection && <Text style={[styles.reflection, { color: palette.textMuted }]}>«{log.reflection}»</Text>}
        </View>
      )}
    </View>
  );
}

function lowerFirst(text: string) {
  return text.charAt(0).toLocaleLowerCase('nb') + text.slice(1);
}

const styles = StyleSheet.create({
  wrap: { gap: space.md + space.xs },
  score: { gap: space.sm, paddingBottom: space.sm },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  scoreNumber: { fontSize: SCORE_SIZE, lineHeight: SCORE_SIZE + space.xs, fontWeight: '700', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  scoreOf: { ...type.lead, fontWeight: '600' },
  track: { height: space.xs, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', width: '100%', borderRadius: radius.pill, transformOrigin: 'left' },
  card: { borderRadius: radius.lg, padding: space.md + space.xs, gap: space.sm },
  summary: { ...type.lead, lineHeight: 28 },
  tip: { ...type.body, ...type.strong, lineHeight: 24 },
  section: { gap: space.sm },
  sectionLabel: { marginHorizontal: space.md },
  group: { borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.md },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: space.xxl + space.xs,
    paddingVertical: space.sm + space.xs,
    paddingRight: space.md,
  },
  goal: { ...type.body, fontWeight: '500', flexShrink: 1, maxWidth: '62%' },
  reason: { ...type.caption, fontSize: type.caption.fontSize + 2, fontWeight: '400', flex: 1, textAlign: 'right' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: space.xxl - space.xs, paddingHorizontal: space.md, alignSelf: 'flex-start' },
  pressed: { opacity: 0.6 },
  reflection: { ...type.body, paddingHorizontal: space.md },
});
