import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar, TextInput, Modal,
  Animated, Dimensions, RefreshControl,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuth from '@/hooks/useAuth';
import api from '@/services/api';
import { Brand, Colors, Currency } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlassCard } from '@/components/GlassCard';
import { GlassInput } from '@/components/GlassInput';
import { GlassButton } from '@/components/GlassButton';
import { KeyboardAwareView } from '@/components/KeyboardAwareView';
import { StatusBadge } from '@/components/StatusBadge';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Transaction {
  id: number;
  transaction_code: string;
  buyer_id: number;
  seller_id: number;
  item_description: string;
  amount: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  accepted_at: string | null;
  funded_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  refunded_at: string | null;
  delivery_pin_hash: string | null;
}

interface LedgerEntry {
  id: number;
  transaction_id: number;
  amount: number;
  type: string;
  reference: string;
  created_at: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { color: string; icon: IoniconName; label: string }> = {
  PENDING:   { color: Brand.warning,  icon: 'time-outline',              label: 'Pending Acceptance' },
  ACCEPTED:  { color: '#3B82F6',      icon: 'checkmark-circle-outline',  label: 'Accepted' },
  FUNDED:    { color: Brand.primary,  icon: 'card-outline',              label: 'Funded' },
  SHIPPED:   { color: '#8B5CF6',      icon: 'airplane-outline',          label: 'Shipped' },
  COMPLETED: { color: Brand.success,  icon: 'checkmark-done-circle',     label: 'Completed' },
  DISPUTED:  { color: Brand.error,    icon: 'warning-outline',           label: 'Disputed' },
  CANCELLED: { color: '#9CA3AF',      icon: 'close-circle-outline',      label: 'Cancelled' },
  REFUNDED:  { color: '#6B7280',      icon: 'arrow-undo-outline',        label: 'Refunded' },
  REJECTED:  { color: Brand.error,    icon: 'close-circle-outline',      label: 'Rejected' },
};

// ─── Timeline steps (in order) ───────────────────────────────────────────────

const TIMELINE_STEPS: Array<{
  key: string;
  label: string;
  icon: IoniconName;
  tsField: keyof Transaction;
}> = [
  { key: 'CREATED',  label: 'Created',          icon: 'create-outline',           tsField: 'created_at'   },
  { key: 'ACCEPTED', label: 'Seller Accepted',   icon: 'checkmark-circle-outline', tsField: 'accepted_at'  },
  { key: 'FUNDED',   label: 'Escrow Funded',     icon: 'card-outline',             tsField: 'funded_at'    },
  { key: 'SHIPPED',  label: 'Item Shipped',       icon: 'airplane-outline',         tsField: 'shipped_at'   },
  { key: 'COMPLETED',label: 'Delivery Confirmed', icon: 'checkmark-done-circle',    tsField: 'completed_at' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
}

function initials(name?: string): string {
  if (!name) return 'V';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const LEDGER_TYPE_COLOR: Record<string, string> = {
  CREDIT:        Brand.success,
  DEBIT:         Brand.error,
  REFUND:        '#6B7280',
  PAYOUT:        '#8B5CF6',
  PAYOUT_FAILED: Brand.error,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimelineStep({
  step, tx, index, total, fadeAnim,
}: {
  step: typeof TIMELINE_STEPS[0];
  tx: Transaction;
  index: number;
  total: number;
  fadeAnim: Animated.Value;
}) {
  const ts = tx[step.tsField] as string | null;
  const isLast = index === total - 1;

  // A step is "done" if its timestamp field is populated
  const done = !!ts;
  // Active = the most recent completed step
  const nextTs = index < total - 1 ? (tx[TIMELINE_STEPS[index + 1].tsField] as string | null) : null;
  const active = done && !nextTs;

  const dotColor = done ? Brand.primary : '#E2E8F0';
  const lineColor = done && !isLast ? Brand.primary : '#E2E8F0';
  const textColor = done ? Brand.black : '#9CA3AF';

  return (
    <Animated.View style={[s.stepRow, { opacity: fadeAnim }]}>
      {/* Connector line above (skip for first) */}
      <View style={s.stepLeft}>
        {index > 0 && <View style={[s.stepLine, { backgroundColor: lineColor }]} />}
        <View style={[s.stepDot, { backgroundColor: dotColor, borderColor: done ? Brand.primary : '#D1D5DB' }]}>
          {done && <Ionicons name={step.icon} size={12} color="#fff" />}
        </View>
        {!isLast && <View style={[s.stepLineBelow, { backgroundColor: done && !active ? Brand.primary : '#E2E8F0' }]} />}
      </View>

      <View style={s.stepContent}>
        <Text style={[s.stepLabel, { color: textColor, fontWeight: done ? '700' : '400' }]}>
          {step.label}
          {active && <Text style={{ color: Brand.primary }}> ← now</Text>}
        </Text>
        {ts ? (
          <Text style={s.stepTs}>{fmt(ts)}</Text>
        ) : (
          <Text style={[s.stepTs, { color: '#D1D5DB' }]}>Not yet reached</Text>
        )}
      </View>
    </Animated.View>
  );
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const color = LEDGER_TYPE_COLOR[entry.type] || '#6B7280';
  const sign = entry.amount >= 0 ? '+' : '';
  return (
    <View style={s.ledgerRow}>
      <View style={[s.ledgerDot, { backgroundColor: color + '22' }]}>
        <Ionicons
          name={entry.amount >= 0 ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={14} color={color}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.ledgerRef} numberOfLines={1}>{entry.reference}</Text>
        <Text style={s.ledgerTs}>{fmt(entry.created_at)}</Text>
      </View>
      <Text style={[s.ledgerAmt, { color }]}>
        {sign}{Currency.symbol}{Math.abs(entry.amount).toLocaleString('en-GH')}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TransactionDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];
  const { user } = useAuth();

  const [tx, setTx]             = useState<Transaction | null>(null);
  const [ledger, setLedger]     = useState<LedgerEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  // Pay modal
  const [payModal, setPayModal]   = useState(false);
  const [payPhone, setPayPhone]   = useState('');
  const [payNetwork, setPayNetwork] = useState<'MTN' | 'VODAFONE' | 'AIRTELTIGO'>('MTN');
  const [paying, setPaying]       = useState(false);

  // PIN modal
  const [pinModal, setPinModal]   = useState(false);
  const [pinInput, setPinInput]   = useState('');
  const [confirming, setConfirming] = useState(false);

  // Animations
  const headerScale = useRef(new Animated.Value(0.92)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const timelineFade = useRef(
    TIMELINE_STEPS.map(() => new Animated.Value(0))
  ).current;

  // ── Data ────────────────────────────────────────────────────────
  async function loadAll() {
    try {
      const [txRes, ledgerRes] = await Promise.all([
        api.get('/escrow/list'),
        api.get(`/escrow/ledger/${code}`).catch(() => ({ data: { ledger: [] } })),
      ]);
      const found = (txRes.data.transactions as Transaction[]).find(
        (t) => t.transaction_code === code
      );
      setTx(found || null);
      setLedger(ledgerRes.data.ledger || []);
    } catch {
      Alert.alert('Error', 'Could not load transaction');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadAll(); }, [code]);

  // Run entrance animation after data loads
  useEffect(() => {
    if (!tx) return;
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Stagger timeline steps
    Animated.stagger(80,
      timelineFade.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true })
      )
    ).start();
  }, [tx]);

  async function onRefresh() { setRefreshing(true); await loadAll(); }

  // ── Roles ───────────────────────────────────────────────────────
  const isBuyer  = user?.id === tx?.buyer_id;
  const isSeller = user?.id === tx?.seller_id;

  // ── Action handlers ─────────────────────────────────────────────
  async function handleAccept() {
    try {
      await api.post('/escrow/accept', { transactionCode: code });
      await loadAll();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Could not accept');
    }
  }

  async function handleReject() {
    Alert.alert('Reject Transaction', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await api.post('/escrow/reject', { transactionCode: code, reason: 'Seller declined' });
          await loadAll();
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.error || 'Could not reject');
        }
      }},
    ]);
  }

  async function handleShip() {
    Alert.alert('Mark as Shipped', 'Generate a delivery PIN and mark this item as shipped?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Ship', onPress: async () => {
        try {
          const res = await api.post('/escrow/ship', { transactionCode: code });
          const pin = res.data.deliveryPin;
          await loadAll();
          Alert.alert(
            '📦 Shipped!',
            `Delivery PIN: ${pin}\n\nShare this PIN with the buyer. They will need it to confirm delivery and release your payment.`,
            [{ text: 'OK — I\'ve noted the PIN', style: 'default' }]
          );
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.error || 'Could not mark as shipped');
        }
      }},
    ]);
  }

  async function handleDispute() {
    Alert.alert('Raise Dispute', 'Freeze this transaction for admin review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dispute', style: 'destructive', onPress: async () => {
        try {
          await api.post('/escrow/dispute', { transactionCode: code, reason: 'Raised by user' });
          await loadAll();
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.error || 'Could not raise dispute');
        }
      }},
    ]);
  }

  async function submitPay() {
    if (!payPhone || payPhone.length < 10) {
      Alert.alert('Error', 'Enter a valid 10-digit Ghana number'); return;
    }
    setPaying(true);
    try {
      await api.post('/moolre/pay', { transactionCode: code, phone: payPhone, network: payNetwork });
      setPayModal(false);
      Alert.alert('Payment Sent 📲', 'Approve the MoMo prompt on your phone. Escrow funds automatically once confirmed.');
      await loadAll();
    } catch (err: any) {
      Alert.alert('Payment Failed', err.response?.data?.error || 'Could not initiate payment');
    } finally { setPaying(false); }
  }

  async function submitPin() {
    if (pinInput.length !== 6) {
      Alert.alert('Error', 'PIN must be exactly 6 digits'); return;
    }
    setConfirming(true);
    try {
      await api.post('/escrow/confirm', { transactionCode: code, deliveryPin: pinInput });
      setPinModal(false);
      await loadAll();
      Alert.alert('Delivery Confirmed 🎉', 'Funds have been released to the seller. Thank you for trading on VeriTrade!');
    } catch (err: any) {
      Alert.alert('Confirmation Failed', err.response?.data?.error || 'Incorrect PIN');
    } finally { setConfirming(false); }
  }

  // ── Render ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.loadingWrap, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
        <Text style={[s.loadingTxt, { color: c.subtext }]}>Loading transaction…</Text>
      </View>
    );
  }

  if (!tx) {
    return (
      <View style={[s.loadingWrap, { backgroundColor: c.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Brand.error} />
        <Text style={[s.loadingTxt, { color: c.text }]}>Transaction not found</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = STATUS_META[tx.status] || STATUS_META.CANCELLED;
  const hasBottomActions =
    (isSeller && ['PENDING', 'FUNDED'].includes(tx.status)) ||
    (isBuyer && ['ACCEPTED', 'SHIPPED', 'FUNDED'].includes(tx.status));
  const bottomBarHeight = hasBottomActions ? 88 + insets.bottom : insets.bottom + 32;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Gradient header ───────────────────────────────────── */}
      <LinearGradient
        colors={[Brand.primaryDark, Brand.primary]}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={s.backArrow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>Transaction</Text>
          <Text style={s.headerCode}>#{tx.transaction_code}</Text>
        </View>
        {/* spacer to balance back arrow */}
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomBarHeight }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      >
        {/* ── Hero card ─────────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ scale: headerScale }] }}>
          <BlurView intensity={40} tint="light" style={s.heroCard}>
            {/* Top accent gradient line */}
            <LinearGradient
              colors={[meta.color, meta.color + '44']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.heroAccentLine}
            />

            {/* Amount */}
            <Text style={s.amountLabel}>Escrow Amount</Text>
            <Text style={s.amountValue}>
              {Currency.symbol}{Number(tx.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={s.amountCurrency}>Ghana Cedis</Text>

            {/* Status badge */}
            <StatusBadge status={tx.status} size="md" pulse />

            {/* Item description */}
            <View style={s.itemRow}>
              <Ionicons name="cube-outline" size={16} color={Brand.primary} />
              <Text style={s.itemTxt} numberOfLines={2}>{tx.item_description}</Text>
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View style={{ opacity: contentFade }}>

          {/* ── Parties ─────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: c.text }]}>Parties</Text>
          <BlurView intensity={30} tint="light" style={s.partiesCard}>
            {/* Buyer */}
            <View style={s.partyRow}>
              <View style={[s.avatar, { backgroundColor: Brand.primary + '22' }]}>
                <Text style={[s.avatarTxt, { color: Brand.primary }]}>B</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.partyRole, { color: c.subtext }]}>Buyer</Text>
                <Text style={[s.partyName, { color: c.text }]}>
                  {isBuyer ? 'You' : `User #${tx.buyer_id}`}
                </Text>
              </View>
              {isBuyer && (
                <View style={[s.youBadge, { backgroundColor: Brand.primary + '22' }]}>
                  <Text style={[s.youBadgeTxt, { color: Brand.primary }]}>YOU</Text>
                </View>
              )}
            </View>

            <View style={s.partiesDivider} />

            {/* Seller */}
            <View style={s.partyRow}>
              <View style={[s.avatar, { backgroundColor: Brand.accent + '22' }]}>
                <Text style={[s.avatarTxt, { color: Brand.accent }]}>S</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.partyRole, { color: c.subtext }]}>Seller</Text>
                <Text style={[s.partyName, { color: c.text }]}>
                  {isSeller ? 'You' : `User #${tx.seller_id}`}
                </Text>
              </View>
              {isSeller && (
                <View style={[s.youBadge, { backgroundColor: Brand.accent + '22' }]}>
                  <Text style={[s.youBadgeTxt, { color: Brand.accent }]}>YOU</Text>
                </View>
              )}
            </View>
          </BlurView>

          {/* ── Timeline ────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: c.text }]}>Timeline</Text>
          <BlurView intensity={30} tint="light" style={s.timelineCard}>
            {TIMELINE_STEPS.map((step, i) => (
              <TimelineStep
                key={step.key}
                step={step}
                tx={tx}
                index={i}
                total={TIMELINE_STEPS.length}
                fadeAnim={timelineFade[i]}
              />
            ))}

            {/* Expiry info */}
            {tx.expires_at && !['COMPLETED', 'CANCELLED', 'REFUNDED', 'REJECTED'].includes(tx.status) && (
              <View style={s.expiryRow}>
                <Ionicons name="timer-outline" size={14} color={Brand.warning} />
                <Text style={s.expiryTxt}>
                  Expires {fmt(tx.expires_at)}
                </Text>
              </View>
            )}
          </BlurView>

          {/* ── Payment info ─────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { color: c.text }]}>Payment Details</Text>
          <BlurView intensity={30} tint="light" style={s.infoCard}>
            {[
              { label: 'Transaction Code', value: `#${tx.transaction_code}` },
              { label: 'Amount',           value: `${Currency.symbol}${Number(tx.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })} GHS` },
              { label: 'Escrow Status',    value: tx.status },
              { label: 'Created',          value: fmt(tx.created_at) },
              { label: 'Funded',           value: tx.funded_at ? fmt(tx.funded_at) : 'Not yet funded' },
            ].map(({ label, value }) => (
              <View key={label} style={s.infoRow}>
                <Text style={[s.infoLabel, { color: c.subtext }]}>{label}</Text>
                <Text style={[s.infoValue, { color: c.text }]}>{value}</Text>
              </View>
            ))}
          </BlurView>

          {['COMPLETED', 'CANCELLED', 'REFUNDED', 'REJECTED', 'DISPUTED'].includes(tx.status) && (
            <View style={[s.terminalBanner, { backgroundColor: meta.color + '18', borderColor: meta.color + '44', marginHorizontal: 16 }]}>
              <Ionicons name={meta.icon} size={20} color={meta.color} />
              <Text style={[s.terminalTxt, { color: meta.color }]}>
                {tx.status === 'COMPLETED' && 'Trade completed. Funds released to seller.'}
                {tx.status === 'CANCELLED' && 'This transaction was cancelled.'}
                {tx.status === 'REFUNDED'  && 'Funds have been refunded to buyer.'}
                {tx.status === 'REJECTED'  && 'This transaction was rejected by the seller.'}
                {tx.status === 'DISPUTED'  && 'Under admin review. We\'ll notify you of the decision.'}
              </Text>
            </View>
          )}

          {/* ── Ledger / Audit Trail ────────────────────────────── */}
          <TouchableOpacity
            style={[s.ledgerToggle, { borderColor: c.border }]}
            onPress={() => setShowLedger(!showLedger)}
          >
            <Ionicons name="receipt-outline" size={16} color={Brand.primary} />
            <Text style={[s.ledgerToggleTxt, { color: Brand.primary }]}>
              Audit Trail ({ledger.length} entries)
            </Text>
            <Ionicons name={showLedger ? 'chevron-up' : 'chevron-down'} size={16} color={Brand.primary} />
          </TouchableOpacity>

          {showLedger && (
            <BlurView intensity={30} tint="light" style={s.ledgerCard}>
              {ledger.length === 0 ? (
                <Text style={[s.ledgerEmpty, { color: c.subtext }]}>No ledger entries yet</Text>
              ) : (
                ledger.map((e) => <LedgerRow key={e.id} entry={e} />)
              )}
            </BlurView>
          )}

        </Animated.View>
      </ScrollView>

      {hasBottomActions && (
        <BlurView intensity={60} tint="light" style={[s.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
          {isSeller && tx.status === 'PENDING' && (
            <View style={s.actRow}>
              <TouchableOpacity style={[s.actBtn, { backgroundColor: Brand.primary }]} onPress={handleAccept}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={s.actBtnTxt}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actBtn, { backgroundColor: Brand.error }]} onPress={handleReject}>
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={s.actBtnTxt}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          {isSeller && tx.status === 'FUNDED' && (
            <TouchableOpacity style={[s.actBtnFull, { backgroundColor: '#8B5CF6' }]} onPress={handleShip}>
              <Ionicons name="airplane-outline" size={18} color="#fff" />
              <Text style={s.actBtnTxt}>Mark Shipped</Text>
            </TouchableOpacity>
          )}
          {isBuyer && tx.status === 'ACCEPTED' && (
            <TouchableOpacity style={[s.actBtnFull, { backgroundColor: Brand.primary }]} onPress={() => setPayModal(true)}>
              <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
              <Text style={s.actBtnTxt}>Pay via MoMo</Text>
            </TouchableOpacity>
          )}
          {isBuyer && tx.status === 'SHIPPED' && (
            <TouchableOpacity style={[s.actBtnFull, { backgroundColor: Brand.success }]} onPress={() => { setPinInput(''); setPinModal(true); }}>
              <Ionicons name="keypad-outline" size={18} color="#fff" />
              <Text style={s.actBtnTxt}>Enter Delivery PIN</Text>
            </TouchableOpacity>
          )}
          {isBuyer && ['FUNDED', 'SHIPPED'].includes(tx.status) && (
            <TouchableOpacity style={[s.bottomDisputeBtn]} onPress={handleDispute}>
              <Ionicons name="warning-outline" size={16} color={Brand.error} />
              <Text style={[s.bottomDisputeTxt]}>Dispute</Text>
            </TouchableOpacity>
          )}
        </BlurView>
      )}

      {/* ── MoMo Payment Modal ─────────────────────────────────── */}
      <Modal visible={payModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <KeyboardAwareView scrollEnabled={false} contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 0 }}>
            <GlassCard tint="dark" style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Ionicons name="phone-portrait-outline" size={36} color={Brand.primary} style={{ marginBottom: 8 }} />
            <Text style={s.modalTitle}>Pay via Mobile Money</Text>
            <Text style={s.modalSub}>
              A prompt will be sent to your phone.{'\n'}Approve it to fund the escrow.
            </Text>

            <Text style={s.modalLabel}>Amount</Text>
            <View style={[s.modalAmountBox, { borderColor: Brand.primary + '55' }]}>
              <Text style={s.modalAmountTxt}>
                {Currency.symbol}{Number(tx.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <Text style={s.modalLabel}>Your MoMo Number</Text>
            <GlassInput
              icon="call-outline"
              placeholder="0XX XXX XXXX"
              keyboardType="phone-pad"
              value={payPhone}
              onChangeText={setPayPhone}
            />

            <Text style={s.modalLabel}>Network</Text>
            <View style={s.networkRow}>
              {(['MTN', 'VODAFONE', 'AIRTELTIGO'] as const).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[s.networkBtn, payNetwork === n && { backgroundColor: Brand.primary, borderColor: Brand.primary }]}
                  onPress={() => setPayNetwork(n)}
                >
                  <Text style={[s.networkTxt, payNetwork === n && { color: '#fff' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <GlassButton label="Send Payment Prompt" icon="send-outline" onPress={submitPay} loading={paying} />
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setPayModal(false)}>
              <Text style={s.modalCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            </GlassCard>
          </KeyboardAwareView>
        </View>
      </Modal>

      {/* ── Delivery PIN Modal ─────────────────────────────────── */}
      <Modal visible={pinModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <KeyboardAwareView scrollEnabled={false} contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 0 }}>
            <GlassCard tint="dark" style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Ionicons name="keypad" size={40} color={Brand.success} style={{ marginBottom: 8 }} />
            <Text style={s.modalTitle}>Confirm Delivery</Text>
            <Text style={s.modalSub}>
              Enter the 6-digit PIN the seller shared with you to release payment.
            </Text>

            <GlassInput
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={pinInput}
              onChangeText={setPinInput}
            />

            <GlassButton label="Confirm & Release Funds" icon="checkmark-circle-outline" onPress={submitPin} loading={confirming} />
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setPinModal(false)}>
              <Text style={s.modalCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            </GlassCard>
          </KeyboardAwareView>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Root / loading
  root:        { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 15 },
  backBtn:     { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Brand.primary, borderRadius: 20 },
  backBtnTxt:  { color: '#fff', fontWeight: '700' },

  // Header
  header:      { paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backArrow:   { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerCode:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Hero card
  heroCard:       { marginHorizontal: 16, marginTop: -24, borderRadius: 24, overflow: 'hidden', padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  heroAccentLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  amountLabel:    { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 8 },
  amountValue:    { fontSize: 40, fontWeight: '900', color: Brand.black, marginTop: 4, letterSpacing: -1 },
  amountCurrency: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', width: '100%' },
  itemTxt:        { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600' },

  // Status badge
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusBadgeTxt: { fontWeight: '700', fontSize: 13 },

  // Section titles
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginTop: 24, marginBottom: 10, marginHorizontal: 20, textTransform: 'uppercase', letterSpacing: 0.8 },

  // Parties card
  partiesCard:    { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  partyRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontWeight: '800', fontSize: 16 },
  partyRole:      { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  partyName:      { fontSize: 15, fontWeight: '700', marginTop: 2 },
  youBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  youBadgeTxt:    { fontWeight: '800', fontSize: 11 },
  partiesDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 12 },

  // Timeline
  timelineCard: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  stepRow:      { flexDirection: 'row', minHeight: 56 },
  stepLeft:     { width: 32, alignItems: 'center' },
  stepLine:     { width: 2, height: 10, marginBottom: 2 },
  stepLineBelow:{ width: 2, flex: 1, marginTop: 2 },
  stepDot:      { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  stepContent:  { flex: 1, paddingLeft: 14, paddingBottom: 16, justifyContent: 'center' },
  stepLabel:    { fontSize: 14 },
  stepTs:       { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  expiryRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  expiryTxt:    { fontSize: 12, color: Brand.warning, fontWeight: '600' },

  // Info card
  infoCard:   { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  infoLabel:  { fontSize: 13 },
  infoValue:  { fontSize: 13, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },

  // Actions
  actionsWrap: { marginHorizontal: 16, gap: 10 },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)',
    gap: 8,
  },
  bottomDisputeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  bottomDisputeTxt: { color: Brand.error, fontWeight: '700', fontSize: 13 },
  actRow:      { flexDirection: 'row', gap: 10 },
  actBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  actBtnFull:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14 },
  actBtnTxt:   { color: '#fff', fontWeight: '800', fontSize: 14 },
  terminalBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, borderWidth: 1 },
  terminalTxt:    { flex: 1, fontSize: 14, fontWeight: '600' },

  // Ledger toggle / card
  ledgerToggle:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 24, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1 },
  ledgerToggleTxt: { flex: 1, fontWeight: '700', fontSize: 13 },
  ledgerCard:      { marginHorizontal: 16, marginTop: 8, borderRadius: 18, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  ledgerRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  ledgerDot:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ledgerRef:       { fontSize: 12, color: '#374151', fontWeight: '600' },
  ledgerTs:        { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  ledgerAmt:       { fontWeight: '800', fontSize: 14 },
  ledgerEmpty:     { textAlign: 'center', paddingVertical: 12, fontSize: 13 },

  // Modals
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet:     { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, overflow: 'hidden', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 20 },
  modalTitle:     { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 6 },
  modalSub:       { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalLabel:     { alignSelf: 'flex-start', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalAmountBox: { width: '100%', borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  modalAmountTxt: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  modalInputRow:  { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  modalTextInput: { flex: 1, paddingVertical: 14, color: '#fff', fontSize: 15 },
  networkRow:     { flexDirection: 'row', gap: 8, marginBottom: 20, width: '100%' },
  networkBtn:     { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  networkTxt:     { fontWeight: '700', color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  modalPrimBtn:   { width: '100%', flexDirection: 'row', backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalPrimBtnTxt:{ color: '#fff', fontWeight: '800', fontSize: 15 },
  modalCancelBtn: { paddingVertical: 10 },
  modalCancelTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  pinInput:       { width: '100%', textAlign: 'center', fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18, paddingVertical: 20, marginBottom: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
});
