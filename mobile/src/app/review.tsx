import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Orb, type OrbMode } from '@/components/Orb';
import { ReviewGoalRow } from '@/components/ReviewGoalRow';
import { Screen } from '@/components/Screen';
import { StatusChoices } from '@/components/StatusChoices';
import { Voice } from '@/components/Voice';
import { api, isMock } from '@/lib/api';
import { deleteRecording } from '@/lib/deleteRecording';
import type { Goal, GoalEntry, GoalStatus } from '@/lib/types';
import { MicPermissionError, useVoiceRecorder } from '@/lib/useVoiceRecorder';
import { localDate } from '@/lib/words';
import { orb, palettes, radius, space, type } from '@/theme';

const palette = palettes.dusk;
// Time between two goals ticking off, and how long one tick takes to settle.
const STAGGER_MS = 420;
const SETTLE_MS = 900;
// A second tap this soon after the first is a double tap, not "I'm done".
const MIN_RECORDING_MS = 700;

type Stage =
  | 'loading'
  | 'loadError'
  | 'empty'
  | 'ready' // all goals listed, waiting for the one recording
  | 'listening'
  | 'thinking'
  | 'failed' // speech or AI failed: try again or answer with buttons
  | 'revealing' // goals tick off one by one
  | 'ask' // one goal at a time: not mentioned, or answering with buttons
  | 'askListening'
  | 'askThinking'
  | 'confirm'
  | 'saving';

type Result = { status: GoalStatus | null; reason: string | null; transcript: string | null };

const nextStatus: Record<GoalStatus, GoalStatus> = { done: 'partial', partial: 'missed', missed: 'done' };

