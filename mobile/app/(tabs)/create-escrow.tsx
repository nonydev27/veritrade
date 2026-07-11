import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Modal, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';
import { Brand, Currency } from '@/constants/theme';
import { KeyboardAwareView } from '@/components/KeyboardAwareView';
import { GlassCard } from '@/components/GlassCard';
import { GlassInput } from '@/components/GlassInput';
import { GlassButton } from '@/components/GlassButton';
import { ScreenBackground } from '@/components/ScreenBackground';
import { isGhanaPhone, formatGhanaPhone } from '@/utils/validation';
import { SPACING, tabBarBottomInset } from '@/constants/layout';

const STEPS = [
  { icon: 'create-outline' as const, txt: 'Fill in item, amount & seller phone' },
  { icon: 'share-outline' as const, txt: 'Share the code with your seller' },
  { icon: 'card-outline' as const, txt: 'Pay to lock funds in escrow' },
  { icon: 'checkmark-done-outline' as const, txt: 'Confirm delivery to release funds' },
];

export default function CreateEscrow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [seller, setSeller] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [touched, setTouched] = useState({ item: false, amount: false, seller: false });

  const amountNum = parseFloat(amount);
  const amountValid = !isNaN(amountNum) && amountNum > 0;
  const sellerValid = isGhanaPhone(seller.replace(/\s/g, ''));
  const itemValid = item.trim().length >= 3;
  const canSubmit = itemValid && amountValid && sellerValid;
  const bottomInset = tabBarBottomInset(insets.bottom);

  function validateField(field: 'item' | 'amount' | 'seller') {
    setTouched((p) => ({ ...p, [field]: true }));
  }

  async function onCreate() {
    if (!canSubmit) {
      setError('Please fix the highlighted fields');
      setTouched({ item: true, amount: true, seller: true });
      return;
    }
    setConfirmOpen(false);
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/escrow/create', {
        item: item.trim(),
        amount: amountNum,
        seller_phone: seller.replace(/\s/g, ''),
      });
      setSuccess(res.data.transactionCode);
      setItem('');
      setAmount('');
      setSeller('');
      setTouched({ item: false, amount: false, seller: false });
    } catch {
      setError('Could not create escrow. Check seller phone is registered.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Brand.accentDark, Brand.accent, 'transparent']} style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="lock-closed" size={28} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>New Escrow</Text>
        <Text style={styles.headerSub}>Lock funds until delivery is confirmed</Text>
      </LinearGradient>

      <KeyboardAwareView
        bottomInset={bottomInset}
        contentContainerStyle={styles.scroll}
      >
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={15} color={Brand.error} />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <GlassCard tint="dark" style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={52} color={Brand.success} />
            <Text style={styles.successTitle}>Escrow Created!</Text>
            <Text style={styles.successLabel}>Transaction Code</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeTxt}>{success}</Text>
            </View>
            <Text style={styles.successHint}>Share this code with your seller to start the trade.</Text>
            <GlassButton
              label="Back to Home"
              icon="home-outline"
              onPress={() => { setSuccess(''); router.push('/(tabs)'); }}
            />
          </GlassCard>
        ) : (
          <>
            <GlassCard tint="dark" style={styles.stepsCard}>
              <View style={styles.stepsHeader}>
                <Ionicons name="information-circle-outline" size={18} color={Brand.primaryLight} />
                <Text style={styles.stepsTitle}>How it works</Text>
              </View>
              {STEPS.map((s, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumTxt}>{i + 1}</Text>
                  </View>
                  <View style={styles.stepIconWrap}>
                    <Ionicons name={s.icon} size={16} color="#fff" />
                  </View>
                  <Text style={styles.stepTxt}>{s.txt}</Text>
                </View>
              ))}
            </GlassCard>

            <GlassCard tint="dark" style={styles.formCard}>
              <Text style={styles.formTitle}>Escrow Details</Text>

              <Text style={styles.label}>Item / Service</Text>
              <GlassInput
                icon="cube-outline"
                placeholder="e.g. iPhone 15, Laptop repair..."
                value={item}
                onChangeText={setItem}
                onBlur={() => validateField('item')}
                error={touched.item && !itemValid}
              />

              <Text style={styles.label}>Amount ({Currency.code})</Text>
              <GlassInput
                prefix={Currency.symbol}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                onBlur={() => validateField('amount')}
                error={touched.amount && !amountValid}
              />

              <Text style={styles.label}>Seller's Phone</Text>
              <GlassInput
                icon="call-outline"
                placeholder="024 XXX XXXX"
                keyboardType="phone-pad"
                value={seller}
                onChangeText={(t) => setSeller(formatGhanaPhone(t))}
                onBlur={() => validateField('seller')}
                maxLength={12}
                error={touched.seller && !sellerValid}
              />

              <GlassButton
                label="Lock Funds in Escrow"
                icon="lock-closed"
                onPress={() => setConfirmOpen(true)}
                loading={loading}
                disabled={!canSubmit}
                style={{ marginTop: 4 }}
              />
            </GlassCard>
          </>
        )}
      </KeyboardAwareView>

      <Modal visible={confirmOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard tint="dark" style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Confirm Escrow</Text>
            <Text style={styles.modalSub}>Review before creating</Text>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Item</Text>
              <Text style={styles.confirmVal}>{item}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount</Text>
              <Text style={styles.confirmVal}>{Currency.symbol}{amountNum.toLocaleString('en-GH')}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Seller</Text>
              <Text style={styles.confirmVal}>{seller}</Text>
            </View>
            <GlassButton label="Confirm & Create" onPress={onCreate} loading={loading} />
            <TouchableOpacity onPress={() => setConfirmOpen(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelTxt}>Go back</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.8)', marginTop: 4, fontSize: 13 },
  scroll: { paddingTop: SPACING.sm },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  errorTxt: { color: Brand.error, fontSize: 13, flex: 1 },
  successCard: { alignItems: 'center', marginTop: 12, borderColor: 'rgba(34,197,94,0.3)', gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 8 },
  successLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  codeBox: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginVertical: 8,
  },
  codeTxt: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  successHint: { color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 8, fontSize: 13 },
  stepsCard: { marginBottom: SPACING.md },
  stepsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  stepsTitle: { fontWeight: '700', fontSize: 15, color: '#fff' },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  stepNumTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stepIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  stepTxt: { fontSize: 13, flex: 1, color: 'rgba(255,255,255,0.75)' },
  formCard: { marginBottom: SPACING.md },
  formTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 16 },
  label: { fontWeight: '600', fontSize: 13, marginBottom: 6, color: 'rgba(255,255,255,0.6)' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  modalSub: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 16, fontSize: 13 },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  confirmLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  confirmVal: { color: '#fff', fontWeight: '700', fontSize: 14, maxWidth: '60%', textAlign: 'right' },
  modalCancel: { alignItems: 'center', paddingVertical: 12 },
  modalCancelTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});
