import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Voice } from '@/components/Voice';
import { ApiError, api } from '@/lib/api';
import type { GoalDraft } from '@/lib/types';
import { formatDays } from '@/lib/words';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

type Stage = 'write' | 'parsing' | 'confirm' | 'saving';

// Setup: say what you want in your own words, the AI suggests goal cards, you confirm.
export default function OnboardingScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [stage, setStage] = useState<Stage>('write');
  const [drafts, setDrafts] = useState<GoalDraft[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function parse() {
    setStage('parsing');
    setMessage(null);
    try {
      const result = await api.parseGoals(text);
      if (result.length === 0) throw new ApiError('no_goals_found', '', 422);
      setDrafts(result);
      setStage('confirm');
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.code === 'no_goals_found'
          ? 'Fant ingen mål i teksten. Prøv å si hva du vil gjøre, og hvor ofte.'
          : 'Noe gikk galt. Prøv igjen.',
      );
      setStage('write');
    }
  }

  async function save() {
    setStage('saving');
    setMessage(null);
    try {
      for (const draft of drafts) await api.createGoal(draft);
      router.replace('/');
    } catch {
      setMessage('Fikk ikke lagret alle målene. Prøv igjen.');
      setStage('confirm');
    }
  }

  return (
    <Screen tone="dawn">
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {(stage === 'write' || stage === 'parsing') && (
          <>
            <Voice tone="dawn">Hva vil du få til?</Voice>
            <Text style={styles.caption}>Skriv det som du ville sagt det. For eksempel: trene tre ganger i uka om morgenen, og lese litt hver kveld.</Text>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Jeg vil …"
              placeholderTextColor={palette.textMuted}
              multiline
              autoFocus
              editable={stage === 'write'}
            />
            {message && <Text style={styles.message}>{message}</Text>}
            <View style={styles.footer}>
              <Button
                tone="dawn"
                label={stage === 'parsing' ? 'Et øyeblikk …' : 'Lag målkort'}
                onPress={parse}
                disabled={stage === 'parsing' || text.trim().length < 3}
              />
            </View>
          </>
        )}

        {(stage === 'confirm' || stage === 'saving') && (
          <>
            <Voice tone="dawn">Ser dette riktig ut?</Voice>
            <ScrollView style={styles.fill} contentContainerStyle={styles.cards} showsVerticalScrollIndicator={false}>
              {drafts.map((draft, i) => (
                <View key={`${draft.title}-${i}`} style={styles.card}>
                  <View style={styles.cardText}>
                    <Text style={styles.title}>{draft.title}</Text>
                    <Text style={styles.caption}>
                      {formatDays(draft.days)}
                      {draft.time ? ` · kl. ${draft.time}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Fjern ${draft.title}`}
                    hitSlop={12}
                    onPress={() => setDrafts((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <Text style={styles.caption}>Fjern</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            {message && <Text style={styles.message}>{message}</Text>}
            <View style={styles.footer}>
              <Button
                tone="dawn"
                label={stage === 'saving' ? 'Lagrer …' : 'Lagre målene'}
                onPress={save}
                disabled={stage === 'saving' || drafts.length === 0}
              />
              <Button tone="dawn" variant="quiet" label="Skriv på nytt" onPress={() => setStage('write')} />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  caption: { ...type.caption, color: palette.textMuted, marginTop: space.sm },
  input: {
    ...type.body,
    color: palette.text,
    marginTop: space.xl,
    minHeight: 120,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    textAlignVertical: 'top',
  },
  message: { ...type.body, color: palette.text, marginTop: space.md },
  footer: { marginTop: 'auto', gap: space.sm, paddingTop: space.md },
  cards: { gap: space.sm, paddingTop: space.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    gap: space.md,
  },
  cardText: { flex: 1, gap: 2 },
  title: { ...type.body, color: palette.text, fontWeight: '600' },
});
