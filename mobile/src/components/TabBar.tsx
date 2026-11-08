import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { control, palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

// Floating capsule: 20 from the sides, 28 from the bottom, 68 tall.
const BAR_HEIGHT = 68;
const BAR_BOTTOM = 28;
const MIC = 52;

// Room tab screens leave at the bottom so nothing hides behind the capsule.
export const TAB_BAR_SPACE = BAR_HEIGHT + BAR_BOTTOM + space.md;

type Tab = { label: string; icon: SFSymbol; activeIcon: SFSymbol };

// "Mål" is reached from the I dag screen, so it is not in the bar.
const tabs: Record<string, Tab> = {
  index: { label: 'I dag', icon: 'house', activeIcon: 'house.fill' },
  log: { label: 'Dagene', icon: 'book.closed', activeIcon: 'book.closed.fill' },
  week: { label: 'Uken', icon: 'chart.bar', activeIcon: 'chart.bar.fill' },
  progress: { label: 'Fremgang', icon: 'chart.pie', activeIcon: 'chart.pie.fill' },
};
const leftTabs = ['index', 'log'];

// Bottom menu: two tabs, the black microphone for the evening review, two tabs.
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const router = useRouter();
  const routes = state.routes.filter((r) => tabs[r.name]);
  const activeKey = state.routes[state.index]?.key;

  const renderTab = (route: (typeof routes)[number]) => {
    const meta = tabs[route.name];
    const focused = activeKey === route.key;
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
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      >
        <Icon name={focused ? meta.activeIcon : meta.icon} color={color} size={22} />
        <Text style={[styles.label, { color }]}>{meta.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      {routes.filter((r) => leftTabs.includes(r.name)).map(renderTab)}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start kveldsgjennomgangen"
        hitSlop={4}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/review');
        }}
        style={({ pressed }) => [styles.mic, pressed && styles.micPressed]}
      >
        <Icon name="mic.fill" color={palette.actionText} size={22} />
      </Pressable>

      {routes.filter((r) => !leftTabs.includes(r.name)).map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: space.lg - 4,
    right: space.lg - 4,
    bottom: BAR_BOTTOM,
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    shadowColor: palette.text,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  tab: {
    minWidth: 56,
    minHeight: control.iconButton + space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pressed: { opacity: 0.6 },
  label: { ...type.caption, fontSize: 11, lineHeight: 13, fontWeight: '600' },
  mic: {
    width: MIC,
    height: MIC,
    borderRadius: MIC / 2,
    backgroundColor: palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micPressed: { transform: [{ scale: 0.94 }] },
});
