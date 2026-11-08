import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Group, Row } from '@/components/Group';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { Screen } from '@/components/Screen';
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

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
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

  const writing = stage === 'write' || stage === 'parsing';

  return (
    <Screen tone="dawn">
      <View style={styles.top}>
        <IconButton icon="xmark" label="Lukk" onPress={close} />
      </View>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {writing ? (
          <>
            <LargeTitle eyebrow="Nye mål" title="Hva vil du få til?" />
            <Text style={styles.hint}>
              Skriv det som du ville sagt det. For eksempel: trene tre ganger i uka om morgenen, og lese litt hver kveld.
            </Text>
            <View style={styles.inputBox}>
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
            </View>
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
        ) : (
          <>
            <LargeTitle eyebrow="Nye mål" title="Ser dette riktig ut?" />
            <ScrollView style={styles.fill} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {drafts.length > 0 ? (
                <Group>
                  {drafts.map((draft, i) => (
                    <Row
                      key={`${draft.title}-${i}`}
                      title={draft.title}
                      detail={`${formatDays(draft.days)}${draft.time ? ` · kl. ${draft.time}` : ''}`}
                      trailing={
                        <IconButton
                          icon="xmark"
                          label={`Fjern ${draft.title}`}
                          onPress={() => setDrafts((prev) => prev.filter((_, j) => j !== i))}
                        />
                      }
                      last={i === drafts.length - 1}
                    />
                  ))}
                </Group>
              ) : (
                <Text style={styles.message}>Ingen mål igjen. Skriv på nytt for å prøve en gang til.</Text>
              )}
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
  top: { alignItems: 'flex-end', marginBottom: space.md },
  hint: { ...type.body, fontSize: 15, lineHeight: 21, color: palette.textMuted, marginTop: space.sm },
  inputBox: { marginTop: space.lg, backgroundColor: palette.surface, borderRadius: radius.md },
  input: {
    ...type.body,
    color: palette.text,
    minHeight: 140,
    padding: space.md,
    paddingTop: space.md,
    textAlignVertical: 'top',
  },
  message: { ...type.body, color: palette.textMuted, marginTop: space.md },
  footer: { marginTop: 'auto', gap: space.sm, paddingTop: space.md },
  list: { paddingTop: 22, paddingBottom: space.md },
});
