import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { GlassCard } from '@/components/GlassCard';

type Props = { count?: number };

function SkeletonBar({ width, height = 14 }: { width: number | `${number}%`; height?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.bar, { width, height, opacity }]}
    />
  );
}

export function StatsSkeleton({ count = 3 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i} style={styles.card}>
          <SkeletonBar width={24} height={24} />
          <SkeletonBar width="60%" height={22} />
          <SkeletonBar width="40%" height={12} />
        </GlassCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  card: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 14 },
  bar: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6 },
});