// Evening review: all of today's goals at once. Talk about the day in one go,
// the app ticks off what it heard and only asks about what was left out.
export default function ReviewScreen() {
  const router = useRouter();
  const recorder = useVoiceRecorder();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [stage, setStage] = useState<Stage>('loading');
  const [queue, setQueue] = useState<string[]>([]);
  const [askingMissing, setAskingMissing] = useState(true);
  const [stagger, setStagger] = useState(false);
  const [dayText, setDayText] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const startedAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    load();
    // Ready the microphone now so the first word is not cut off.
    recorder.prepare().catch(onMicError);
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
    // Runs once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function load() {
    setStage('loading');
    api
      .getToday()
      .then((today) => {
        setGoals(today.goals);
        setResults(Object.fromEntries(today.goals.map((g) => [g.id, { status: null, reason: null, transcript: null }])));
        setStage(today.goals.length ? 'ready' : 'empty');
      })
      .catch(() => setStage('loadError'));
  }

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  function onMicError(error: unknown) {
    if (error instanceof MicPermissionError && !isMock) setMicDenied(true);
  }

  function prepareAgain() {
    recorder.prepare().catch(onMicError);
  }

  const current = goals.find((g) => g.id === queue[0]);

  // --- Recording -----------------------------------------------------------

  function startListening(next: 'listening' | 'askListening') {
    startedAt.current = Date.now();
    setMessage(null);
    setStage(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recorder.start().catch((error: unknown) => {
      if (!(error instanceof MicPermissionError) || isMock) return;
      setMicDenied(true);
      setStage(next === 'listening' ? 'ready' : 'ask');
    });
  }

  async function stopListening(): Promise<string | null> {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return recorder.stop().catch(() => null);
  }

  // Speech -> text. The recording is deleted right after, also when it fails.
  async function transcribe(uri: string | null): Promise<string> {
    if (!uri && !isMock) throw new Error('no_recording');
    const { text } = await api.transcribe(uri ?? '').finally(() => deleteRecording(uri));
    if (!text.trim()) throw new Error('empty_text');
    return text;
  }

  async function finishDay() {
    if (Date.now() - startedAt.current < MIN_RECORDING_MS) return;
    const uri = await stopListening();
    setStage('thinking');
    try {
      const text = await transcribe(uri);
      const day = await api.interpretDay(text);
      const byId = new Map(day.goals.map((g) => [g.goalId, g]));
      const next: Record<string, Result> = {};
      for (const goal of goals) {
        const heard = byId.get(goal.id);
        next[goal.id] = { status: heard?.status ?? null, reason: heard?.reason ?? null, transcript: null };
      }
      const heardCount = goals.filter((g) => next[g.id].status).length;
      setDayText(text);
      setStagger(true);
      setResults(next);
      setStage('revealing');
      later(() => {
        setStagger(false);
        beginAsking(goals.filter((g) => !next[g.id].status).map((g) => g.id), true);
      }, heardCount * STAGGER_MS + SETTLE_MS);
    } catch {
      setMessage('Fikk ikke med meg det.');
      setStage('failed');
      prepareAgain();
    }
  }

  async function finishAnswer() {
    if (!current || Date.now() - startedAt.current < MIN_RECORDING_MS) return;
    const uri = await stopListening();
    setStage('askThinking');
    try {
      const text = await transcribe(uri);
      const answer = await api.interpret(current.id, text);
      answerCurrent(answer.status, answer.reason, text);
    } catch {
      setMessage('Fikk ikke med meg det. Svar gjerne med knappene.');
      setStage('ask');
      prepareAgain();
    }
  }

  // --- Asking about what was left out ------------------------------------------

  function beginAsking(ids: string[], missing: boolean) {
    setAskingMissing(missing);
    setQueue(ids);
    setMessage(null);
    if (ids.length) {
      setStage('ask');
      prepareAgain();
    } else {
      setStage('confirm');
    }
  }

  function answerManually() {
    beginAsking(goals.filter((g) => !results[g.id]?.status).map((g) => g.id), false);
  }

  function answerCurrent(status: GoalStatus, reason: string | null, transcript: string | null) {
    if (!current) return;
    setResults((prev) => ({ ...prev, [current.id]: { status, reason, transcript } }));
    const rest = queue.slice(1);
    setQueue(rest);
    setMessage(null);
    if (rest.length) {
      setStage('ask');
      prepareAgain();
    } else {
      // Let the last mark settle before the save button appears.
      setStage('revealing');
      later(() => setStage('confirm'), SETTLE_MS);
    }
  }

  // --- Confirm and save ----------------------------------------------------

  function cycle(goalId: string) {
    setResults((prev) => {
      const now = prev[goalId]?.status;
      if (!now) return prev;
      return { ...prev, [goalId]: { status: nextStatus[now], reason: null, transcript: prev[goalId].transcript } };
    });
  }

  async function save() {
    setStage('saving');
    setMessage(null);
    const date = localDate(new Date());
    const entries: GoalEntry[] = goals.map((g) => ({
      goalId: g.id,
      goalTitle: g.title,
      status: results[g.id]?.status ?? 'missed',
      reason: results[g.id]?.reason ?? null,
      transcript: results[g.id]?.transcript ?? null,
    }));
    try {
      await api.completeReview(date, entries, dayText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/done', params: { date } });
    } catch {
      setMessage('Fikk ikke lagret kvelden. Prøv igjen.');
      setStage('confirm');
    }
  }

  async function close() {
    if (stage === 'listening' || stage === 'askListening') deleteRecording(await stopListening());
    router.back();
  }

  // --- Taps anywhere -------------------------------------------------------

  const canTalk = !micDenied || isMock;
  const screenTap =
    canTalk && (stage === 'ready' || stage === 'listening' || stage === 'failed' || stage === 'askListening');

  function onScreenTap() {
    if (stage === 'ready' || stage === 'failed') startListening('listening');
    else if (stage === 'listening') finishDay();
    else if (stage === 'askListening') finishAnswer();
  }

  function onOrbTap() {
    if (stage === 'ask') startListening('askListening');
    else onScreenTap();
  }

  // --- View ----------------------------------------------------------------

  const orbMode: OrbMode =
    stage === 'listening' || stage === 'askListening'
      ? 'listening'
      : stage === 'thinking' || stage === 'askThinking' || stage === 'saving'
        ? 'thinking'
        : stage === 'confirm' || stage === 'revealing'
          ? 'rest'
          : 'idle';

  const showList = goals.length > 0 && stage !== 'loading' && stage !== 'loadError' && stage !== 'empty';
  const asking = stage === 'ask' || stage === 'askListening' || stage === 'askThinking';

  return (
    <Screen tone="dusk">
      <Pressable
        style={styles.fill}
        disabled={!screenTap}
        onPress={onScreenTap}
        accessibilityHint={screenTap ? 'Trykk for å starte og stoppe opptaket' : undefined}
      >
        <View style={styles.top}>
          <Text style={styles.caption}>I kveld</Text>
          <IconButton tone="dusk" icon="xmark" label="Lukk kveldsgjennomgangen" onPress={close} />
        </View>

        <View style={styles.question}>
          <Headline
            stage={stage}
            micDenied={micDenied && !isMock}
            asking={asking}
            missing={askingMissing}
            title={current?.title}
          />
        </View>

        {showList && (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {goals.map((goal, i) => {
              const result = results[goal.id];
              const heardBefore = goals.slice(0, i).filter((g) => results[g.id]?.status).length;
              return (
                <ReviewGoalRow
                  key={goal.id}
                  title={goal.title}
                  time={goal.time}
                  status={result?.status ?? null}
                  reason={result?.reason ?? null}
                  delay={stagger ? heardBefore * STAGGER_MS : 0}
                  dimmed={asking && goal.id !== current?.id}
                  onPress={stage === 'confirm' ? () => cycle(goal.id) : undefined}
                />
              );
            })}
          </ScrollView>
        )}

        <View style={styles.center}>
          <Pressable
            disabled={!canTalk || !(screenTap || stage === 'ask')}
            onPress={onOrbTap}
            accessibilityRole="button"
            accessibilityLabel={stage === 'listening' || stage === 'askListening' ? 'Stopp opptaket' : 'Start opptaket'}
          >
            <Orb tone="dusk" mode={orbMode} />
          </Pressable>
        </View>

        <View style={styles.bottom}>
          {stage === 'ready' && canTalk && (
            <>
              <View style={styles.chip} pointerEvents="none">
                <Icon name="hand.tap" color={palette.orb} size={16} />
                <Text style={styles.chipText}>Trykk på lyset og snakk</Text>
              </View>
              <View style={styles.centered}>
                <Button tone="dusk" variant="text" label="Svar med knapper i stedet" onPress={answerManually} />
              </View>
            </>
          )}

          {stage === 'ready' && !canTalk && (
            <>
              <Text style={styles.hint}>Slå på mikrofonen for Lockin i Innstillinger, eller svar med knapper.</Text>
              <Button tone="dusk" label="Svar med knapper" onPress={answerManually} />
            </>
          )}

          {(stage === 'listening' || stage === 'askListening') && (
            <View style={styles.centered}>
              <Elapsed since={startedAt.current} />
              <Text style={styles.hint}>Trykk når du er ferdig.</Text>
            </View>
          )}

          {(stage === 'thinking' || stage === 'askThinking') && <Text style={styles.hint}>Et øyeblikk …</Text>}

          {stage === 'failed' && (
            <>
              {canTalk && <Button tone="dusk" label="Prøv igjen" onPress={() => startListening('listening')} />}
              <View style={styles.centered}>
                <Button tone="dusk" variant="text" label="Svar med knapper" onPress={answerManually} />
              </View>
            </>
          )}

          {stage === 'ask' && (
            <>
              {message && <Text style={styles.hint}>{message}</Text>}
              <StatusChoices onPick={(status) => answerCurrent(status, null, null)} />
              {canTalk && <Text style={styles.hint}>Eller trykk på lyset og svar kort.</Text>}
            </>
          )}

          {(stage === 'confirm' || stage === 'saving') && (
            <>
              <Text style={styles.hint}>{message ?? 'Trykk på et mål for å endre.'}</Text>
              <Button tone="dusk" label="Lagre kvelden" icon="moon.stars" loading={stage === 'saving'} onPress={save} />
            </>
          )}

          {stage === 'empty' && <Button tone="dusk" label="Lukk" onPress={() => router.back()} />}
          {stage === 'loadError' && <Button tone="dusk" label="Prøv igjen" onPress={load} />}
        </View>
      </Pressable>
    </Screen>
  );
}

// What the app says at the top. Short, calm, never an exclamation mark.
function Headline({
  stage,
  micDenied,
  asking,
  missing,
  title,
}: {
  stage: Stage;
  micDenied: boolean;
  asking: boolean;
  missing: boolean;
  title?: string;
}) {
  if (asking && title) {
    return missing ? (
      <Voice tone="dusk">
        Du nevnte ikke <Text style={styles.italic}>{title}</Text>. Hvordan gikk det?
      </Voice>
    ) : (
      <Voice tone="dusk">
        Hvordan gikk <Text style={styles.italic}>{title}</Text>?
      </Voice>
    );
  }
  const line: Partial<Record<Stage, string>> = {
    loading: ' ',
    loadError: 'Fikk ikke hentet dagens mål.',
    empty: 'Ingen mål i dag. Sov godt.',
    ready: micDenied ? 'Mikrofonen er av.' : 'Fortell om dagen din.',
    listening: 'Fortell om dagen din.',
    thinking: 'Et øyeblikk …',
    failed: 'Fikk ikke med meg det.',
    revealing: 'Notert.',
    confirm: 'Slik ble dagen.',
    saving: 'Slik ble dagen.',
  };
  return <Voice tone="dusk">{line[stage] ?? ' '}</Voice>;
}

// A quiet clock while the user talks.
function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <View style={styles.chip} accessibilityLabel={`Lytter, ${seconds} sekunder`}>
      <View style={styles.dot} />
      <Text style={styles.chipText}>Lytter … {clock}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caption: { ...type.caption, color: palette.textMuted },
  question: { marginTop: space.lg },
  italic: { fontStyle: 'italic' },
  list: { flexGrow: 0, marginTop: space.lg },
  listContent: { gap: space.xs },
  center: { flex: 1, minHeight: orb.size, alignItems: 'center', justifyContent: 'center' },
  bottom: { minHeight: space.xxxl * 2, justifyContent: 'flex-end', gap: space.md },
  centered: { alignItems: 'center', gap: space.sm },
  hint: { ...type.caption, color: palette.textMuted, textAlign: 'center' },
  chip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: palette.tonal,
  },
  chipText: { ...type.body, color: palette.text, fontWeight: '500', fontVariant: ['tabular-nums'] },
  dot: { width: space.sm, height: space.sm, borderRadius: radius.pill, backgroundColor: palette.orb },
});
