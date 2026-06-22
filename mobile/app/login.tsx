import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import { Brand } from '@/constants/theme';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
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
    } finally { setLoading(false); }
  }

  return (
    <LinearGradient colors={[Brand.primaryDark, Brand.primary, '#2563EB']} style={styles.root}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Logo area */}
        <View style={styles.logoArea}>
          <BlurView intensity={25} tint="light" style={styles.logoIcon}>
            <Ionicons name="shield-checkmark" size={40} color="#fff" />
          </BlurView>
          <Text style={styles.logoTxt}>VeriTrade</Text>
          <Text style={styles.logoSub}>Ghana's Secure Escrow Platform</Text>
        </View>

        {/* Glass card */}
        <BlurView intensity={28} tint="light" style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue</Text>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={15} color={Brand.error} />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* Phone */}
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0XX XXX XXXX"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!show}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShow(!show)} style={{ paddingHorizontal: 4 }}>
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={onLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.btnTxt}>Sign In</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.push('/register')}>
            <Text style={styles.linkTxt}>No account? </Text>
            <Text style={styles.linkBold}>Create one</Text>
          </TouchableOpacity>
        </BlurView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoIcon: {
    width: 76, height: 76, borderRadius: 24, alignItems: 'center',
    justifyContent: 'center', marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoTxt: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  logoSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 },
  card: {
    borderRadius: 28, padding: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  heading: { fontSize: 22, fontWeight: '800', color: Brand.black },
  sub: { color: '#6B7280', marginTop: 2, marginBottom: 20, fontSize: 14 },
  errorRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2',
    padding: 10, borderRadius: 10, marginBottom: 12, gap: 6,
  },
  errorTxt: { color: Brand.error, fontSize: 13, flex: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Brand.black },
  btn: {
    flexDirection: 'row', backgroundColor: Brand.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  linkTxt: { color: '#6B7280', fontSize: 14 },
  linkBold: { color: Brand.primary, fontWeight: '700', fontSize: 14 },
});
