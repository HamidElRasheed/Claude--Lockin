import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Voice } from '@/components/Voice';
import { ApiError, api } from '@/lib/api';
import type { GoalDraft } from '@/lib/types';
import { formatDays } from '@/lib/words';
import { palettes, space, type } from '@/theme';

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

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function save() {
    setStage('saving');
    setMessage(null);
    try {
      for (const draft of drafts) await api.createGoal(draft);
      close();
    } catch {
      setMessage('Fikk ikke lagret alle målene. Prøv igjen.');
      setStage('confirm');
    }
  }

  return (
    <Screen tone="dawn">
      <View style={styles.top}>
        <IconButton icon="xmark" label="Lukk" onPress={close} />
      </View>
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
                label="Lag målkort"
                loading={stage === 'parsing'}
                onPress={parse}
                disabled={text.trim().length < 3}
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
                  <IconButton
                    icon="xmark"
                    label={`Fjern ${draft.title}`}
                    onPress={() => setDrafts((prev) => prev.filter((_, j) => j !== i))}
                  />
                </View>
              ))}
            </ScrollView>
            {message && <Text style={styles.message}>{message}</Text>}
            <View style={styles.footer}>
              <Button
                tone="dawn"
                label={drafts.length === 1 ? 'Lagre målet' : `Lagre ${drafts.length} mål`}
                loading={stage === 'saving'}
                onPress={save}
                disabled={drafts.length === 0}
              />
              <View style={styles.center}>
                <Button tone="dawn" variant="text" label="Skriv på nytt" onPress={() => setStage('write')} />
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center' },
  top: { alignItems: 'flex-end', marginTop: -space.xl, marginBottom: space.md },
  caption: { ...type.caption, color: palette.textMuted, marginTop: space.sm },
  input: {
    ...type.body,
    color: palette.text,
    marginTop: space.xl,
    minHeight: 120,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.text,
    textAlignVertical: 'top',
  },
  message: { ...type.body, color: palette.text, marginTop: space.md },
  footer: { marginTop: 'auto', gap: space.sm, paddingTop: space.md },
  cards: { paddingTop: space.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
    gap: space.md,
  },
  cardText: { flex: 1, gap: 2 },
  title: { ...type.body, ...type.strong, color: palette.text },
});
