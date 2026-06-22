import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuth from '@/hooks/useAuth';
import api from '@/services/api';
import { Brand, Colors, Currency } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import TooltipOverlay from '@/components/tooltip-overlay';

const STATUS_COLOR: Record<string, string> = {
  PENDING: Brand.warning,
  PAID: Brand.primary,
  COMPLETED: Brand.success,
  DISPUTED: Brand.error,
  CANCELLED: '#9CA3AF',
};

const STATUS_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  PENDING: 'time-outline',
  PAID: 'card-outline',
  COMPLETED: 'checkmark-circle-outline',
  DISPUTED: 'warning-outline',
  CANCELLED: 'close-circle-outline',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  async function load() {
    try {
      const res = await api.get('/escrow/list');
      const txs: any[] = res.data.transactions || [];
      setTransactions(txs.slice(0, 3));
      setStats({
        total: txs.length,
        active: txs.filter((t) => ['PENDING', 'PAID'].includes(t.status)).length,
        completed: txs.filter((t) => t.status === 'COMPLETED').length,
      });
    } catch {}
  }

  useEffect(() => {
    load();
    AsyncStorage.getItem('tooltipSeen').then((seen) => {
      if (!seen) setShowTooltip(true);
    });
  }, []);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleTooltipDone() {
    await AsyncStorage.setItem('tooltipSeen', 'true');
    setShowTooltip(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" />
      <TooltipOverlay visible={showTooltip} onDone={handleTooltipDone} />

      {/* Gradient header */}
      <LinearGradient colors={[Brand.primaryDark, Brand.primary]} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Trader'} 👋</Text>
            <Text style={styles.greetingSub}>Your trades are secured</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
            <Text style={styles.avatarTxt}>{(user?.name?.[0] || 'V').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />}
      >
        {/* Stats — glass cards floating off header */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: stats.total, icon: 'bar-chart-outline' as const, color: Brand.primary },
            { label: 'Active', value: stats.active, icon: 'time-outline' as const, color: Brand.warning },
            { label: 'Done', value: stats.completed, icon: 'checkmark-done-outline' as const, color: Brand.success },
          ].map((s) => (
            <BlurView key={s.label} intensity={40} tint="light" style={styles.statCard}>
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </BlurView>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={[styles.section, { color: c.text }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {[
            { icon: 'lock-closed-outline' as const, label: 'New Escrow', bg: '#EEF2FF', color: Brand.primary, onPress: () => router.push('/(tabs)/create-escrow') },
            { icon: 'receipt-outline' as const, label: 'My Trades', bg: '#FFF7ED', color: Brand.accent, onPress: () => router.push('/(tabs)/transactions') },
            { icon: 'keypad-outline' as const, label: 'USSD Info', bg: '#F0FDF4', color: Brand.success, onPress: () => router.push('/(tabs)/explore') },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={[styles.actionCard, { backgroundColor: a.bg }]} onPress={a.onPress}>
              <View style={[styles.actionIconWrap, { backgroundColor: a.color + '22' }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={[styles.actionTxt, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent transactions */}
        <View style={styles.sectionRow}>
          <Text style={[styles.section, { color: c.text, marginTop: 0 }]}>Recent Trades</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <BlurView intensity={30} tint="light" style={[styles.emptyCard, { overflow: 'hidden' }]}>
            <Ionicons name="file-tray-outline" size={40} color="#9CA3AF" />
            <Text style={[styles.emptyTxt, { color: c.subtext }]}>No transactions yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/create-escrow')}>
              <Text style={styles.emptyBtnTxt}>Create your first escrow</Text>
            </TouchableOpacity>
          </BlurView>
        ) : (
          transactions.map((tx) => (
            <BlurView key={tx.id} intensity={30} tint="light" style={[styles.txCard, { overflow: 'hidden' }]}>
              <View style={[styles.txIconWrap, { backgroundColor: STATUS_COLOR[tx.status] + '22' }]}>
                <Ionicons name={STATUS_ICON[tx.status] || 'ellipse-outline'} size={20} color={STATUS_COLOR[tx.status]} />
              </View>
              <View style={styles.txLeft}>
                <Text style={[styles.txItem, { color: c.text }]} numberOfLines={1}>{tx.item_description}</Text>
                <Text style={styles.txCode}>#{tx.transaction_code}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>{Currency.symbol}{Number(tx.amount).toLocaleString('en-GH')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[tx.status] + '22' }]}>
                  <Text style={[styles.statusTxt, { color: STATUS_COLOR[tx.status] }]}>{tx.status}</Text>
                </View>
              </View>
            </BlurView>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 56, paddingBottom: 48, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
  greetingSub: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 13 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Brand.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },
  statsRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20,
    marginTop: -28, marginBottom: 8,
  },
  statCard: {
    flex: 1, borderRadius: 18, padding: 14, alignItems: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  statVal: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  section: { fontWeight: '700', fontSize: 16, paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  seeAll: { color: Brand.primary, fontWeight: '600', fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  actionCard: { flex: 1, borderRadius: 18, padding: 14, alignItems: 'center', gap: 8 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionTxt: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  emptyCard: { margin: 20, borderRadius: 20, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  emptyTxt: { fontSize: 15, marginBottom: 8 },
  emptyBtn: { backgroundColor: Brand.primary, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 24 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700' },
  txCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 10, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  txIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txLeft: { flex: 1 },
  txItem: { fontWeight: '600', fontSize: 14 },
  txCode: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontWeight: '800', fontSize: 15, color: Brand.black },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusTxt: { fontSize: 10, fontWeight: '700' },
});
