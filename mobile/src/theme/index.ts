// Design tokens for the "Pust" direction (see DECISIONS.md).
// Never hardcode colors or sizes in components — import from here.

import { Platform } from 'react-native';

// Two fixed moods, not a user-facing dark mode:
// dawn = morning, week letter, setup. dusk = evening review.
export const palettes = {
  dawn: {
    background: '#F4EDE4',
    surface: '#FBF7F1',
    text: '#2A2420',
    textMuted: '#6E635A',
    line: '#E3D9CC',
    orb: '#F2B880',
    orbGlow: 'rgba(242, 184, 128, 0.45)',
    mark: '#C9733A',
    action: '#B84A17',
    actionText: '#FFF8F1',
    tonal: '#EADFD0',
    tonalText: '#2A2420',
  },
  dusk: {
    background: '#161B2E',
    surface: '#1E2440',
    text: '#F1ECE4',
    textMuted: '#A9A6B8',
    line: '#3A4060',
    orb: '#F2B880',
    orbGlow: 'rgba(242, 184, 128, 0.5)',
    mark: '#F2B880',
    action: '#F2B880',
    actionText: '#161B2E',
    tonal: '#262D4B',
    tonalText: '#F1ECE4',
  },
} as const;

export type Tone = keyof typeof palettes;
export type Palette = (typeof palettes)[Tone];

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  button: 18,
  lg: 24,
  pill: 999,
} as const;

export const control = {
  primaryHeight: 58,
  height: 50,
  iconButton: 44,
} as const;

// The app "speaks" in the system serif (New York on iOS).
// The user's own words and all UI use the system sans.
const serif = Platform.select({ ios: 'ui-serif', default: 'serif' });

export const type = {
  voice: { fontFamily: serif, fontSize: 32, fontWeight: '400' as const, lineHeight: 40, letterSpacing: -0.3 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 25 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
} as const;

export const orb = {
  size: 140,
  breatheMs: 3000,
  listenMs: 700,
} as const;
