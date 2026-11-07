import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Voice } from '@/components/Voice';
import { palettes, space, type Tone } from '@/theme';

type Props = {
  tone?: Tone;
  // Tab screens leave the bottom edge to the tab bar.
  inTabs?: boolean;
  title?: string;
  children?: ReactNode;
};

// Base layout for every screen: mood (dawn/dusk), safe area, generous margins.
const allEdges: Edge[] = ['top', 'right', 'bottom', 'left'];
const tabEdges: Edge[] = ['top', 'right', 'left'];

export function Screen({ tone = 'dawn', inTabs = false, title, children }: Props) {
  const palette = palettes[tone];
  return (
    <SafeAreaView edges={inTabs ? tabEdges : allEdges} style={[styles.safe, { backgroundColor: palette.background }]}>
      <StatusBar style={tone === 'dusk' ? 'light' : 'dark'} />
      <View style={styles.container}>
        {title ? <Voice tone={tone}>{title}</Voice> : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.xxl, paddingBottom: space.lg },
});
