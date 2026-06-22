import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function TabIcon({ name, focused }: { name: React.ComponentProps<typeof Ionicons>['name']; focused: boolean }) {
  return (
    <Ionicons name={name} size={24} color={focused ? Brand.primary : '#9CA3AF'} />
  );
}

function CreateIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.createBtn, focused && styles.createBtnActive]}>
      <Ionicons name="add" size={28} color="#fff" />
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Height = icon + label + bottom safe area (system nav bar)
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          backgroundColor: c.tabBar,
          borderTopWidth: 1,
          borderTopColor: c.border,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint={scheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'receipt' : 'receipt-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create-escrow"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <CreateIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bot"
        options={{
          title: 'VeriBot',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'hardware-chip' : 'hardware-chip-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'USSD',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'keypad' : 'keypad-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Brand.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Brand.accent,
    shadowOpacity: 0.5, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  createBtnActive: { backgroundColor: Brand.accentDark },
});
