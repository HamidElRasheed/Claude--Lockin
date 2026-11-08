import { SymbolView, type SFSymbol } from 'expo-symbols';
import { StyleSheet, Text } from 'react-native';

// One icon set: SF Symbols on iPhone (bundled in Expo Go), plain text glyphs elsewhere.
const fallbackGlyph: Record<string, string> = {
  'arrow.right': '→',
  'chevron.left': '‹',
  'chevron.right': '›',
  xmark: '×',
  'calendar.badge.plus': '+',
  'square.and.pencil': '✎',
  'book.closed': '≡',
  'chart.line.uptrend.xyaxis': '↗',
  'moon.stars': '☾',
  'hand.tap': '•',
  'sun.max': '○',
  target: '◎',
  plus: '+',
  minus: '−',
  checkmark: '✓',
  house: '⌂',
  'house.fill': '⌂',
  'book.closed.fill': '≡',
  'chart.bar': '▥',
  'chart.bar.fill': '▥',
  'chart.pie': '◔',
  'chart.pie.fill': '◔',
  'mic.fill': '●',
  'waveform.path': '~',
  lightbulb: '!',
  lock: '◉',
  'hand.raised': '✋',
};

type Props = {
  name: SFSymbol;
  color: string;
  size?: number;
};

export function Icon({ name, color, size = 18 }: Props) {
  return (
    <SymbolView
      name={name}
      tintColor={color}
      size={size}
      weight="semibold"
      fallback={<Text style={[styles.fallback, { color, fontSize: size, lineHeight: size + 2 }]}>{fallbackGlyph[name] ?? '•'}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { fontWeight: '600', textAlign: 'center' },
});
