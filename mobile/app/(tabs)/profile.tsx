import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];

  function onLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/login'); },
      },
    ]);
  }

  const menuItems = [
    { emoji: '🔔', label: 'Notifications', onPress: () => Alert.alert('Coming soon') },
    { emoji: '🛡️', label: 'Security & KYC', onPress: () => Alert.alert('Coming soon') },
    { emoji: '💬', label: 'Support', onPress: () => Alert.alert('Contact: support@veritrade.app') },
    { emoji: '📖', label: 'How USSD Works', onPress: () => router.push('/(tabs)/explore') },
    { emoji: '⚖️', label: 'Terms & Privacy', onPress: () => Alert.alert('Terms: veritrade.app/terms') },
  ];

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarTxt}>{(user?.name?.[0] || 'V').toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Trader'}</Text>
        <Text style={styles.phone}>{user?.phone || '-'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleTxt}>{user?.role || 'BUYER'}</Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={[styles.statsStrip, { backgroundColor: c.card }]}>
        {[
          { label: 'Trades', value: '—' },
          { label: 'KYC', value: user?.kyc_status || 'PENDING' },
          { label: 'Since', value: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '—' },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statVal}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, { backgroundColor: c.card }]}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}
            onPress={item.onPress}
          >
            <Text style={styles.menuEmoji}>{item.emoji}</Text>
            <Text style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutTxt}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>VeriTrade v1.0 · Built with ♥</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: Brand.primary, paddingTop: 60, paddingBottom: 32,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Brand.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarTxt: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 12 },
  phone: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 14 },
  roleBadge: { marginTop: 8, backgroundColor: Brand.accent, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  roleTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  statsStrip: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: -20,
    borderRadius: 16, padding: 20, justifyContent: 'space-around',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: Brand.primary },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  menuCard: { margin: 20, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuEmoji: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  menuArrow: { fontSize: 20, color: '#9CA3AF' },
  logoutBtn: {
    marginHorizontal: 20, backgroundColor: '#FEE2E2', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  logoutTxt: { color: Brand.error, fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 20 },
});
