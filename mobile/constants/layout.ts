import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const IS_SMALL_SCREEN = width < 360;

export const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const GLASS = {
  borderRadius: 16,
  intensity: 60,
  tint: 'light' as const,
  background: 'rgba(255,255,255,0.12)',
  backgroundDark: 'rgba(255,255,255,0.1)',
  border: 'rgba(255,255,255,0.2)',
  borderWidth: 1,
  padding: 16,
  screenPadding: 20,
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const KEYBOARD_OFFSET = Platform.OS === 'ios' ? 88 : 24;

/** Base tab bar height without safe area inset */
export const TAB_BAR_BASE_HEIGHT = 56;

/** Tab bar content + safe area — use for scroll bottom padding on tab screens */
export function tabBarBottomInset(safeBottom: number) {
  return TAB_BAR_BASE_HEIGHT + safeBottom + SPACING.md;
}

export function statCardWidth(gap = 10, columns = 3, padding = SPACING.lg) {
  return (SCREEN_WIDTH - padding * 2 - gap * (columns - 1)) / columns;
}
