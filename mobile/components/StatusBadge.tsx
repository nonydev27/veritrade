import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_META: Record<string, { color: string; icon: IoniconName; label?: string }> = {
  PENDING: { color: Brand.warning, icon: 'time-outline' },
  ACCEPTED: { color: '#3B82F6', icon: 'checkmark-outline' },
  FUNDED: { color: Brand.primary, icon: 'card-outline' },
  PAID: { color: Brand.primary, icon: 'card-outline' },
  SHIPPED: { color: '#8B5CF6', icon: 'airplane-outline' },
  COMPLETED: { color: Brand.success, icon: 'checkmark-circle-outline' },
  DISPUTED: { color: Brand.error, icon: 'warning-outline' },
  CANCELLED: { color: '#9CA3AF', icon: 'close-circle-outline' },
  REFUNDED: { color: '#6B7280', icon: 'arrow-undo-outline' },
  REJECTED: { color: Brand.error, icon: 'close-circle-outline' },
};

type Props = {
  status: string;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
};

export function StatusBadge({ status, label, pulse = false, size = 'sm' }: Props) {
  const meta = STATUS_META[status] || STATUS_META.CANCELLED;
  const scale = useRef(new Animated.Value(1)).current;
  const display = label || meta.label || status;

  useEffect(() => {
    if (!pulse || !['PENDING', 'FUNDED', 'SHIPPED', 'PAID'].includes(status)) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [status, pulse, scale]);

  const isMd = size === 'md';

  return (
    <Animated.View
      style={[
        styles.badge,
        isMd && styles.badgeMd,
        { backgroundColor: meta.color + '22', transform: [{ scale }] },
      ]}
    >
      <Ionicons name={meta.icon} size={isMd ? 14 : 11} color={meta.color} />
      <Text style={[styles.txt, isMd && styles.txtMd, { color: meta.color }]}>{display}</Text>
    </Animated.View>
  );
}

export { STATUS_META };

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeMd: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6 },
  txt: { fontSize: 10, fontWeight: '700' },
  txtMd: { fontSize: 13 },
});
