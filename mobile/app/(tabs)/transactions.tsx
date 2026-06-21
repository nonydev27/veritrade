import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import api from '@/services/api';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const STATUS_META: Record<string, { color: string; emoji: string }> = {
  PENDING:   { color: Brand.warning, emoji: '⏳' },
  PAID:      { color: Brand.primary, emoji: '💳' },
  COMPLETED: { color: Brand.success, emoji: '✅' },
  DISPUTED:  { color: Brand.error,   emoji: '⚠️' },
  CANCELLED: { color: '#9CA3AF',     emoji: '❌' },
};

const FILTERS = ['ALL', 'PENDING', 'PAID', 'COMPLETED', 'DISPUTED'];

export default function Transactions() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];
  const [all, setAll] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/escrow/list');
      setAll(res.data.transactions || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function confirmDelivery(code: string) {
    Alert.alert('Confirm Delivery', `Confirm delivery for transaction #${code}? Funds will be released to seller.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', style: 'default',
        onPress: async () => {
          try {
            await api.post('/escrow/confirm', { transactionCode: code });
            await load();
          } catch { Alert.alert('Error', 'Could not confirm delivery'); }
        },
      },
    ]);
  }

  async function raiseDispute(code: string) {
    Alert.alert('Raise Dispute', `Raise a dispute for transaction #${code}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dispute', style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/escrow/dispute', { transactionCode: code, reason: 'Item not as described' });
            await load();
          } catch { Alert.alert('Error', 'Could not raise dispute'); }
        },
      },
    ]);
  }

  const displayed = filter === 'ALL' ? all : all.filter((t) => t.status === filter);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Transactions</Text>
        <Text style={styles.headerSub}>{all.length} total trades</Text>
      </View>

      {/* Filter pills */}
      <View style={{ backgroundColor: c.card }}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterPill, filter === item && styles.filterPillActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterTxt, filter === item && styles.filterTxtActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Brand.primary} size="large" />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(t) => String(t.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyTxt, { color: c.subtext }]}>No transactions found</Text>
            </View>
          }
          renderItem={({ item: tx }) => {
            const meta = STATUS_META[tx.status] || STATUS_META.CANCELLED;
            return (
              <View style={[styles.card, { backgroundColor: c.card }]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.txEmoji}>{meta.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txCode, { color: c.text }]}>{tx.item_description}</Text>
                    <Text style={styles.txSub}>#{tx.transaction_code}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.txAmount}>KES {tx.amount}</Text>
                    <View style={[styles.badge, { backgroundColor: meta.color + '20' }]}>
                      <Text style={[styles.badgeTxt, { color: meta.color }]}>{tx.status}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                {tx.status === 'PAID' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmDelivery(tx.transaction_code)}>
                      <Text style={styles.confirmTxt}>✅ Confirm Delivery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.disputeBtn} onPress={() => raiseDispute(tx.transaction_code)}>
                      <Text style={styles.disputeTxt}>⚠️ Dispute</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {tx.status === 'PENDING' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.payBtn} onPress={async () => {
                      try { await api.post('/escrow/pay', { transactionCode: tx.transaction_code }); await load(); }
                      catch { Alert.alert('Error', 'Payment failed'); }
                    }}>
                      <Text style={styles.payTxt}>💳 Mark as Paid</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: Brand.primary, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 13 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterPillActive: { backgroundColor: Brand.primary },
  filterTxt: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTxtActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40 },
  emptyTxt: { marginTop: 10, fontSize: 15 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardLeft: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txEmoji: { fontSize: 18 },
  txCode: { fontWeight: '700', fontSize: 15 },
  txSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  rightCol: { alignItems: 'flex-end' },
  txAmount: { fontWeight: '800', fontSize: 15, color: Brand.black },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  confirmBtn: { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmTxt: { color: Brand.success, fontWeight: '700', fontSize: 13 },
  disputeBtn: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  disputeTxt: { color: Brand.error, fontWeight: '700', fontSize: 13 },
  payBtn: { flex: 1, backgroundColor: '#EEF2FF', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  payTxt: { color: Brand.primary, fontWeight: '700', fontSize: 13 },
});
