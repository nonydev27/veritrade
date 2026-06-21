import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import { Brand } from '@/constants/theme';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onLogin() {
    if (!phone || !password) { setError('Fill in all fields'); return; }
    setError(''); setLoading(true);
    try {
      await login(phone, password);
      router.replace('/(tabs)');
    } catch {
      setError('Invalid phone or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header wave */}
      <View style={styles.header}>
        <Text style={styles.logo}>🔒 VeriTrade</Text>
        <Text style={styles.tagline}>Secure Escrow Platform</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to continue</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+254 700 000 000"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btn} onPress={onLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.push('/register')}>
          <Text style={styles.linkTxt}>Don't have an account? <Text style={styles.linkBold}>Create one</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.primary },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  logo: { fontSize: 28, fontWeight: '800', color: '#fff' },
  tagline: { color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 13 },
  card: {
    flex: 1, backgroundColor: '#F1F5FF', borderTopLeftRadius: 32,
    borderTopRightRadius: 32, padding: 28, paddingTop: 36,
  },
  heading: { fontSize: 24, fontWeight: '800', color: Brand.black },
  sub: { color: '#6B7280', marginTop: 4, marginBottom: 24 },
  error: { color: Brand.error, backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 6, fontSize: 13 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, fontSize: 15, color: Brand.black,
    backgroundColor: '#fff', marginBottom: 16,
  },
  btn: {
    backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { alignItems: 'center', marginTop: 20 },
  linkTxt: { color: '#6B7280', fontSize: 14 },
  linkBold: { color: Brand.primary, fontWeight: '700' },
});
