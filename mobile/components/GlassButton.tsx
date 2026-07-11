import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/theme';
import { GLASS } from '@/constants/layout';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  icon?: IoniconName;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
};

const VARIANTS = {
  primary: ['#1A56DB', '#2563EB'] as const,
  accent: ['#EA580C', '#F97316'] as const,
  danger: ['#DC2626', '#EF4444'] as const,
};

export function GlassButton({
  label,
  onPress,
  icon,
  loading,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        style={[styles.ghost, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            {icon ? <Ionicons name={icon} size={18} color="#fff" style={styles.icon} /> : null}
            <Text style={styles.ghostTxt}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={[...VARIANTS[variant]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.grad}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            {icon ? <Ionicons name={icon} size={18} color="#fff" style={styles.icon} /> : null}
            <Text style={styles.txt}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  grad: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...GLASS.shadow,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: 8 },
  txt: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  ghost: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: GLASS.borderWidth,
    borderColor: GLASS.border,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ghostTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
