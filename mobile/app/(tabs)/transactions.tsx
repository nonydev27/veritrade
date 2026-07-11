import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert, StatusBar, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';
import { Brand, Currency } from '@/constants/theme';
import { GlassCard } from '@/components/GlassCard';
import { GlassInput } from '@/components/GlassInput';
import { GlassButton } from '@/components/GlassButton';
import { StatusBadge, STATUS_META } from '@/components/StatusBadge';
import { ScreenBackground } from '@/components/ScreenBackground';
import { KeyboardAwareView } from '@/components/KeyboardAwareView';
import { SPACING, tabBarBottomInset } from '@/constants/layout';

const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'FUNDED', 'SHIPPED', 'COMPLETED', 'DISPUTED'];

export default function Transactions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [all, setAll] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [payModal, setPayModal] = useState(false);
  const [payCode, setPayCode] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [payNetwork, setPayNetwork] = useState<'MTN' | 'VODAFONE' | 'AIRTELTIGO'>('MTN');
  const [paying, setPaying] = useState(false);

  const [pinModal, setPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [confirming, setConfirming] = useState(false);

  const bottomPad = tabBarBottomInset(insets.bottom);

  async function load() {
    try {
      const res = await api.get('/escrow/list');
      setAll(res.data.transactions || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  function openPayModal(code: string) { setPayCode(code); setPayPhone(''); setPayModal(true); }

  async function submitPay() {
    if (!payPhone || payPhone.length < 10) {
      Alert.alert('Error', 'Enter a valid 10-digit phone number');
      return;
    }
    setPaying(true);
    try {
      await api.post('/moolre/pay', { transactionCode: payCode, phone: payPhone, network: payNetwork });
      setPayModal(false);
      Alert.alert('Payment Sent', 'Approve the mobile money prompt on your phone.');
      await load();
    } catch (err: any) {
      Alert.alert('Payment Failed', err.response?.data?.error || 'Could not initiate payment');
    } finally { setPaying(false); }
  }

  function openPinModal(code: string) { setPinCode(code); setPinInput(''); setPinModal(true); }

  async function submitPin() {
    if (!pinInput || pinInput.length !== 6) {
      Alert.alert('Error', 'Delivery PIN must be 6 digits');
      return;
    }
    setConfirming(true);
    try {
      await api.post('/escrow/confirm', { transactionCode: pinCode, deliveryPin: pinInput });
      setPinModal(false);
      Alert.alert('Confirmed!', 'Funds released to seller.');
      await load();
    } catch (err: any) {
      Alert.alert('Confirmation Failed', err.response?.data?.error || 'Incorrect PIN');
    } finally { setConfirming(false); }
  }

  async function raiseDispute(code: string) {
    Alert.alert('Raise Dispute', `Dispute transaction #${code}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dispute', style: 'destructive', onPress: async () => {
          try {
            await api.post('/escrow/dispute', { transactionCode: code, reason: 'Item not as described' });
            await load();
          } catch {
            Alert.alert('Error', 'Could not raise dispute');
          }
        },
      },
    ]);
  }

  const displayed = filter === 'ALL' ? all : all.filter((t) => t.status === filter);

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Brand.primaryDark, Brand.primary, 'transparent']} style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="receipt-outline" size={24} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSub}>{all.length} total trade{all.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      <GlassCard tint="dark" noPadding style={styles.filterBar}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f}
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
      </GlassCard>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Brand.primaryLight} size="large" />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(t) => String(t.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primaryLight} />}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: bottomPad }}
          ListEmptyComponent={
            <GlassCard tint="dark" style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="file-tray-outline" size={40} color="rgba(255,255,255,0.35)" />
              </View>
              <Text style={styles.emptyTxt}>No transactions found</Text>
              <Text style={styles.emptyHint}>Pull down to refresh</Text>
            </GlassCard>
          }
          renderItem={({ item: tx }) => {
            const meta = STATUS_META[tx.status] || STATUS_META.CANCELLED;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/transaction/${tx.transaction_code}`)}
              >
                <GlassCard tint="dark" style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
                      <Ionicons name={meta.icon} size={22} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txTitle} numberOfLines={1}>{tx.item_description}</Text>
                      <Text style={styles.txCode}>#{tx.transaction_code}</Text>
                    </View>
                    <View style={styles.rightCol}>
                      <Text style={styles.txAmount}>{Currency.symbol}{Number(tx.amount).toLocaleString('en-GH')}</Text>
                      <StatusBadge status={tx.status} />
                    </View>
                  </View>

                  {tx.status === 'ACCEPTED' && (
                    <View style={styles.actRow}>
                      <TouchableOpacity style={styles.actBlue} onPress={(e) => { e.stopPropagation?.(); openPayModal(tx.transaction_code); }}>
                        <Ionicons name="phone-portrait-outline" size={15} color={Brand.primaryLight} />
                        <Text style={styles.actTxtBlue}>Pay via MoMo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {tx.status === 'SHIPPED' && (
                    <View style={styles.actRow}>
                      <TouchableOpacity style={styles.actGreen} onPress={(e) => { e.stopPropagation?.(); openPinModal(tx.transaction_code); }}>
                        <Ionicons name="keypad-outline" size={15} color={Brand.success} />
                        <Text style={styles.actTxtGreen}>Enter Delivery PIN</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actRed} onPress={(e) => { e.stopPropagation?.(); raiseDispute(tx.transaction_code); }}>
                        <Ionicons name="warning-outline" size={15} color={Brand.error} />
                        <Text style={styles.actTxtRed}>Dispute</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {tx.status === 'FUNDED' && (
                    <View style={styles.actRow}>
                      <TouchableOpacity style={styles.actRed} onPress={(e) => { e.stopPropagation?.(); raiseDispute(tx.transaction_code); }}>
                        <Ionicons name="warning-outline" size={15} color={Brand.error} />
                        <Text style={styles.actTxtRed}>Raise Dispute</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={payModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAwareView scrollEnabled={false} contentContainerStyle={styles.modalScroll}>
            <GlassCard tint="dark" style={styles.modalCard}>
              <Text style={styles.modalTitle}>Pay via Mobile Money</Text>
              <Text style={styles.modalSub}>A payment prompt will be sent to your phone</Text>
              <GlassInput
                icon="call-outline"
                placeholder="024 XXX XXXX"
                keyboardType="phone-pad"
                value={payPhone}
                onChangeText={setPayPhone}
              />
              <View style={styles.networkRow}>
                {(['MTN', 'VODAFONE', 'AIRTELTIGO'] as const).map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.networkBtn, payNetwork === n && styles.networkBtnActive]}
                    onPress={() => setPayNetwork(n)}
                  >
                    <Text style={[styles.networkTxt, payNetwork === n && { color: '#fff' }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <GlassButton label="Send Payment Prompt" onPress={submitPay} loading={paying} />
              <TouchableOpacity onPress={() => setPayModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </GlassCard>
          </KeyboardAwareView>
        </View>
      </Modal>

      <Modal visible={pinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAwareView scrollEnabled={false} contentContainerStyle={styles.modalScroll}>
            <GlassCard tint="dark" style={styles.modalCard}>
              <Ionicons name="keypad" size={40} color={Brand.success} style={{ marginBottom: 12 }} />
              <Text style={styles.modalTitle}>Confirm Delivery</Text>
              <Text style={styles.modalSub}>Enter the 6-digit PIN from your seller</Text>
              <GlassInput
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={pinInput}
                onChangeText={setPinInput}
              />
              <GlassButton label="Confirm & Release Funds" onPress={submitPin} loading={confirming} variant="primary" />
              <TouchableOpacity onPress={() => setPinModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </GlassCard>
          </KeyboardAwareView>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: SPACING.lg, alignItems: 'center' },
  headerIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 13 },
  filterBar: { marginHorizontal: SPACING.md, marginTop: -8, marginBottom: 4, zIndex: 2 },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  pillActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pillTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  pillTxtActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8, marginTop: 20 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  emptyTxt: { fontSize: 15, color: '#fff', fontWeight: '600' },
  emptyHint: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontWeight: '700', fontSize: 14, color: '#fff' },
  txCode: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontWeight: '800', fontSize: 15, color: '#fff' },
  actRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  actGreen: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
  },
  actRed: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  actBlue: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(26,86,219,0.2)', borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
  },
  actTxtGreen: { fontWeight: '700', fontSize: 13, color: Brand.success },
  actTxtRed: { fontWeight: '700', fontSize: 13, color: Brand.error },
  actTxtBlue: { fontWeight: '700', fontSize: 13, color: Brand.primaryLight },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalScroll: { paddingHorizontal: 0, paddingBottom: 0 },
  modalCard: {
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4, textAlign: 'center' },
  modalSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20, textAlign: 'center' },
  networkRow: { flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%' },
  networkBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  networkBtnActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  networkTxt: { fontWeight: '700', color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  modalCancelBtn: { paddingVertical: 10, alignItems: 'center' },
  modalCancelTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});
