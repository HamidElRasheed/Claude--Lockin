import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Orb, type OrbMode } from '@/components/Orb';
import { Screen } from '@/components/Screen';
import { StatusMark } from '@/components/StatusMark';
import { Voice } from '@/components/Voice';
import { api, isMock } from '@/lib/api';
import type { Goal, GoalEntry, GoalStatus } from '@/lib/types';
import { MicPermissionError, useVoiceRecorder } from '@/lib/useVoiceRecorder';
import { localDate } from '@/lib/words';
import { palettes, space, type } from '@/theme';

const palette = palettes.dusk;
const MIN_HOLD_MS = 350;

type Stage = 'loading' | 'ask' | 'listening' | 'thinking' | 'answered' | 'manual' | 'error' | 'saving';

const statusLabel: Record<GoalStatus, string> = { done: 'Gjort', partial: 'Delvis', missed: 'Ikke i dag' };
const reply: Record<GoalStatus, string> = { done: 'Notert.', partial: 'Notert, delvis.', missed: 'Forstått.' };

// Evening review: one goal at a time. Hold anywhere to talk; the app answers in text.
export default function ReviewScreen() {
  const router = useRouter();
  const recorder = useVoiceRecorder();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('loading');
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [answer, setAnswer] = useState<GoalEntry | null>(null);
  const [reflection, setReflection] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const pressedAt = useRef(0);

  useEffect(() => {
    api
      .getToday()
      .then((today) => {
        setGoals(today.goals);
        setStage('ask');
      })
      .catch(() => {
        setMessage('Fikk ikke hentet dagens mål.');
        setStage('error');
      });
  }, []);

  const isReflection = goals.length > 0 && index >= goals.length;
  const goal = goals[index];
  const canHold = stage === 'ask' || stage === 'error' || (isReflection && stage === 'answered');

  async function onPressIn() {
    if (!canHold) return;
    pressedAt.current = Date.now();
    setMessage(null);
    setStage('listening');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recorder.start().catch(() => undefined);
  }

  async function onPressOut() {
    if (stage !== 'listening') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const heldMs = Date.now() - pressedAt.current;
    const uri = await recorder.stop().catch(() => null);

    if (heldMs < MIN_HOLD_MS) {
      setMessage('Hold inne mens du snakker.');
      setStage('ask');
      return;
    }
    if (!uri && !isMock) {
      setMessage('Gi Lockin tilgang til mikrofonen i Innstillinger.');
      setStage('error');
      return;
    }

    setStage('thinking');
    try {
      const { text } = await api.transcribe(uri ?? '');
      if (isReflection) {
        setReflection(text);
        setStage('answered');
        return;
      }
      const result = await api.interpret(goal.id, text);
      setAnswer({ goalId: goal.id, goalTitle: goal.title, status: result.status, reason: result.reason, transcript: text });
      Haptics.selectionAsync();
      setStage('answered');
    } catch (error) {
      setMessage(error instanceof MicPermissionError ? 'Gi Lockin tilgang til mikrofonen i Innstillinger.' : 'Fikk ikke med meg det.');
      setStage('error');
    }
  }

  function commit(entry: GoalEntry) {
    setEntries((prev) => [...prev.filter((e) => e.goalId !== entry.goalId), entry]);
    setAnswer(null);
    setMessage(null);
    setIndex((i) => i + 1);
    setStage('ask');
  }

  function answerManually(status: GoalStatus) {
    Haptics.selectionAsync();
    commit({ goalId: goal.id, goalTitle: goal.title, status, reason: null, transcript: null });
  }

  async function finish(withReflection: string | null) {
    setStage('saving');
    const date = localDate(new Date());
    try {
      await api.completeReview(date, entries, withReflection);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/done', params: { date } });
    } catch {
      setMessage('Fikk ikke lagret kvelden. Prøv igjen.');
      setStage('answered');
    }
  }

  const orbMode: OrbMode =
    stage === 'listening' ? 'listening' : stage === 'thinking' || stage === 'saving' ? 'thinking' : stage === 'answered' ? 'rest' : 'idle';

  return (
    <Screen tone="dusk">
      <Pressable style={styles.fill} onPressIn={onPressIn} onPressOut={onPressOut} accessibilityLabel="Hold for å snakke" accessibilityRole="button">
        <View style={styles.top}>
          <Progress total={goals.length + 1} current={index} />
          <Pressable onPress={() => router.back()} hitSlop={16} accessibilityRole="button">
            <Text style={styles.caption}>Lukk</Text>
          </Pressable>
        </View>

        {stage === 'loading' ? null : isReflection ? (
          <View style={styles.question}>
            <Text style={styles.caption}>Til slutt</Text>
            <Voice tone="dusk">Noe mer om dagen?</Voice>
          </View>
        ) : goal ? (
          <View style={styles.question}>
            <Text style={styles.caption}>{goal.time ? `Kl. ${goal.time}` : 'I dag'}</Text>
            <Voice tone="dusk">{goal.title}?</Voice>
          </View>
        ) : (
          <View style={styles.question}>
            <Voice tone="dusk">{message ?? 'Ingen mål i dag.'}</Voice>
          </View>
        )}

        <View style={styles.center}>
          <Orb tone="dusk" mode={orbMode} />
        </View>

        <View style={styles.bottom}>
          {stage === 'ask' && (
            <>
              <Text style={styles.hint}>{message ?? 'Hold hvor som helst for å snakke'}</Text>
              {isReflection ? (
                <Button tone="dusk" variant="quiet" label="Hopp over" onPress={() => finish(null)} />
              ) : (
                <Button tone="dusk" variant="quiet" label="Svar med knapper" onPress={() => setStage('manual')} />
              )}
            </>
          )}

          {stage === 'listening' && <Text style={styles.hint}>Jeg lytter. Slipp når du er ferdig.</Text>}
          {(stage === 'thinking' || stage === 'saving') && <Text style={styles.hint}>Et øyeblikk.</Text>}

          {stage === 'error' && goal && (
            <>
              <Text style={styles.hint}>{message} Hold inne for å prøve igjen, eller svar her.</Text>
              <ManualButtons onPick={answerManually} />
            </>
          )}

          {stage === 'manual' && goal && <ManualButtons onPick={answerManually} />}

          {stage === 'answered' && answer && (
            <>
              {answer.transcript && <Text style={styles.transcript}>«{answer.transcript}»</Text>}
              <Voice tone="dusk">{reply[answer.status]}</Voice>
              <View style={styles.status}>
                <StatusMark status={answer.status} />
                <Text style={styles.caption}>
                  {statusLabel[answer.status]}
                  {answer.reason ? ` · ${answer.reason.toLowerCase()}` : ''}
                </Text>
              </View>
              <View style={styles.actions}>
                <Button tone="dusk" label="Videre" onPress={() => commit(answer)} />
                <Button tone="dusk" variant="quiet" label="Endre" onPress={() => setStage('manual')} />
              </View>
            </>
          )}

          {stage === 'answered' && isReflection && (
            <>
              {reflection && <Text style={styles.transcript}>«{reflection}»</Text>}
              {message && <Text style={styles.hint}>{message}</Text>}
              <Button tone="dusk" label="Ferdig for i dag" onPress={() => finish(reflection)} />
            </>
          )}
        </View>
      </Pressable>
    </Screen>
  );
}

function Progress({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.progress} accessibilityLabel={`Steg ${current + 1} av ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.step, i <= current && styles.stepOn]} />
      ))}
    </View>
  );
}

function ManualButtons({ onPick }: { onPick: (status: GoalStatus) => void }) {
  return (
    <View style={styles.manual}>
      {(['done', 'partial', 'missed'] as const).map((status) => (
        <View key={status} style={styles.manualItem}>
          <Button tone="dusk" variant="outline" label={statusLabel[status]} onPress={() => onPick(status)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { flexDirection: 'row', gap: space.sm },
  step: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.line },
  stepOn: { backgroundColor: palette.orb },
  question: { marginTop: space.xxl, gap: space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { minHeight: 180, justifyContent: 'flex-end', gap: space.md },
  caption: { ...type.caption, color: palette.textMuted },
  hint: { ...type.caption, color: palette.textMuted, textAlign: 'center' },
  transcript: { ...type.body, color: palette.text },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  manual: { flexDirection: 'row', gap: space.sm },
  manualItem: { flex: 1 },
});
