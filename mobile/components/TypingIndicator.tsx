import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Brand } from '@/constants/theme';

export function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.row}>
      {dots.map((opacity, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, paddingVertical: 6, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.primaryLight },
});
