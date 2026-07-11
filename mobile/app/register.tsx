import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuth from '@/hooks/useAuth';
import { Brand } from '@/constants/theme';
import { KeyboardAwareView } from '@/components/KeyboardAwareView';
import { GlassCard } from '@/components/GlassCard';
import { GlassInput } from '@/components/GlassInput';
import { GlassButton } from '@/components/GlassButton';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  isGhanaPhone, formatGhanaPhone, getPasswordStrength, STRENGTH_META,
} from '@/utils/validation';
import { SPACING } from '@/constants/layout';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ phone: false, password: false });

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthMeta = STRENGTH_META[strength];
  const phoneValid = isGhanaPhone(phone.replace(/\s/g, ''));
  const phoneError = touched.phone && phone.length > 0 && !phoneValid;

  async function onRegister() {
    if (!name.trim()) { setError('Enter your full name'); return; }
    if (!phoneValid) { setError('Enter a valid Ghana phone (e.g. 0241234567)'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), phone.replace(/\s/g, ''), password, role);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAwareView contentContainerStyle={styles.keyboardContent}>
          <View style={styles.logoArea}>
            <LinearGradient colors={['#1A56DB', '#7C3AED']} style={styles.logoIcon}>
              <Ionicons name="person-add" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoTxt}>Create Account</Text>
            <Text style={styles.logoSub}>Join VeriTrade — Ghana's trusted escrow</Text>
          </View>

          <GlassCard tint="dark" style={styles.card}>
            <LinearGradient
              colors={['#7C3AED', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardAccentLine}
            />

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={15} color="#F97316" />
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            ) : null}

            <GlassInput
              icon="person-outline"
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <GlassInput
              icon="call-outline"
              placeholder="024 XXX XXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => setPhone(formatGhanaPhone(t))}
              onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
              maxLength={12}
              error={phoneError}
            />
            {phoneError ? <Text style={styles.fieldError}>Use Ghana format: 024XXXXXXX</Text> : null}

            <View style={styles.passwordRow}>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Min 6 characters"
                secureTextEntry={!show}
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                containerStyle={styles.passwordInput}
                error={touched.password && password.length > 0 && password.length < 6}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(!show)} hitSlop={8}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  <View style={[styles.strengthFill, { width: strengthMeta.width as `${number}%`, backgroundColor: strengthMeta.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strengthMeta.color }]}>{strengthMeta.label}</Text>
              </View>
            )}

            <Text style={styles.roleLabel}>I am a</Text>
            <View style={styles.roleRow}>
              {(['BUYER', 'SELLER'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                  onPress={() => setRole(r)}
                >
                  <Ionicons
                    name={r === 'BUYER' ? 'cart-outline' : 'cube-outline'}
                    size={20}
                    color={role === r ? '#fff' : 'rgba(255,255,255,0.5)'}
                  />
                  <Text style={[styles.roleTxt, role === r && styles.roleTxtActive]}>
                    {r === 'BUYER' ? 'Buyer' : 'Seller'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <GlassButton label="Create Account" icon="checkmark-circle-outline" onPress={onRegister} loading={loading} />

            <TouchableOpacity style={styles.link} onPress={() => router.push('/login')}>
              <Text style={styles.linkTxt}>Already have an account? </Text>
              <Text style={styles.linkBold}>Sign in</Text>
            </TouchableOpacity>
          </GlassCard>
        </KeyboardAwareView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoIcon: {
    width: 72, height: 72, borderRadius: 22, alignItems: 'center',
    justifyContent: 'center', marginBottom: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  logoTxt: { fontSize: 26, fontWeight: '900', color: '#fff' },
  logoSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 },
  card: { borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 22, paddingBottom: 24 },
  cardAccentLine: { height: 3, marginBottom: 20, borderRadius: 2, marginHorizontal: -22, marginTop: -16 },
  errorRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    padding: 10, borderRadius: 10, marginBottom: 14, gap: 6,
  },
  errorTxt: { color: Brand.error, fontSize: 13, flex: 1 },
  fieldError: { color: Brand.error, fontSize: 12, marginTop: -8, marginBottom: 10, marginLeft: 4 },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 14, top: 15, zIndex: 1 },
  strengthWrap: { marginBottom: 14, marginTop: -4 },
  strengthTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'right' },
  roleLabel: { fontWeight: '600', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14,
    paddingVertical: 13, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  roleBtnActive: { borderColor: Brand.primaryLight, backgroundColor: 'rgba(26,86,219,0.25)' },
  roleTxt: { fontWeight: '600', color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  roleTxtActive: { color: '#fff' },
  link: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  linkTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  linkBold: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
});
