/**
 * Study App – Design Tokens
 * Dark-first gamified study app color palette
 */

import { Platform } from 'react-native';

// ─── Brand Palette ──────────────────────────────────────────────────────────
export const Palette = {
  // Primary purple-to-blue gradient family
  primary:    '#7C3AED', // vibrant violet
  primaryMid: '#6D28D9',
  primaryDark:'#4C1D95',

  // Accent – warm amber / gold (XP, streaks, rewards)
  accent:     '#F59E0B',
  accentDark: '#D97706',
  accentGlow: '#FCD34D',

  // Success green
  success:    '#10B981',
  successDark:'#059669',

  // Danger / destructive
  danger:     '#EF4444',

  // Surfaces (dark-mode-first)
  bg:         '#0F0E17',   // deepest background
  surface:    '#1A1828',   // cards / elevated surfaces
  surfaceAlt: '#231F35',   // slightly lighter surface
  border:     '#2E2A45',   // subtle borders

  // Text
  textPrimary:   '#F0EEFF',
  textSecondary: '#9B97B8',
  textMuted:     '#5D5880',

  // Streak fire color
  fire:       '#FF6B35',
  fireGlow:   '#FF9A5C',
};

// ─── Legacy Colors (kept for existing component compatibility) ───────────────
const tintColorLight = Palette.primary;
const tintColorDark  = Palette.accentGlow;

export const Colors = {
  light: {
    text:            '#11181C',
    background:      '#fff',
    tint:            tintColorLight,
    icon:            '#687076',
    tabIconDefault:  '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text:            Palette.textPrimary,
    background:      Palette.bg,
    tint:            tintColorDark,
    icon:            Palette.textSecondary,
    tabIconDefault:  Palette.textSecondary,
    tabIconSelected: tintColorDark,
  },
};

// ─── Typography ─────────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ─── Border Radius ───────────────────────────────────────────────────────────
export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 999,
};
