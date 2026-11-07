import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space, type } from '@/theme';

type Props = {
  title: string;
  children?: ReactNode;
};

// Base layout for every screen: safe area, background, title.
export function Screen({ title, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.md },
  title: { ...type.title, color: colors.text },
});
