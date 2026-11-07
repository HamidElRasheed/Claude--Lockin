// Design tokens for the "Pust" direction (see DECISIONS.md).
// Never hardcode colors or sizes in components — import from here.

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

// Crisp, near-square corners everywhere. Only true circles (orb, status dots) are round.
export const radius = {
  sm: 2,
  md: 2,
  button: 2,
  lg: 2,
  pill: 2,
} as const;

export const control = {
  primaryHeight: 58,
  height: 50,
  iconButton: 44,
} as const;

// The app "speaks" in Newsreader, an editorial serif. Everything else is Familjen Grotesk.
// Custom fonts need one family per weight, so weight is chosen by family, never by fontWeight.
export const fonts = {
  voice: 'Newsreader_400Regular',
  ui: 'FamiljenGrotesk_400Regular',
  uiMedium: 'FamiljenGrotesk_500Medium',
  uiBold: 'FamiljenGrotesk_600SemiBold',
} as const;

export const type = {
  voice: { fontFamily: fonts.voice, fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  body: { fontFamily: fonts.ui, fontSize: 17, lineHeight: 24 },
  caption: { fontFamily: fonts.uiMedium, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  strong: { fontFamily: fonts.uiBold },
} as const;

export const orb = {
  size: 140,
  breatheMs: 3000,
  listenMs: 700,
} as const;
