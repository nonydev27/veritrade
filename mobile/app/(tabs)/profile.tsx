import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];

  function onLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  }

  const menuItems: { icon: IoniconName; label: string; onPress: () => void }[] = [
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => Alert.alert('Coming soon') },
    { icon: 'shield-checkmark-outline', label: 'Security & KYC', onPress: () => Alert.alert('Coming soon') },
    { icon: 'chatbubble-ellipses-outline', label: 'Support', onPress: () => Alert.alert('Email: support@veritrade.com.gh') },
    { icon: 'keypad-outline', label: 'How USSD Works', onPress: () => router.push('/(tabs)/explore') },
    { icon: 'document-text-outline', label: 'Terms & Privacy', onPress: () => Alert.alert('veritrade.com.gh/terms') },
  ];

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[Brand.primaryDark, Brand.primary]} style={styles.header}>
        <BlurView intensity={20} tint="light" style={styles.avatarWrap}>
          <Text style={styles.avatarTxt}>{(user?.name?.[0] || 'V').toUpperCase()}</Text>
        </BlurView>
        <Text style={styles.name}>{user?.name || 'Trader'}</Text>
        <Text style={styles.phone}>{user?.phone || '—'}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name={user?.role === 'SELLER' ? 'cube-outline' : 'cart-outline'} size={12} color="#fff" />
          <Text style={styles.roleTxt}>{user?.role || 'BUYER'}</Text>
        </View>
      </LinearGradient>

      {/* KYC / stats strip */}
      <BlurView intensity={30} tint="light" style={styles.strip}>
        {[
          { icon: 'stats-chart-outline' as IoniconName, label: 'Trades', value: '—' },
          { icon: 'shield-outline' as IoniconName, label: 'KYC', value: user?.kyc_status || 'PENDING' },
          { icon: 'calendar-outline' as IoniconName, label: 'Member since', value: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '—' },
        ].map((s) => (
          <View key={s.label} style={styles.stripItem}>
            <Ionicons name={s.icon} size={16} color={Brand.primary} />
            <Text style={styles.stripVal}>{s.value}</Text>
            <Text style={styles.stripLabel}>{s.label}</Text>
          </View>
        ))}
      </BlurView>

      {/* Menu */}
      <BlurView intensity={28} tint="light" style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}
            onPress={item.onPress}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name={item.icon} size={20} color={Brand.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </BlurView>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color={Brand.error} style={{ marginRight: 8 }} />
        <Text style={styles.logoutTxt}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>VeriTrade Ghana · v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', marginBottom: 12,
  },
  avatarTxt: { fontSize: 34, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff' },
  phone: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 14 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: Brand.accent, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  roleTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  strip: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: -24,
    borderRadius: 18, padding: 16, justifyContent: 'space-around', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  stripItem: { alignItems: 'center', gap: 3 },
  stripVal: { fontSize: 16, fontWeight: '800', color: Brand.primary },
  stripLabel: { fontSize: 11, color: '#9CA3AF' },
  menuCard: { margin: 20, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#FEE2E2',
    borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
  },
  logoutTxt: { color: Brand.error, fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 20 },
});
