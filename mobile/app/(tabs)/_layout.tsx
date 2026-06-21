import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function CreateButton({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={styles.createOuter}>
      <View style={[styles.createInner, focused && styles.createInnerActive]}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Activity" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create-escrow"
        options={{
          tabBarIcon: ({ focused }) => <CreateButton emoji="➕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📱" label="USSD" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', paddingTop: 4 },
  tabItemActive: {},
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontSize: 10, marginTop: 2, color: '#9CA3AF', fontWeight: '500' },
  tabLabelActive: { color: Brand.primary, fontWeight: '700' },
  createOuter: { alignItems: 'center', justifyContent: 'center', marginTop: -20 },
  createInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Brand.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Brand.accent, shadowOpacity: 0.45,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  createInnerActive: { backgroundColor: Brand.accentDark },
});
