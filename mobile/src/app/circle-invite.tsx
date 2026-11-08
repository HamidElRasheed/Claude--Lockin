import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { Screen } from '@/components/Screen';
import { myCircle } from '@/lib/circles';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

// DEMO: invite friends to your circle, or start a new one. Shows the flow; nothing is sent.
export default function CircleInviteScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<string | null>(null);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  const code = created ? 'LOCK-7310' : myCircle.inviteCode;

  return (
    <Screen tone="dawn">
      <View style={styles.top}>
        <IconButton icon="xmark" label="Lukk" onPress={close} />
      </View>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <LargeTitle eyebrow="Sirkelen" title={created ? created : `Inviter til ${myCircle.name}`} />

          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Invitasjonskode</Text>
            <Text style={styles.code} accessibilityLabel={`Kode ${code.split('').join(' ')}`}>
              {code}
            </Text>
            <Text style={styles.heroLine}>Vennene dine skriver koden i Lockin, eller trykker på lenken du sender.</Text>
          </View>

          <Button
            tone="dawn"
            label={copied ? 'Lenke kopiert' : 'Del invitasjonslenke'}
            icon={copied ? 'checkmark' : undefined}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCopied(true);
            }}
          />

          {!created && (
            <View style={styles.section}>
              <Text style={styles.label}>Eller lag en ny sirkel</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Navn på sirkelen, for eksempel Kontoret"
                  placeholderTextColor={palette.textMuted}
                  maxLength={30}
                  accessibilityLabel="Navn på ny sirkel"
                />
              </View>
              <Button
                tone="dawn"
                variant="tonal"
                label="Lag sirkel"
                disabled={name.trim().length < 2}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setCreated(name.trim());
                  setCopied(false);
                }}
                fill
              />
            </View>
          )}

          <Text style={styles.footnote}>
            I en sirkel deler dere bare antall kvelder og dagspoeng. Grunner og det du sa, forblir dine.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { alignItems: 'flex-start', marginBottom: space.md },
  content: { gap: space.lg, paddingBottom: space.lg },
  hero: { backgroundColor: palette.hero, borderRadius: radius.lg, padding: space.lg - 4, gap: space.sm },
  heroLabel: { ...type.caption, fontSize: 15, ...type.strong, color: palette.heroMuted },
  code: { fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: 1, color: palette.heroText, fontVariant: ['tabular-nums'] },
  heroLine: { ...type.body, fontSize: 15, color: palette.heroMuted },
  section: { gap: space.sm + 4 },
  label: { ...type.caption, ...type.strong, color: palette.textMuted },
  inputBox: { backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: space.md },
  input: { ...type.body, ...type.strong, color: palette.text, paddingVertical: space.md },
  footnote: { ...type.caption, fontWeight: '400', color: palette.textMuted, textAlign: 'center', paddingHorizontal: space.md },
});
