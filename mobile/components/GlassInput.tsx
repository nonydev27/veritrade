import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GLASS } from '@/constants/layout';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = TextInputProps & {
  icon?: IoniconName;
  prefix?: string;
  error?: boolean;
  containerStyle?: ViewStyle;
};

export function GlassInput({
  icon,
  prefix,
  error,
  containerStyle,
  style,
  ...rest
}: Props) {
  return (
    <View
      style={[
        styles.wrap,
        error && styles.wrapError,
        containerStyle,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color="rgba(255,255,255,0.5)" style={styles.icon} /> : null}
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="rgba(255,255,255,0.35)"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: GLASS.borderWidth,
    borderColor: GLASS.border,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  wrapError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  icon: { marginRight: 10 },
  prefix: { fontWeight: '800', color: '#3B82F6', fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#FFFFFF' },
});
