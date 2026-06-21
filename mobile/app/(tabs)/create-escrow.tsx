import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { Brand, Colors } from '@/constants/theme';
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
      setSuccess(`Transaction created!\nCode: ${res.data.transactionCode}`);
      setItem(''); setAmount(''); setSeller('');
    } catch {
      setError('Could not create escrow. Check the seller phone.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Escrow</Text>
        <Text style={styles.headerSub}>Lock funds until delivery is confirmed</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {success ? (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTxt}>{success}</Text>
            <Text style={styles.successHint}>Share this code with your seller to start the trade.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => { setSuccess(''); router.push('/(tabs)'); }}>
              <Text style={styles.doneBtnTxt}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* How it works */}
            <View style={[styles.infoCard, { backgroundColor: c.card }]}>
              <Text style={styles.infoTitle}>How it works</Text>
              {['Create escrow with item & amount', 'Share code with seller', 'Pay to lock funds', 'Confirm delivery to release'].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{i + 1}</Text></View>
                  <Text style={[styles.stepTxt, { color: c.subtext }]}>{step}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.label, { color: c.text }]}>Item / Service Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
              placeholder="e.g. iPhone 13 Pro 128GB"
              placeholderTextColor="#9CA3AF"
              value={item}
              onChangeText={setItem}
            />

            <Text style={[styles.label, { color: c.text }]}>Amount (KES)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>KES</Text>
              <TextInput
                style={[styles.input, styles.amountInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <Text style={[styles.label, { color: c.text }]}>Seller's Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
              placeholder="+254 700 000 000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={seller}
              onChangeText={setSeller}
            />

            <TouchableOpacity style={styles.btn} onPress={onCreate} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>🔒 Lock Funds in Escrow</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: Brand.accent, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.8)', marginTop: 4, fontSize: 13 },
  body: { padding: 20, paddingBottom: 40 },
  error: { color: Brand.error, backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  successCard: { alignItems: 'center', padding: 28, borderRadius: 20, backgroundColor: '#F0FDF4', marginTop: 20 },
  successEmoji: { fontSize: 52, marginBottom: 12 },
  successTxt: { fontSize: 16, fontWeight: '700', textAlign: 'center', color: Brand.black },
  successHint: { color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  doneBtn: { backgroundColor: Brand.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24 },
  doneBtnTxt: { color: '#fff', fontWeight: '700' },
  infoCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  infoTitle: { fontWeight: '700', fontSize: 14, color: Brand.primary, marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stepTxt: { fontSize: 13, flex: 1 },
  label: { fontWeight: '600', fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  currency: { fontWeight: '700', color: Brand.primary, fontSize: 15, marginRight: 8, marginBottom: 16 },
  amountInput: { flex: 1 },
  btn: { backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
