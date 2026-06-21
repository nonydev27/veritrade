import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export function CenterTabButton(props: BottomTabBarButtonProps & { label?: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        props.onPressIn?.(ev);
      }}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]}>
      <View style={[styles.button, { backgroundColor: colors.tint }]}>
        <Text style={[styles.plus, { color: '#fff' }]}>+</Text>
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  plus: {
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '600',
  },
});
