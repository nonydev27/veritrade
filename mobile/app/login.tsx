import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuth from '@/hooks/useAuth';
import { KeyboardAwareView } from '@/components/KeyboardAwareView';
import { GlassCard } from '@/components/GlassCard';
import { GlassInput } from '@/components/GlassInput';
import { GlassButton } from '@/components/GlassButton';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SPACING } from '@/constants/layout';

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
    setError('');
    setLoading(true);
    try {
      await login(phone.replace(/\s/g, ''), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Invalid phone or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor="#060C1A" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAwareView centerContent contentContainerStyle={styles.keyboardContent}>
          <View style={styles.logoArea}>
            <LinearGradient colors={['#1A56DB', '#0E3A9F']} style={styles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={36} color="#fff" />
              <View style={styles.shieldDot} />
            </LinearGradient>
            <Text style={styles.logoTxt}>
              Veri<Text style={styles.logoAccent}>Trade</Text>
            </Text>
            <Text style={styles.logoSub}>Ghana's Secure Escrow Platform</Text>
          </View>

          <GlassCard tint="dark" style={styles.card}>
            <LinearGradient
              colors={['#1A56DB', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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

            <GlassInput
              icon="call-outline"
              placeholder="024 XXX XXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              error={!!error && !phone}
            />

            <View style={styles.passwordRow}>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Password"
                secureTextEntry={!show}
                value={password}
                onChangeText={setPassword}
                containerStyle={styles.passwordInput}
                error={!!error && !password}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(!show)} hitSlop={8}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            <GlassButton label="Sign In" icon="log-in-outline" onPress={onLogin} loading={loading} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerTxt}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.link} onPress={() => router.push('/register')}>
              <Text style={styles.linkTxt}>No account? </Text>
              <Text style={styles.linkBold}>Create one →</Text>
            </TouchableOpacity>

            {__DEV__ ? (
              <View style={styles.devSection}>
                <Text style={styles.devLabel}>Dev quick login</Text>
                <TouchableOpacity
                  style={styles.devBtn}
                  onPress={() => { setPhone('0241234567'); setPassword('Test123!'); }}
                >
                  <Text style={styles.devBtnTxt}>Buyer · 0241234567</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.devBtn}
                  onPress={() => { setPhone('0249999999'); setPassword('Admin123!'); }}
                >
                  <Text style={styles.devBtnTxt}>Admin · 0249999999</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </GlassCard>
        </KeyboardAwareView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardContent: { paddingHorizontal: SPACING.lg },
  logoArea: { alignItems: 'center', marginBottom: 28 },
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
  card: { borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 22, paddingBottom: 24 },
  cardAccentLine: { height: 3, marginBottom: 20, borderRadius: 2, marginHorizontal: -22, marginTop: -16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  sub: { color: 'rgba(255,255,255,0.45)', marginTop: 3, marginBottom: 18, fontSize: 14 },
  errorRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)',
    padding: 10, borderRadius: 10, marginBottom: 14, gap: 6,
  },
  errorTxt: { color: '#F97316', fontSize: 13, flex: 1 },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 44, marginBottom: 14 },
  eyeBtn: { position: 'absolute', right: 14, top: 15, zIndex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  link: { flexDirection: 'row', justifyContent: 'center' },
  linkTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  linkBold: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
  devSection: { marginTop: 18, gap: 8 },
  devLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', letterSpacing: 0.5 },
  devBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  devBtnTxt: { color: 'rgba(255,255,255,0.55)', fontSize: 12, textAlign: 'center' },
});
