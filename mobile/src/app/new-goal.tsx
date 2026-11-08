import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import type { Weekday } from '@/lib/types';
import { formatDays } from '@/lib/words';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

const week: { day: Weekday; letter: string; name: string }[] = [
  { day: 'mon', letter: 'M', name: 'mandag' },
  { day: 'tue', letter: 'T', name: 'tirsdag' },
  { day: 'wed', letter: 'O', name: 'onsdag' },
  { day: 'thu', letter: 'T', name: 'torsdag' },
  { day: 'fri', letter: 'F', name: 'fredag' },
  { day: 'sat', letter: 'L', name: 'lørdag' },
  { day: 'sun', letter: 'S', name: 'søndag' },
];
const everyDay: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const weekdays: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const weekend: Weekday[] = ['sat', 'sun'];

// Tapping an idea fills in a sensible default, so most goals take two taps.
const ideas: { title: string; time: string | null; days: Weekday[] }[] = [
  { title: 'Trene', time: '07:00', days: ['mon', 'wed', 'fri'] },
  { title: 'Lese 20 min', time: '21:30', days: everyDay },
  { title: 'Gå en tur', time: '12:00', days: everyDay },
  { title: 'Meditere 10 min', time: '07:00', days: everyDay },
  { title: 'Drikke vann', time: null, days: everyDay },
  { title: 'Ingen mobil etter 23', time: '23:00', days: everyDay },
];

const times: (string | null)[] = [null, '07:00', '12:00', '18:00', '21:00'];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

type Stage = 'edit' | 'saving' | 'saved';

const same = (a: Weekday[], b: Weekday[]) => a.length === b.length && a.every((d) => b.includes(d));

