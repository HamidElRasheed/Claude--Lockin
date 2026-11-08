import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { LargeTitle } from '@/components/LargeTitle';
import { Screen } from '@/components/Screen';
import { acceptPrivacy } from '@/lib/consent';
import { privacyDetails, privacyPoints } from '@/lib/privacy';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

// The full privacy page: the three short points, then who processes what, where and why.
export default function PrivacyScreen() {
  const router = useRouter();

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <Screen tone="dawn">
      <View style={styles.top}>
        <IconButton icon="xmark" label="Lukk" onPress={close} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LargeTitle eyebrow="Personvern" title="Dine data" />

        <View style={styles.box}>
          {privacyPoints.map((p, i) => (
            <View key={p.title} style={[styles.point, i > 0 && styles.divider]}>
              <View style={styles.pointIcon}>
                <Icon name={p.icon} color={palette.text} size={13} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>{p.title}</Text>
                <Text style={styles.pointBody}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {privacyDetails.map((d) => (
          <View key={d.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{d.title}</Text>
            <Text style={styles.sectionBody}>{d.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          tone="dawn"
          label="Greit"
          onPress={() => {
            acceptPrivacy();
            close();
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-start', marginBottom: space.md },
  content: { gap: space.lg, paddingBottom: space.lg },
  box: { backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: space.md },
  point: { flexDirection: 'row', gap: space.sm + 4, alignItems: 'flex-start', paddingVertical: space.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  pointIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: palette.tonal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pointText: { flex: 1, gap: 2 },
  pointTitle: { ...type.body, ...type.strong, color: palette.text },
  pointBody: { ...type.body, fontSize: 15, lineHeight: 21, color: palette.textMuted },
  section: { gap: space.xs, paddingHorizontal: space.xs },
  sectionTitle: { ...type.body, ...type.strong, color: palette.text },
  sectionBody: { ...type.body, fontSize: 15, lineHeight: 21, color: palette.textMuted },
  footer: { paddingTop: space.md },
});
