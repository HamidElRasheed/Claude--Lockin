import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { GoalRing } from '@/components/GoalRing';
import { Icon } from '@/components/Icon';
import { dayScore, formatPoints, formatScore, statusWord } from '@/lib/days';
import type { DailyLog } from '@/lib/types';
import { palettes, radius, space, type Tone, type } from '@/theme';

type Props = {
  log: DailyLog;
  tone: Tone;
  // Under the big score, e.g. "mål i dag".
  scoreLabel?: string;
};

const SCORE_SIZE = space.xxl + space.sm; // 56
const DAY_SCORE_SIZE = space.xxxl + space.sm; // 80, the biggest thing on the screen
const BAR_MS = 900;

// The day at a glance: the day score 1–10 (or the goal points on older days), the AI's short summary, one tip for tomorrow,
// and every goal with the reason the user gave. Used right after the evening and in the log.
export function DayReport({ log, tone, scoreLabel = 'mål i dag' }: Props) {
  const router = useRouter();
  const palette = palettes[tone];
  const { points, total } = dayScore(log.entries);
  const hasScore = log.score !== null && log.score !== undefined;
  const share = hasScore ? (log.score ?? 0) / 10 : total ? points / total : 0;
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
      {hasScore ? (
        <View style={styles.score} accessible accessibilityLabel={`Dagsscore ${formatScore(log.score ?? 0)} av 10. ${scoreDetail(log, points, total)}`}>
          <View style={styles.scoreLine}>
            <Text style={[styles.dayScore, { color: palette.text }]}>{formatScore(log.score ?? 0)}</Text>
            <Text style={[styles.scoreOf, { color: palette.textMuted }]}>/10</Text>
          </View>
          <View style={[styles.thinTrack, { backgroundColor: palette.line }]}>
            <Animated.View style={[styles.fill, { backgroundColor: palette.text, transform: [{ scaleX: bar }] }]} />
          </View>
          <Text style={[styles.detail, { color: palette.textMuted }]}>{scoreDetail(log, points, total)}</Text>
        </View>
      ) : (
        <View style={styles.score} accessible accessibilityLabel={`${formatPoints(points)} av ${total} ${scoreLabel}`}>
          <View style={styles.scoreLine}>
            <Text style={[styles.scoreNumber, { color: palette.text }]}>{formatPoints(points)}</Text>
            <Text style={[styles.scoreOf, { color: palette.textMuted }]}>av {total}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: palette.line }]}>
            <Animated.View style={[styles.fill, { backgroundColor: palette.text, transform: [{ scaleX: bar }] }]} />
          </View>
          <Text style={label}>{scoreLabel}</Text>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={label}>Dagen din</Text>
        <Text style={[styles.summary, { color: palette.text }]}>{log.summary}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.hero }]}>
        <Text style={[label, { color: palette.heroMuted }]}>I morgen</Text>
        <Text style={[styles.tip, { color: palette.heroText }]}>{log.tomorrowTip}</Text>
      </View>

      {log.suggestion && (
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={label}>Forslag</Text>
          <Text style={[styles.suggestion, { color: palette.text }]}>{log.suggestion}</Text>
          <View style={styles.suggestionAction}>
            <Button tone={tone} variant="tonal" label="Se målene" icon="target" onPress={() => router.navigate('/goals')} />
          </View>
        </View>
      )}

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

// "Mål 2 av 3 · Fornøyd 8/10". Points use a comma, like the score.
function scoreDetail(log: DailyLog, points: number, total: number): string {
  const goals = `Mål ${formatPoints(points)} av ${total}`;
  return log.satisfaction ? `${goals} · Fornøyd ${log.satisfaction}/10` : goals;
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
  dayScore: { fontSize: DAY_SCORE_SIZE, lineHeight: DAY_SCORE_SIZE + space.xs, fontWeight: '700', letterSpacing: -2.5, fontVariant: ['tabular-nums'] },
  thinTrack: { height: 2, borderRadius: radius.pill, overflow: 'hidden' },
  detail: { ...type.body, fontVariant: ['tabular-nums'] },
  suggestion: { ...type.body, ...type.strong, lineHeight: 24 },
  suggestionAction: { alignItems: 'flex-start', paddingTop: space.xs },
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