// Add one goal in seconds: a name, which days, what time. No AI in the way.
export default function NewGoalScreen() {
  const router = useRouter();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<Weekday[]>(everyDay);
  const [time, setTime] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('edit');
  const [message, setMessage] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState('');

  const name = title.trim();
  const custom = customTime !== null;
  const chosenTime = custom ? customTime : time;
  const timeOk = chosenTime === null || HHMM.test(chosenTime);
  const ready = name.length > 0 && days.length > 0 && timeOk;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  function pickIdea(idea: (typeof ideas)[number]) {
    setTitle(idea.title);
    setDays(idea.days);
    setTime(idea.time);
    setCustomTime(null);
  }

  function toggleDay(day: Weekday) {
    setDays((now) => (now.includes(day) ? now.filter((d) => d !== day) : everyDay.filter((d) => d === day || now.includes(d))));
  }

  async function save() {
    if (!ready) return;
    setStage('saving');
    setMessage(null);
    try {
      await api.createGoal({ title: name, days, time: chosenTime, weeklyTarget: null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedTitle(name);
      setStage('saved');
    } catch {
      setMessage('Fikk ikke lagret målet. Prøv igjen.');
      setStage('edit');
    }
  }

  function another() {
    setTitle('');
    setDays(everyDay);
    setTime(null);
    setCustomTime(null);
    setStage('edit');
    setTimeout(() => input.current?.focus(), 50);
  }

  const summary = [name || 'Nytt mål', formatDays(days), chosenTime ? `kl. ${chosenTime}` : 'hele dagen'].join(' · ');

  if (stage === 'saved') {
    return (
      <Screen tone="dawn">
        <View style={styles.top}>
          <IconButton icon="xmark" label="Lukk" onPress={close} />
        </View>
        <View style={styles.savedBody}>
          <View style={styles.check}>
            <Icon name="checkmark" color={palette.actionText} size={24} />
          </View>
          <LargeTitle eyebrow="Lagt til" title={savedTitle} />
          <Text style={styles.savedLine}>Det står på planen din fra i dag. Vi tar det opp i kveld.</Text>
        </View>
        <View style={styles.footer}>
          <Button tone="dawn" label="Ferdig" onPress={close} />
          <Button tone="dawn" variant="tonal" label="Legg til et mål til" icon="plus" onPress={another} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen tone="dawn">
      <View style={styles.top}>
        <IconButton icon="xmark" label="Lukk" onPress={close} />
      </View>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LargeTitle eyebrow="Nytt mål" title="Hva vil du gjøre?" />

          <View style={styles.inputBox}>
            <TextInput
              ref={input}
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="For eksempel: Trene 30 min"
              placeholderTextColor={palette.textMuted}
              maxLength={60}
              autoFocus
              returnKeyType="done"
              accessibilityLabel="Navn på målet"
            />
          </View>

          <View style={styles.wrap}>
            {ideas.map((idea) => (
              <Chip key={idea.title} label={idea.title} selected={name === idea.title} onPress={() => pickIdea(idea)} />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Hvilke dager</Text>
            <View style={styles.days}>
              {week.map((w) => (
                <Chip
                  key={w.day}
                  round
                  label={w.letter}
                  accessibilityLabel={w.name}
                  selected={days.includes(w.day)}
                  onPress={() => toggleDay(w.day)}
                />
              ))}
            </View>
            <View style={styles.wrap}>
              <Chip label="Hver dag" selected={same(days, everyDay)} onPress={() => setDays(everyDay)} />
              <Chip label="Hverdager" selected={same(days, weekdays)} onPress={() => setDays(weekdays)} />
              <Chip label="Helg" selected={same(days, weekend)} onPress={() => setDays(weekend)} />
            </View>
            {days.length === 0 && <Text style={styles.hint}>Velg minst én dag.</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Når</Text>
            <View style={styles.wrap}>
              {times.map((t) => (
                <Chip
                  key={t ?? 'all'}
                  label={t ?? 'Hele dagen'}
                  selected={!custom && time === t}
                  onPress={() => {
                    setTime(t);
                    setCustomTime(null);
                  }}
                />
              ))}
              <Chip label="Annet" selected={custom} onPress={() => setCustomTime(customTime ?? '')} />
            </View>
            {custom && (
              <View style={styles.timeBox}>
                <TextInput
                  style={styles.timeInput}
                  value={customTime ?? ''}
                  onChangeText={(v) => setCustomTime(v.replace(/[^0-9:]/g, '').slice(0, 5))}
                  placeholder="06:30"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="numbers-and-punctuation"
                  autoFocus
                  accessibilityLabel="Klokkeslett, timer og minutter"
                />
                {!timeOk && (customTime ?? '').length >= 4 && <Text style={styles.hint}>Skriv tiden som 06:30.</Text>}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.summary} numberOfLines={1}>
            {summary}
          </Text>
          {message && <Text style={styles.hint}>{message}</Text>}
          <Button tone="dawn" label="Legg til mål" loading={stage === 'saving'} disabled={!ready} onPress={save} />
          <View style={styles.center}>
            <Button
              tone="dawn"
              variant="text"
              label="Eller beskriv flere mål med egne ord"
              onPress={() => router.replace('/onboarding')}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { alignItems: 'flex-start', marginBottom: space.md },
  content: { gap: space.lg, paddingBottom: space.lg },
  inputBox: { backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: space.md },
  input: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.4, color: palette.text, paddingVertical: space.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  section: { gap: space.sm + 4 },
  label: { ...type.caption, ...type.strong, color: palette.textMuted },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  timeBox: { gap: space.xs },
  timeInput: {
    ...type.body,
    ...type.strong,
    width: 120,
    height: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  hint: { ...type.caption, color: palette.textMuted },
  footer: { gap: space.sm, paddingTop: space.md },
  summary: { ...type.caption, ...type.strong, color: palette.textMuted, textAlign: 'center' },
  center: { alignItems: 'center' },
  savedBody: { flex: 1, justifyContent: 'center', gap: space.md },
  check: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLine: { ...type.body, color: palette.textMuted },
});
