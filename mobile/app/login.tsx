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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#060C1A" />

      {/* Rich background gradient */}
      <LinearGradient
        colors={['#060C1A', '#0D1A3A', '#060C1A']}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow blobs */}
      <View style={styles.blobBlue} />
      <View style={styles.blobOrange} />

      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <LinearGradient colors={['#1A56DB', '#0E3A9F']} style={styles.shieldWrap}>
            <Ionicons name="shield-checkmark" size={36} color="#fff" />
            {/* Orange dot accent */}
            <View style={styles.shieldDot} />
          </LinearGradient>
          <Text style={styles.logoTxt}>
            Veri<Text style={styles.logoAccent}>Trade</Text>
          </Text>
          <Text style={styles.logoSub}>Ghana's Secure Escrow Platform</Text>
        </View>

        {/* Glass card — dark tint so background colours show through boldly */}
        <BlurView intensity={60} tint="dark" style={styles.card}>
          {/* Top accent line */}
          <LinearGradient
            colors={['#1A56DB', '#F97316']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.cardAccentLine}
          />

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue</Text>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={15} color="#F97316" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* Phone */}
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color="#3B82F6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0XX XXX XXXX"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#3B82F6" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry={!show}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShow(!show)} hitSlop={8}>
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <TouchableOpacity onPress={onLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1A56DB', '#2563EB']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnTxt}>Sign In</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.link} onPress={() => router.push('/register')}>
            <Text style={styles.linkTxt}>No account? </Text>
            <Text style={styles.linkBold}>Create one →</Text>
          </TouchableOpacity>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060C1A' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },

  // Glow blobs
  blobBlue: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#1A56DB', opacity: 0.18, top: -60, left: -80,
  },
  blobOrange: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#F97316', opacity: 0.12, bottom: 80, right: -50,
  },

  // Logo
  logoArea: { alignItems: 'center', marginBottom: 36 },
  shieldWrap: {
    width: 80, height: 80, borderRadius: 26, alignItems: 'center',
    justifyContent: 'center', marginBottom: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  shieldDot: {
    position: 'absolute', top: 14, right: 14,
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#F97316',
  },
  logoTxt: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  logoAccent: { color: '#F97316' },
  logoSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 5, letterSpacing: 1 },

  // Card
  card: {
    borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 26, paddingBottom: 28,
  },
  cardAccentLine: { height: 3, marginBottom: 24, borderRadius: 2 },
  heading: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  sub: { color: 'rgba(255,255,255,0.45)', marginTop: 3, marginBottom: 22, fontSize: 14 },

  errorRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)',
    padding: 10, borderRadius: 10, marginBottom: 14, gap: 6,
  },
  errorTxt: { color: '#F97316', fontSize: 13, flex: 1 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14, marginBottom: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#FFFFFF' },

  btn: {
    flexDirection: 'row', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#1A56DB', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },

  link: { flexDirection: 'row', justifyContent: 'center' },
  linkTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  linkBold: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
});
