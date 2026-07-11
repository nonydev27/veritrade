import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuth from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { Brand, Currency } from '@/constants/theme';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { StatsSkeleton } from '@/components/LoadingSkeleton';
import { ScreenBackground } from '@/components/ScreenBackground';
import TooltipOverlay from '@/components/tooltip-overlay';
import { SPACING, tabBarBottomInset } from '@/constants/layout';

const STATUS_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  PENDING: 'time-outline',
  ACCEPTED: 'checkmark-outline',
  FUNDED: 'card-outline',
  PAID: 'card-outline',
  SHIPPED: 'airplane-outline',
  COMPLETED: 'checkmark-circle-outline',
  DISPUTED: 'warning-outline',
  CANCELLED: 'close-circle-outline',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { transactions, stats, loading, refresh } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const recent = transactions.slice(0, 3);
  const bottomPad = tabBarBottomInset(insets.bottom);

  useEffect(() => {
    AsyncStorage.getItem('tooltipSeen').then((seen) => {
      if (!seen) setShowTooltip(true);
    });
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleTooltipDone() {
    await AsyncStorage.setItem('tooltipSeen', 'true');
    setShowTooltip(false);
  }

  const actions = [
    { icon: 'lock-closed-outline' as const, label: 'New Escrow', color: Brand.primary, onPress: () => router.push('/(tabs)/create-escrow') },
    { icon: 'receipt-outline' as const, label: 'My Trades', color: Brand.accent, onPress: () => router.push('/(tabs)/transactions') },
    { icon: 'hardware-chip-outline' as const, label: 'VeriBot', color: '#8B5CF6', onPress: () => router.push('/(tabs)/bot') },
    { icon: 'keypad-outline' as const, label: 'USSD Info', color: Brand.success, onPress: () => router.push('/(tabs)/explore') },
  ];

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" />
      <TooltipOverlay visible={showTooltip} onDone={handleTooltipDone} />

      <LinearGradient colors={[Brand.primaryDark, Brand.primary, 'transparent']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Trader'} 👋</Text>
            <Text style={styles.greetingSub}>Your trades are secured</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
            <Text style={styles.avatarTxt}>{(user?.name?.[0] || 'V').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primaryLight} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <StatsSkeleton />
        ) : (
          <View style={styles.statsRow}>
            {[
              { label: 'Total', value: stats.total, icon: 'bar-chart-outline' as const, color: Brand.primaryLight },
              { label: 'Active', value: stats.active, icon: 'time-outline' as const, color: Brand.warning },
              { label: 'Done', value: stats.completed, icon: 'checkmark-done-outline' as const, color: Brand.success },
            ].map((s) => (
              <GlassCard key={s.label} tint="dark" style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: s.color + '22' }]}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </GlassCard>
            ))}
          </View>
        )}

        <Text style={styles.section}>Quick Actions</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsScroll}
        >
          {actions.map((a) => (
            <TouchableOpacity key={a.label} onPress={a.onPress} activeOpacity={0.85}>
              <GlassCard tint="dark" style={styles.actionCard}>
                <View style={[styles.actionIconWrap, { backgroundColor: a.color + '22' }]}>
                  <Ionicons name={a.icon} size={22} color={a.color} />
                </View>
                <Text style={[styles.actionTxt, { color: a.color }]}>{a.label}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionRow}>
          <Text style={[styles.section, { marginTop: 0 }]}>Recent Trades</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <GlassCard tint="dark" style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="file-tray-outline" size={36} color="rgba(255,255,255,0.4)" />
            </View>
            <Text style={styles.emptyTxt}>No transactions yet</Text>
            <Text style={styles.emptyHint}>Create your first escrow to get started</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/create-escrow')}>
              <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.emptyBtnTxt}>Create Escrow</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          recent.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/transaction/${tx.transaction_code}`)}
            >
              <GlassCard tint="dark" style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={styles.txIconWrap}>
                    <Ionicons name={STATUS_ICON[tx.status] || 'ellipse-outline'} size={20} color={Brand.primaryLight} />
                  </View>
                  <View style={styles.txLeft}>
                    <Text style={styles.txItem} numberOfLines={1}>{tx.item_description}</Text>
                    <Text style={styles.txCode}>#{tx.transaction_code}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>{Currency.symbol}{Number(tx.amount).toLocaleString('en-GH')}</Text>
                    <StatusBadge status={tx.status} />
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 48, paddingHorizontal: SPACING.lg },
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
    flexDirection: 'row', gap: 10, paddingHorizontal: SPACING.lg,
    marginTop: -28, marginBottom: 8, zIndex: 2,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  section: { fontWeight: '700', fontSize: 16, paddingHorizontal: SPACING.lg, marginTop: 20, marginBottom: 12, color: '#fff' },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, marginTop: 20, marginBottom: 12,
  },
  seeAll: { color: Brand.primaryLight, fontWeight: '600', fontSize: 13 },
  actionsScroll: { paddingHorizontal: SPACING.lg, gap: 10 },
  actionCard: { width: 108, alignItems: 'center', paddingVertical: 16, gap: 8 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionTxt: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  emptyCard: { marginHorizontal: SPACING.lg, alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  emptyHint: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 },
  emptyBtn: {
    flexDirection: 'row', backgroundColor: Brand.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24,
    alignItems: 'center',
  },
  emptyBtnTxt: { color: '#fff', fontWeight: '700' },
  txCard: { marginHorizontal: SPACING.lg, marginBottom: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(26,86,219,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  txLeft: { flex: 1 },
  txItem: { fontWeight: '600', fontSize: 14, color: '#fff' },
  txCode: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontWeight: '800', fontSize: 15, color: '#fff' },
});
