import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { privacyPoints } from '@/lib/privacy';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

type Props = {
  onAccept: () => void;
  onMore: () => void;
};

// First-launch sheet: what happens to your data, in three short points, before you start.
// Sits over the screen on a dimmed backdrop; one clear "OK", and a way to read everything.
export function PrivacyCard({ onAccept, onMore }: Props) {
  return (
    <View style={styles.backdrop} accessibilityViewIsModal>
      <View style={styles.sheet}>
        <View style={styles.badge}>
          <Icon name="lock" color={palette.actionText} size={18} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Dine data er dine
        </Text>
        <Text style={styles.lead}>Før du starter: slik bruker Lockin det du sier.</Text>

        <View style={styles.points}>
          {privacyPoints.map((p) => (
            <View key={p.title} style={styles.point}>
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

        <View style={styles.actions}>
          <Button tone="dawn" label="Greit, start" onPress={onAccept} />
          <View style={styles.center}>
            <Button tone="dawn" variant="text" label="Les mer om personvern" onPress={onMore} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: palette.scrim,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    paddingHorizontal: space.lg - 4,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  title: { ...type.title, fontSize: 28, lineHeight: 34, color: palette.text },
  lead: { ...type.body, color: palette.textMuted },
  points: { backgroundColor: palette.surface, borderRadius: radius.md, padding: space.md, gap: space.md, marginTop: space.sm },
  point: { flexDirection: 'row', gap: space.sm + 4, alignItems: 'flex-start' },
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
  pointBody: { ...type.caption, fontWeight: '400', lineHeight: 18, color: palette.textMuted },
  actions: { gap: space.xs, marginTop: space.sm },
  center: { alignItems: 'center' },
});
