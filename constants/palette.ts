/**
 * Amsy App Color Scheme
 *
 * This file contains the complete color palette for the Amsy app,
 * extracted from the web application for consistency across platforms.
 *
 * @module constants/palette
 */

/**
 * Light theme color palette
 */
export const lightColors = {
  // Core colors
  background: '#FFFFFF',
  foreground: '#121212',

  // Card
  card: '#FFFFFF',
  cardForeground: '#121212',

  // Popover
  popover: '#FFFFFF',
  popoverForeground: '#121212',

  // Primary (Amsy Teal)
  primary: '#2dd4bf',
  primaryForeground: '#000000',
  primaryLight: '#99f6e4',
  primaryDark: '#0f766e',

  // Secondary
  secondary: '#f0fdfa',
  secondaryForeground: '#121212',

  // Muted
  muted: '#f1f5f9',
  mutedForeground: '#64748b',

  // Accent
  accent: '#ecfeff',
  accentForeground: '#121212',

  // Destructive (Error/Danger)
  destructive: '#ef4444',
  destructiveForeground: '#fef2f2',

  // Success (Additional for mobile)
  success: '#22c55e',
  successForeground: '#FFFFFF',

  // Warning (Additional for mobile)
  warning: '#f59e0b',
  warningForeground: '#121212',

  // Info (Additional for mobile)
  info: '#06b6d4',
  infoForeground: '#FFFFFF',

  // Border & Input
  border: '#e5e7eb',
  input: '#e5e7eb',
  inputBackground: '#FFFFFF',

  // Focus Ring
  ring: '#2dd4bf',

  // Sidebar
  sidebarBackground: '#f8fafc',
  sidebarForeground: '#334155',
  sidebarPrimary: '#2dd4bf',
  sidebarPrimaryForeground: '#FAFAF9',
  sidebarAccent: '#cffafe',
  sidebarAccentForeground: '#121212',
  sidebarBorder: '#cbd5e1',
  sidebarRing: '#2dd4bf',

  // Charts
  chart1: '#2dd4bf',
  chart2: '#06b6d4',
  chart3: '#22c55e',
  chart4: '#ef4444',
  chart5: '#ccfbf1',

  // Text variants
  textPrimary: '#121212',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textDisabled: '#cbd5e1',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Dark theme color palette
 */
export const darkColors = {
  // Core colors
  background: '#262626',
  foreground: '#bfbfbf',

  // Card
  card: '#404040',
  cardForeground: '#bfbfbf',

  // Popover
  popover: '#262626',
  popoverForeground: '#bfbfbf',

  // Primary (Amsy Teal)
  primary: '#2dd4bf',
  primaryForeground: '#000000',
  primaryLight: '#99f6e4',
  primaryDark: '#0f766e',

  // Secondary
  secondary: '#3f3f3f',
  secondaryForeground: '#f5f5f5',

  // Muted
  muted: '#363636',
  mutedForeground: '#f5f5f5',

  // Accent
  accent: '#3f3f3f',
  accentForeground: '#f5f5f5',

  // Destructive (Error/Danger)
  destructive: '#330000',
  destructiveForeground: '#fef2f2',

  // Success
  success: '#22c55e',
  successForeground: '#FFFFFF',

  // Warning
  warning: '#f59e0b',
  warningForeground: '#121212',

  // Info
  info: '#06b6d4',
  infoForeground: '#FFFFFF',

  // Border & Input
  border: '#666666',
  input: '#666666',
  inputBackground: '#404040',

  // Focus Ring
  ring: '#2dd4bf',

  // Sidebar
  sidebarBackground: '#121212',
  sidebarForeground: '#909090',
  sidebarPrimary: '#2dd4bf',
  sidebarPrimaryForeground: '#000000',
  sidebarAccent: '#3f3f3f',
  sidebarAccentForeground: '#f5f5f5',
  sidebarBorder: '#525252',
  sidebarRing: '#2dd4bf',

  // Charts
  chart1: '#2dd4bf',
  chart2: '#22c55e',
  chart3: '#06b6d4',
  chart4: '#ef4444',
  chart5: '#262626',

  // Text variants
  textPrimary: '#bfbfbf',
  textSecondary: '#d4d4d4',
  textTertiary: '#94a3b8',
  textDisabled: '#737373',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Color type definitions
 */
export type LightColorPalette = typeof lightColors;
export type DarkColorPalette = typeof darkColors;
export type ColorPalette = LightColorPalette | DarkColorPalette;

/**
 * Base color keys (useful for type-safe color access)
 */
export type ColorKey = keyof LightColorPalette;

/**
 * Theme type definition
 */
export type ThemeType = 'light' | 'dark';

/**
 * Get colors based on theme
 */
export const getColors = (theme: ThemeType): ColorPalette => {
  return theme === 'dark' ? darkColors : lightColors;
};

/**
 * Design tokens for spacing, radius, etc.
 */
export const designTokens = {
  // Border radius (matching web app)
  radius: {
    sm: 11,
    md: 13,
    lg: 15,
    xl: 19,
    full: 9999,
  },

  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Shadows (for elevation)
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const;

/**
 * Default export for convenience
 */
export default {
  light: lightColors,
  dark: darkColors,
  tokens: designTokens,
};


