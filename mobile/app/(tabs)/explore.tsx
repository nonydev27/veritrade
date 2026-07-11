import { Brand } from '@/constants/theme';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/GlassCard';
import { GlassInput } from '@/components/GlassInput';
import { GlassButton } from '@/components/GlassButton';
import { KeyboardAwareView } from '@/components/KeyboardAwareView';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SPACING, tabBarBottomInset } from '@/constants/layout';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const FLOWS: { num: string; label: string; desc: string; icon: IoniconName }[] = [
  { num: '1', icon: 'lock-closed-outline', label: 'Create Escrow', desc: 'Start a new trade' },
  { num: '2', icon: 'card-outline', label: 'Pay', desc: 'Fund a transaction' },
  { num: '3', icon: 'checkmark-circle-outline', label: 'Confirm', desc: 'Confirm delivery' },
  { num: '4', icon: 'search-outline', label: 'Check Status', desc: 'Look up a transaction' },
  { num: '5', icon: 'warning-outline', label: 'Dispute', desc: 'Raise a dispute' },
  { num: '6', icon: 'close-circle-outline', label: 'Cancel', desc: 'Cancel a pending trade' },
];

export default function Explore() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ from: 'you' | 'server'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomPad = tabBarBottomInset(insets.bottom);

  async function send(text: string) {
    if (!phone) return;
    setMessages((m) => [...m, { from: 'you', text: text || '(dial)' }]);
    setLoading(true);
    try {
      const res = await api.post('/ussd', { phone, text });
      setMessages((m) => [...m, { from: 'server', text: res.data.response }]);
    } catch {
      setMessages((m) => [...m, { from: 'server', text: 'Could not connect to server' }]);
    }
    setInput('');
    setLoading(false);
  }

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Brand.primaryDark, Brand.primary, 'transparent']} style={styles.header}>
        <Ionicons name="keypad-outline" size={28} color="rgba(255,255,255,0.7)" style={{ marginBottom: 6 }} />
        <Text style={styles.headerTitle}>USSD Service</Text>
        <Text style={styles.headerSub}>Trade on any phone — no internet needed</Text>
      </LinearGradient>

      <KeyboardAwareView bottomInset={bottomPad} contentContainerStyle={styles.scroll}>
        <GlassCard tint="dark" style={styles.dialCard}>
          <View style={styles.dialRow}>
            <Ionicons name="phone-portrait-outline" size={22} color={Brand.primaryLight} />
            <Text style={styles.dialLabel}>Real Dial Code (Ghana)</Text>
          </View>
          <LinearGradient colors={[Brand.primaryDark, Brand.primary]} style={styles.dialBox}>
            <Text style={styles.dialCode}>*384*1#</Text>
          </LinearGradient>
          <Text style={styles.dialNote}>
            Works on Vodafone, MTN, AirtelTigo — any Ghanaian SIM. No smartphone required.
          </Text>
        </GlassCard>

        <Text style={styles.section}>Menu Options</Text>
        <View style={styles.grid}>
          {FLOWS.map((f) => (
            <GlassCard key={f.num} tint="dark" style={styles.gridItem}>
              <View style={styles.gridNum}>
                <Text style={styles.gridNumTxt}>{f.num}</Text>
              </View>
              <Ionicons name={f.icon} size={18} color={Brand.primaryLight} style={{ marginBottom: 4 }} />
              <Text style={styles.gridLabel}>{f.label}</Text>
              <Text style={styles.gridDesc}>{f.desc}</Text>
            </GlassCard>
          ))}
        </View>

        <Text style={styles.section}>Live Simulator</Text>
        <GlassCard tint="dark" style={styles.simCard}>
          <Text style={styles.simLabel}>Your Phone Number</Text>
          <GlassInput
            icon="call-outline"
            placeholder="0XX XXX XXXX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          {messages.length > 0 && (
            <View style={styles.chat}>
              {messages.map((m, i) => (
                <View key={i} style={[styles.bubble, m.from === 'you' ? styles.bubbleYou : styles.bubbleServer]}>
                  <Text style={[styles.bubbleTxt, m.from === 'you' ? styles.bubbleTxtYou : styles.bubbleTxtServer]}>
                    {m.text}
                  </Text>
                </View>
              ))}
              {loading && <ActivityIndicator style={{ marginTop: 8 }} color={Brand.primaryLight} />}
            </View>
          )}

          {messages.length === 0 ? (
            <GlassButton label="Dial *384*1#" icon="play-circle-outline" onPress={() => send('')} disabled={!phone} />
          ) : (
            <View style={styles.sendRow}>
              <View style={{ flex: 1 }}>
                <GlassInput
                  placeholder="Type option number..."
                  value={input}
                  onChangeText={setInput}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <TouchableOpacity style={styles.sendBtn} onPress={() => send(input)} disabled={loading}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {messages.length > 0 && (
            <TouchableOpacity style={styles.resetBtn} onPress={() => { setMessages([]); setInput(''); }}>
              <Ionicons name="refresh-outline" size={14} color="rgba(255,255,255,0.45)" style={{ marginRight: 4 }} />
              <Text style={styles.resetTxt}>Reset Session</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      </KeyboardAwareView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: SPACING.lg, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 13 },
  scroll: { paddingTop: SPACING.sm },
  dialCard: { marginBottom: SPACING.md },
  dialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dialLabel: { fontWeight: '700', color: Brand.primaryLight },
  dialBox: { borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  dialCode: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  dialNote: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.55)' },
  section: { fontWeight: '700', fontSize: 16, marginBottom: 12, color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  gridItem: { width: '47%', alignItems: 'center', paddingVertical: 16 },
  gridNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Brand.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  gridNumTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },
  gridLabel: { fontWeight: '700', fontSize: 13, textAlign: 'center', color: '#fff' },
  gridDesc: { fontSize: 11, textAlign: 'center', marginTop: 2, color: 'rgba(255,255,255,0.45)' },
  simCard: { marginBottom: SPACING.md },
  simLabel: { fontWeight: '600', fontSize: 13, marginBottom: 8, color: 'rgba(255,255,255,0.7)' },
  chat: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 12, marginBottom: 12, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  bubble: { maxWidth: '85%', borderRadius: 14, padding: 10 },
  bubbleServer: { alignSelf: 'flex-start', backgroundColor: 'rgba(26,86,219,0.25)' },
  bubbleYou: { alignSelf: 'flex-end', backgroundColor: Brand.accent },
  bubbleTxt: { fontSize: 13, lineHeight: 19 },
  bubbleTxtServer: { color: '#fff' },
  bubbleTxtYou: { color: '#fff' },
  sendRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  sendBtn: {
    backgroundColor: Brand.primary, borderRadius: 14, width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  resetTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
});
