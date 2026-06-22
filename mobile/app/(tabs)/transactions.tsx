import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { Brand, Colors, Currency } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_META: Record<string, { color: string; icon: IoniconName }> = {
  PENDING:   { color: Brand.warning, icon: 'time-outline' },
  PAID:      { color: Brand.primary, icon: 'card-outline' },
  COMPLETED: { color: Brand.success, icon: 'checkmark-circle-outline' },
  DISPUTED:  { color: Brand.error,   icon: 'warning-outline' },
  CANCELLED: { color: '#9CA3AF',     icon: 'close-circle-outline' },
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
    try { const res = await api.get('/escrow/list'); setAll(res.data.transactions || []); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function confirmDelivery(code: string) {
    Alert.alert('Confirm Delivery', `Release funds for #${code}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
          try { await api.post('/escrow/confirm', { transactionCode: code }); await load(); }
          catch { Alert.alert('Error', 'Could not confirm'); }
        },
      },
    ]);
  }

  async function raiseDispute(code: string) {
    Alert.alert('Raise Dispute', `Dispute transaction #${code}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dispute', style: 'destructive', onPress: async () => {
          try { await api.post('/escrow/dispute', { transactionCode: code, reason: 'Item not as described' }); await load(); }
          catch { Alert.alert('Error', 'Could not raise dispute'); }
        },
      },
    ]);
  }

  const displayed = filter === 'ALL' ? all : all.filter((t) => t.status === filter);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Brand.primaryDark, Brand.primary]} style={styles.header}>
        <Ionicons name="receipt-outline" size={24} color="rgba(255,255,255,0.7)" style={{ marginBottom: 4 }} />
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSub}>{all.length} total trade{all.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      {/* Glass filter bar */}
      <BlurView intensity={40} tint={scheme === 'dark' ? 'dark' : 'light'} style={styles.filterBar}>
        <FlatList
          horizontal data={FILTERS} keyExtractor={(f) => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.pill, filter === item && styles.pillActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.pillTxt, filter === item && styles.pillTxtActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </BlurView>

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
              <Ionicons name="file-tray-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyTxt, { color: c.subtext }]}>No transactions found</Text>
            </View>
          }
          renderItem={({ item: tx }) => {
            const meta = STATUS_META[tx.status] || STATUS_META.CANCELLED;
            return (
              <BlurView intensity={28} tint="light" style={[styles.card, { overflow: 'hidden' }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txTitle, { color: c.text }]} numberOfLines={1}>{tx.item_description}</Text>
                    <Text style={styles.txCode}>#{tx.transaction_code}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.txAmount}>{Currency.symbol}{Number(tx.amount).toLocaleString('en-GH')}</Text>
                    <View style={[styles.badge, { backgroundColor: meta.color + '22' }]}>
                      <Text style={[styles.badgeTxt, { color: meta.color }]}>{tx.status}</Text>
                    </View>
                  </View>
                </View>

                {tx.status === 'PAID' && (
                  <View style={styles.actRow}>
                    <TouchableOpacity style={styles.actGreen} onPress={() => confirmDelivery(tx.transaction_code)}>
                      <Ionicons name="checkmark-circle-outline" size={15} color={Brand.success} />
                      <Text style={[styles.actTxt, { color: Brand.success }]}>Confirm Delivery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actRed} onPress={() => raiseDispute(tx.transaction_code)}>
                      <Ionicons name="warning-outline" size={15} color={Brand.error} />
                      <Text style={[styles.actTxt, { color: Brand.error }]}>Dispute</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {tx.status === 'PENDING' && (
                  <View style={styles.actRow}>
                    <TouchableOpacity style={styles.actBlue} onPress={async () => {
                      try { await api.post('/escrow/pay', { transactionCode: tx.transaction_code }); await load(); }
                      catch { Alert.alert('Error', 'Payment failed'); }
                    }}>
                      <Ionicons name="card-outline" size={15} color={Brand.primary} />
                      <Text style={[styles.actTxt, { color: Brand.primary }]}>Mark as Paid</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </BlurView>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 13 },
  filterBar: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)' },
  pillActive: { backgroundColor: Brand.primary },
  pillTxt: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  pillTxtActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTxt: { fontSize: 15 },
  card: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontWeight: '700', fontSize: 14 },
  txCode: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  rightCol: { alignItems: 'flex-end' },
  txAmount: { fontWeight: '800', fontSize: 15, color: Brand.black },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  actRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  actGreen: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 10, paddingVertical: 9 },
  actRed: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 9 },
  actBlue: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EEF2FF', borderRadius: 10, paddingVertical: 9 },
  actTxt: { fontWeight: '700', fontSize: 13 },
});
