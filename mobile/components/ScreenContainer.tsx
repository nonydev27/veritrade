import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Add padding for bottom tab bar on tab screens */
  tabBarPadding?: boolean;
  backgroundColor?: string;
};

export function ScreenContainer({
  children,
  style,
  edges = ['top'],
  tabBarPadding = false,
  backgroundColor,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarPadding ? TAB_BAR_BASE_HEIGHT + insets.bottom : 0;

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.container,
        backgroundColor ? { backgroundColor } : undefined,
        bottomPad > 0 ? { paddingBottom: bottomPad } : undefined,
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
