import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS } from '@/constants/layout';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  noPadding?: boolean;
};

export function GlassCard({
  children,
  style,
  intensity = GLASS.intensity,
  tint = GLASS.tint,
  noPadding = false,
}: Props) {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.card, noPadding && styles.noPadding, style]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: GLASS.borderRadius,
    overflow: 'hidden',
    borderWidth: GLASS.borderWidth,
    borderColor: GLASS.border,
    backgroundColor: GLASS.background,
    padding: GLASS.padding,
    ...GLASS.shadow,
  },
  noPadding: { padding: 0 },
});
