import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { control, palettes, space, type } from '@/theme';

const palette = palettes.dawn;

const tabs: Record<string, { label: string; icon: SFSymbol }> = {
  index: { label: 'I dag', icon: 'sun.max' },
  log: { label: 'Dagene', icon: 'book.closed' },
  week: { label: 'Uken', icon: 'chart.line.uptrend.xyaxis' },
  goals: { label: 'Mål', icon: 'target' },
};

// Bottom menu: four calm tabs and, in the middle, the evening review as a small glowing orb.
// The orb is the one thing that pulls the eye, the same light the user talks to at night.
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const router = useRouter();
  const routes = state.routes.filter((r) => tabs[r.name]);
  const half = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number]) => {
    const meta = tabs[route.name];
    const focused = state.routes[state.index]?.key === route.key;
    const color = focused ? palette.text : palette.textMuted;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={meta.label}
        onPress={() => {
          if (!focused) Haptics.selectionAsync();
          navigateToTab(route.key);
        }}
        style={styles.tab}
      >
        <Icon name={meta.icon} color={focused ? palette.action : color} size={20} />
        <Text style={[styles.label, { color }, focused && styles.labelActive]}>{meta.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      {routes.slice(0, half).map(renderTab)}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start kveldsgjennomgangen"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/review');
        }}
        style={styles.tab}
      >
        {({ pressed }) => (
          <>
            <View style={[styles.orb, pressed && styles.orbPressed]}>
              <Icon name="moon.stars" color={palettes.dusk.background} size={20} />
            </View>
            <Text style={[styles.label, styles.orbLabel]}>Kveld</Text>
          </>
        )}
      </Pressable>

      {routes.slice(half).map(renderTab)}
    </View>
  );
}

const ORB = 54;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
    paddingTop: space.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, minHeight: control.iconButton + 8 },
  label: { ...type.caption, fontSize: 11, lineHeight: 14 },
  labelActive: { ...type.strong },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    marginTop: -ORB / 2,
    backgroundColor: palette.orb,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: palette.surface,
  },
  orbPressed: { transform: [{ scale: 0.94 }] },
  orbLabel: { ...type.strong, color: palette.text },
});
