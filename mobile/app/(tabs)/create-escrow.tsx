import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { Brand, Colors, Currency } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CreateEscrow() {
  const router = useRouter();
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [seller, setSeller] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function onCreate() {
    if (!item || !amount || !seller) { setError('All fields are required'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/escrow/create', { item, amount: parseFloat(amount), seller_phone: seller });
      setSuccess(res.data.transactionCode);
      setItem(''); setAmount(''); setSeller('');
    } catch {
      setError('Could not create escrow. Check seller phone.');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Brand.accentDark, Brand.accent]} style={styles.header}>
        <Ionicons name="lock-closed" size={28} color="#fff" style={{ marginBottom: 8 }} />
        <Text style={styles.headerTitle}>New Escrow</Text>
        <Text style={styles.headerSub}>Lock funds until delivery is confirmed</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={15} color={Brand.error} />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <BlurView intensity={30} tint="light" style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={52} color={Brand.success} />
            </View>
            <Text style={styles.successTitle}>Escrow Created!</Text>
            <Text style={styles.successLabel}>Transaction Code</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeTxt}>{success}</Text>
            </View>
            <Text style={styles.successHint}>Share this code with your seller to start the trade.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => { setSuccess(''); router.push('/(tabs)'); }}>
              <Ionicons name="home-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.doneBtnTxt}>Back to Home</Text>
            </TouchableOpacity>
          </BlurView>
        ) : (
          <>
            {/* Steps card */}
            <BlurView intensity={30} tint="light" style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>How it works</Text>
              {[
                { icon: 'create-outline' as const, txt: 'Fill in item, amount & seller phone' },
                { icon: 'share-outline' as const, txt: 'Share the code with your seller' },
                { icon: 'card-outline' as const, txt: 'Pay to lock funds in escrow' },
                { icon: 'checkmark-done-outline' as const, txt: 'Confirm delivery to release funds' },
              ].map((s, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{i + 1}</Text></View>
                  <Ionicons name={s.icon} size={16} color={Brand.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.stepTxt, { color: c.subtext }]}>{s.txt}</Text>
                </View>
              ))}
            </BlurView>

            {/* Item */}
            <Text style={[styles.label, { color: c.text }]}>Item / Service</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.card, borderColor: c.border }]}>
              <Ionicons name="cube-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                placeholder="e.g. iPhone 15, Laptop repair..."
                placeholderTextColor="#9CA3AF"
                value={item} onChangeText={setItem}
              />
            </View>

            {/* Amount */}
            <Text style={[styles.label, { color: c.text }]}>Amount ({Currency.code})</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={styles.currencySymbol}>{Currency.symbol}</Text>
              <TextInput
                style={[styles.input, { flex: 1, color: c.text }]}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={amount} onChangeText={setAmount}
              />
            </View>

            {/* Seller phone */}
            <Text style={[styles.label, { color: c.text }]}>Seller's Phone Number</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.card, borderColor: c.border }]}>
              <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                placeholder="0XX XXX XXXX"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={seller} onChangeText={setSeller}
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={onCreate} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnTxt}>Lock Funds in Escrow</Text>
                  </>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.8)', marginTop: 4, fontSize: 13 },
  body: { padding: 20, paddingBottom: 40 },
  errorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 10, borderRadius: 10, marginBottom: 12, gap: 6 },
  errorTxt: { color: Brand.error, fontSize: 13, flex: 1 },
  successCard: { borderRadius: 24, padding: 28, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', marginTop: 12 },
  successIconWrap: { marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '800', color: Brand.black, marginBottom: 16 },
  successLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  codeBox: { backgroundColor: Brand.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, marginVertical: 8 },
  codeTxt: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  successHint: { color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 20, fontSize: 13 },
  doneBtn: { flexDirection: 'row', backgroundColor: Brand.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 24, alignItems: 'center' },
  doneBtnTxt: { color: '#fff', fontWeight: '700' },
  stepsCard: { borderRadius: 18, padding: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  stepsTitle: { fontWeight: '700', fontSize: 13, color: Brand.primary, marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  stepNumTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stepTxt: { fontSize: 13, flex: 1 },
  label: { fontWeight: '600', fontSize: 13, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, marginBottom: 16 },
  inputIcon: { marginRight: 8 },
  currencySymbol: { fontWeight: '800', color: Brand.primary, fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  btn: { flexDirection: 'row', backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
