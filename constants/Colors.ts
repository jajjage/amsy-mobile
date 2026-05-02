/**
 * Amsy Colors for Expo/React Navigation
 *
 * This file provides colors in the format expected by Expo and React Navigation.
 * The colors are derived from the Amsy color palette.
 */

import { darkColors, lightColors } from './palette';

const tintColorLight = lightColors.primary; // #2dd4bf - Amsy Primary
const tintColorDark = lightColors.primary; // #2dd4bf - Same in dark mode

export default {
  light: {
    text: lightColors.foreground,           // #121212
    background: lightColors.background,      // #FFFFFF
    tint: tintColorLight,                    // #2dd4bf
    tabIconDefault: lightColors.mutedForeground, // #64748b
    tabIconSelected: tintColorLight,
    
    // Additional navigation colors
    card: lightColors.card,
    border: lightColors.border,
    notification: lightColors.destructive,
    primary: lightColors.primary,
  },
  dark: {
    text: darkColors.foreground,             // #bfbfbf
    background: darkColors.background,        // #262626
    tint: tintColorDark,                      // #2dd4bf
    tabIconDefault: darkColors.mutedForeground, // #d4d4d4
    tabIconSelected: tintColorDark,
    
    // Additional navigation colors
    card: darkColors.card,
    border: darkColors.border,
    notification: darkColors.destructive,
    primary: darkColors.primary,
  },
};



