// Design tokens. Placeholder values until the final design lands.
// Never hardcode colors or sizes in components — import from here.

export const colors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  text: '#141414',
  textMuted: '#6B6B6B',
  border: '#E8E8E4',
  accent: '#2F6F5E',
  done: '#2F6F5E',
  partial: '#C9A227',
  missed: '#B5513E',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  pill: 999,
} as const;

export const type = {
  title: { fontSize: 28, fontWeight: '600' as const, lineHeight: 34 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
} as const;
