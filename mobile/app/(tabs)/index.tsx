import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import api from '@/services/api';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const STATUS_COLOR: Record<string, string> = {
  PENDING: Brand.warning,
  PAID: Brand.primary,
  COMPLETED: Brand.success,
  DISPUTED: Brand.error,
  CANCELLED: '#9CA3AF',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

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

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Trader'} 👋</Text>
          <Text style={styles.greetingSub}>Your trades are secured</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{(user?.name?.[0] || 'V').toUpperCase()}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, emoji: '📊' },
          { label: 'Active', value: stats.active, emoji: '⏳' },
          { label: 'Done', value: stats.completed, emoji: '✅' },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: c.card }]}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statVal}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <Text style={[styles.section, { color: c.text }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/create-escrow')}>
          <Text style={styles.actionEmoji}>🔒</Text>
          <Text style={styles.actionTxt}>New Escrow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOrange]} onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={styles.actionEmoji}>📋</Text>
          <Text style={styles.actionTxt}>My Trades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.actionEmoji}>📱</Text>
          <Text style={styles.actionTxt}>USSD Info</Text>
        </TouchableOpacity>
      </View>

      {/* Recent transactions */}
      <View style={styles.sectionRow}>
        <Text style={[styles.section, { color: c.text }]}>Recent</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: c.card }]}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={[styles.emptyTxt, { color: c.subtext }]}>No transactions yet</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/create-escrow')}>
            <Text style={styles.emptyBtnTxt}>Create your first escrow</Text>
          </TouchableOpacity>
        </View>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={[styles.txCard, { backgroundColor: c.card }]}>
            <View style={styles.txLeft}>
              <Text style={styles.txCode}>#{tx.transaction_code}</Text>
              <Text style={[styles.txItem, { color: c.subtext }]}>{tx.item_description}</Text>
            </View>
            <View style={styles.txRight}>
              <Text style={styles.txAmount}>KES {tx.amount}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[tx.status] + '20' }]}>
                <Text style={[styles.statusTxt, { color: STATUS_COLOR[tx.status] }]}>{tx.status}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: Brand.primary, paddingTop: 56, paddingBottom: 28,
    paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
  greetingSub: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 13 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Brand.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: -20, marginBottom: 8 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  statEmoji: { fontSize: 20 },
  statVal: { fontSize: 22, fontWeight: '800', color: Brand.primary, marginTop: 4 },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  section: { fontWeight: '700', fontSize: 16, paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  seeAll: { color: Brand.primary, fontWeight: '600', fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  actionBtn: {
    flex: 1, backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, alignItems: 'center',
  },
  actionBtnOrange: { backgroundColor: '#FFF7ED' },
  actionEmoji: { fontSize: 24, marginBottom: 6 },
  actionTxt: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
  emptyCard: { margin: 20, borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 40 },
  emptyTxt: { marginTop: 8, fontSize: 15, marginBottom: 16 },
  emptyBtn: { backgroundColor: Brand.primary, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 24 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700' },
  txCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 10, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  txLeft: { flex: 1 },
  txCode: { fontWeight: '700', fontSize: 13, color: Brand.primary },
  txItem: { fontSize: 13, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontWeight: '800', fontSize: 15, color: Brand.black },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
});
