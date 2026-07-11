import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Keyboard,
  View,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { SPACING } from '@/constants/layout';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  centerContent?: boolean;
  /** Extra bottom padding when keyboard is closed (e.g. tab bar height) */
  bottomInset?: number;
};

export function KeyboardAwareView({
  children,
  style,
  contentContainerStyle,
  scrollEnabled = true,
  centerContent = false,
  bottomInset = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
  const centerWhenClosed = centerContent && keyboardInset === 0;
  const bottomPad = keyboardInset > 0 ? keyboardInset : bottomInset;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, style]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.scrollContent,
          centerWhenClosed && styles.centered,
          { paddingBottom: bottomPad + SPACING.xl },
          contentContainerStyle,
        ]}
      >
        <Pressable onPress={Keyboard.dismiss} style={styles.pressable}>
          <View style={centerWhenClosed ? styles.centeredInner : styles.content}>
            {children}
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  pressable: { flexGrow: 1 },
  content: { flexGrow: 1 },
  centered: { justifyContent: 'center' },
  centeredInner: { width: '100%' },
});
