import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  const [show, setShow] = useState(false);
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
    } finally { setLoading(false); }
  }

  return (
    <LinearGradient colors={[Brand.primaryDark, '#1E40AF', Brand.primary]} style={styles.root}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          <View style={styles.logoArea}>
            <BlurView intensity={25} tint="light" style={styles.logoIcon}>
              <Ionicons name="person-add" size={36} color="#fff" />
            </BlurView>
            <Text style={styles.logoTxt}>Create Account</Text>
            <Text style={styles.logoSub}>Join VeriTrade — Ghana's trusted escrow</Text>
          </View>

          <BlurView intensity={28} tint="light" style={styles.card}>
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={15} color={Brand.error} />
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            ) : null}

            {/* Name */}
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
            </View>

            {/* Phone */}
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="0XX XXX XXXX" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min 6 characters" placeholderTextColor="#9CA3AF" secureTextEntry={!show} value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShow(!show)}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Role picker */}
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
                    color={role === r ? Brand.primary : '#9CA3AF'}
                  />
                  <Text style={[styles.roleTxt, role === r && styles.roleTxtActive]}>
                    {r === 'BUYER' ? 'Buyer' : 'Seller'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.btn} onPress={onRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnTxt}>Create Account</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.link} onPress={() => router.push('/login')}>
              <Text style={styles.linkTxt}>Already have an account? </Text>
              <Text style={styles.linkBold}>Sign in</Text>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoIcon: {
    width: 72, height: 72, borderRadius: 22, alignItems: 'center',
    justifyContent: 'center', marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoTxt: { fontSize: 26, fontWeight: '900', color: '#fff' },
  logoSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 },
  card: {
    borderRadius: 28, padding: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 10, borderRadius: 10, marginBottom: 12, gap: 6 },
  errorTxt: { color: Brand.error, fontSize: 13, flex: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)', borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 12, marginBottom: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: Brand.black },
  roleLabel: { fontWeight: '600', color: '#374151', fontSize: 13, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 14,
    paddingVertical: 13, backgroundColor: 'rgba(255,255,255,0.6)',
  },
  roleBtnActive: { borderColor: Brand.primary, backgroundColor: '#EEF2FF' },
  roleTxt: { fontWeight: '600', color: '#9CA3AF', fontSize: 14 },
  roleTxtActive: { color: Brand.primary },
  btn: {
    flexDirection: 'row', backgroundColor: Brand.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  linkTxt: { color: '#6B7280', fontSize: 14 },
  linkBold: { color: Brand.primary, fontWeight: '700', fontSize: 14 },
});
