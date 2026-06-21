import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import { Brand } from '@/constants/theme';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onRegister() {
    if (!name || !phone || !password) { setError('Fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await register(name, phone, password, role);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.logo}>🔒 VeriTrade</Text>
        <Text style={styles.tagline}>Create your account</Text>
      </View>

      <ScrollView style={styles.card} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.heading}>Get started</Text>
        <Text style={styles.sub}>Join thousands trading safely</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="+254 700 000 000" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Min 6 characters" placeholderTextColor="#9CA3AF" secureTextEntry value={password} onChangeText={setPassword} />

        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          {(['BUYER', 'SELLER'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleTxt, role === r && styles.roleTxtActive]}>
                {r === 'BUYER' ? '🛒 Buyer' : '📦 Seller'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={onRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.push('/login')}>
          <Text style={styles.linkTxt}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.primaryDark },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  logo: { fontSize: 26, fontWeight: '800', color: '#fff' },
  tagline: { color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 13 },
  card: { flex: 1, backgroundColor: '#F1F5FF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingTop: 32 },
  heading: { fontSize: 24, fontWeight: '800', color: Brand.black },
  sub: { color: '#6B7280', marginTop: 4, marginBottom: 24 },
  error: { color: Brand.error, backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 6, fontSize: 13 },
  input: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, color: Brand.black, backgroundColor: '#fff', marginBottom: 16 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  roleBtnActive: { borderColor: Brand.primary, backgroundColor: '#EEF2FF' },
  roleTxt: { fontWeight: '600', color: '#6B7280', fontSize: 15 },
  roleTxtActive: { color: Brand.primary },
  btn: { backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { alignItems: 'center', marginTop: 20 },
  linkTxt: { color: '#6B7280', fontSize: 14 },
  linkBold: { color: Brand.primary, fontWeight: '700' },
});
