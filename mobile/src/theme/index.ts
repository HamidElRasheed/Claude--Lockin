// Design tokens. Never hardcode colors or sizes in components — import from here.
// Direction (2026-11-08): BLACK AND WHITE ONLY, Apple HIG. Every grey is black or white
// at lower opacity, so there is no third colour. Reference: the "Lockin – designskisse" canvas.

// Two fixed moods, not a user-facing dark mode:
// dawn = light (morning, log, week, progress, setup). dusk = inverted black (evening review, done).
export const palettes = {
  dawn: {
    background: '#F5F5F3',
    surface: '#FFFFFF',
    text: '#111111',
    textMuted: 'rgba(17,17,17,0.55)',
    line: 'rgba(17,17,17,0.10)',
    orb: '#111111',
    orbGlow: 'rgba(17,17,17,0.08)',
    mark: '#111111',
    action: '#111111',
    actionText: '#FFFFFF',
    tonal: 'rgba(17,17,17,0.06)',
    tonalText: '#111111',
    // Hero cards (big numbers) are inverted: black card, white text.
    hero: '#111111',
    heroText: '#FFFFFF',
    heroMuted: 'rgba(255,255,255,0.6)',
    heroTrack: 'rgba(255,255,255,0.18)',
  },
  dusk: {
    background: '#111111',
    surface: 'rgba(255,255,255,0.07)',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.55)',
    line: 'rgba(255,255,255,0.12)',
    orb: '#FFFFFF',
    orbGlow: 'rgba(255,255,255,0.10)',
    mark: '#FFFFFF',
    action: '#FFFFFF',
    actionText: '#111111',
    tonal: 'rgba(255,255,255,0.12)',
    tonalText: '#FFFFFF',
    hero: '#FFFFFF',
    heroText: '#111111',
    heroMuted: 'rgba(17,17,17,0.6)',
    heroTrack: 'rgba(17,17,17,0.15)',
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

// Soft iOS corners: grouped lists 16, cards 20–24, buttons and the tab bar are full pills.
export const radius = {
  sm: 10,
  md: 16,
  button: 999,
  lg: 24,
  pill: 999,
} as const;

export const control = {
  primaryHeight: 58,
  height: 50,
  iconButton: 44,
} as const;

// One typeface: the system font (SF Pro on iPhone). Hierarchy comes from size and weight only.
// title = what the app says, lead = its quieter follow-up line.
export const type = {
  title: { fontSize: 34, fontWeight: '700' as const, lineHeight: 40, letterSpacing: -0.8 },
  lead: { fontSize: 20, fontWeight: '400' as const, lineHeight: 26, letterSpacing: -0.3 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22, letterSpacing: -0.2 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  strong: { fontWeight: '600' as const },
} as const;

export const orb = {
  size: 140,
  breatheMs: 3000,
  listenMs: 700,
} as const;
