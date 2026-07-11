import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenBackground({ children, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={['#060C1A', '#0D1A3A', '#0A1020']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.blobBlue} />
      <View style={styles.blobPurple} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060C1A' },
  blobBlue: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#1A56DB',
    opacity: 0.14,
    top: -40,
    right: -60,
  },
  blobPurple: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#7C3AED',
    opacity: 0.1,
    bottom: 120,
    left: -70,
  },
});
