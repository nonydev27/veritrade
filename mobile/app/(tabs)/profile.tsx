import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuth from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { Brand } from '@/constants/theme';
import { GlassCard } from '@/components/GlassCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SPACING, tabBarBottomInset } from '@/constants/layout';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const KYC_PROGRESS: Record<string, number> = {
  PENDING: 25,
  SUBMITTED: 50,
  VERIFIED: 100,
  REJECTED: 10,
};

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { stats } = useTransactions();
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarBottomInset(insets.bottom);

  const kycStatus = user?.kyc_status || 'PENDING';
  const kycProgress = KYC_PROGRESS[kycStatus] ?? 25;

  function onLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  }

  const menuItems: { icon: IoniconName; label: string; subtitle?: string; onPress: () => void }[] = [
    { icon: 'notifications-outline', label: 'Notifications', subtitle: 'Alerts & updates', onPress: () => Alert.alert('Coming soon') },
    { icon: 'shield-checkmark-outline', label: 'Security & KYC', subtitle: `Status: ${kycStatus}`, onPress: () => Alert.alert('KYC', `Your KYC status is ${kycStatus}`) },
    { icon: 'chatbubble-ellipses-outline', label: 'Support', subtitle: 'Chat with VeriBot', onPress: () => router.push('/(tabs)/bot') },
    { icon: 'keypad-outline', label: 'How USSD Works', subtitle: '*384*1#', onPress: () => router.push('/(tabs)/explore') },
    { icon: 'document-text-outline', label: 'Terms & Privacy', onPress: () => Alert.alert('veritrade.com.gh/terms') },
  ];

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Brand.primaryDark, Brand.primary, 'transparent']} style={styles.header}>
          <GlassCard tint="dark" style={styles.avatarWrap}>
            <Text style={styles.avatarTxt}>{(user?.name?.[0] || 'V').toUpperCase()}</Text>
          </GlassCard>
          <Text style={styles.name}>{user?.name || 'Trader'}</Text>
          <Text style={styles.phone}>{user?.phone || '—'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons
              name={user?.role === 'SELLER' ? 'cube-outline' : user?.role === 'ADMIN' ? 'shield-outline' : 'cart-outline'}
              size={12}
              color="#fff"
            />
            <Text style={styles.roleTxt}>{user?.role || 'BUYER'}</Text>
          </View>
        </LinearGradient>

        <GlassCard tint="dark" style={styles.strip}>
          {[
            { icon: 'stats-chart-outline' as IoniconName, label: 'Trades', value: String(stats.total) },
            { icon: 'flash-outline' as IoniconName, label: 'Active', value: String(stats.active) },
            { icon: 'calendar-outline' as IoniconName, label: 'Since', value: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '—' },
          ].map((s) => (
            <View key={s.label} style={styles.stripItem}>
              <View style={styles.stripIconWrap}>
                <Ionicons name={s.icon} size={16} color={Brand.primaryLight} />
              </View>
              <Text style={styles.stripVal}>{s.value}</Text>
              <Text style={styles.stripLabel}>{s.label}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard tint="dark" style={styles.kycCard}>
          <View style={styles.kycHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Brand.primaryLight} />
            <Text style={styles.kycTitle}>KYC Verification</Text>
            <View style={[styles.kycBadge, { backgroundColor: kycProgress === 100 ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)' }]}>
              <Text style={[styles.kycStatus, { color: kycProgress === 100 ? Brand.success : Brand.warning }]}>{kycStatus}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={kycProgress === 100 ? ['#16A34A', '#22C55E'] : ['#1A56DB', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${kycProgress}%` as `${number}%` }]}
            />
          </View>
          <Text style={styles.kycHint}>
            {kycProgress === 100 ? 'Your identity is verified' : 'Complete KYC to unlock higher limits'}
          </Text>
        </GlassCard>

        <GlassCard tint="dark" noPadding style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={20} color={Brand.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.subtitle ? <Text style={styles.menuSub}>{item.subtitle}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          ))}
        </GlassCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={Brand.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>VeriTrade Ghana · v1.0</Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 40, alignItems: 'center' },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, padding: 0,
  },
  avatarTxt: { fontSize: 34, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff' },
  phone: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 14 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
    backgroundColor: Brand.accent, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  roleTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  strip: {
    flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: -28,
    justifyContent: 'space-around', paddingVertical: 18, zIndex: 2,
  },
  stripItem: { alignItems: 'center', gap: 4, flex: 1 },
  stripIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(26,86,219,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  stripVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  stripLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  kycCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  kycHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  kycTitle: { flex: 1, fontWeight: '700', fontSize: 15, color: '#fff' },
  kycBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  kycStatus: { fontWeight: '800', fontSize: 11 },
  progressTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  kycHint: { fontSize: 12, marginTop: 10, color: 'rgba(255,255,255,0.5)' },
  menuCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  menuIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(26,86,219,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  menuSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  logoutTxt: { color: Brand.error, fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 20 },
});
