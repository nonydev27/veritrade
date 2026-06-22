import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View,
} from 'react-native';

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
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];
  const [phone, setPhone] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ from: 'you' | 'server'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

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
    setInput(''); setLoading(false);
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Brand.primaryDark, '#1E40AF']} style={styles.header}>
        <Ionicons name="keypad-outline" size={28} color="rgba(255,255,255,0.7)" style={{ marginBottom: 6 }} />
        <Text style={styles.headerTitle}>USSD Service</Text>
        <Text style={styles.headerSub}>Trade on any phone — no internet needed</Text>
      </LinearGradient>

      {/* Dial code card */}
      <BlurView intensity={30} tint="light" style={styles.dialCard}>
        <View style={styles.dialRow}>
          <Ionicons name="phone-portrait-outline" size={22} color={Brand.primary} />
          <Text style={styles.dialLabel}>Real Dial Code (Ghana)</Text>
        </View>
        <LinearGradient colors={[Brand.primaryDark, Brand.primary]} style={styles.dialBox}>
          <Text style={styles.dialCode}>*384*1#</Text>
        </LinearGradient>
        <Text style={[styles.dialNote, { color: c.subtext }]}>
          Works on Vodafone, MTN, AirtelTigo — any Ghanaian SIM. No smartphone required.
        </Text>
      </BlurView>

      {/* Menu options grid */}
      <Text style={[styles.section, { color: c.text }]}>Menu Options</Text>
      <View style={styles.grid}>
        {FLOWS.map((f) => (
          <BlurView key={f.num} intensity={28} tint="light" style={styles.gridItem}>
            <View style={styles.gridNum}>
              <Text style={styles.gridNumTxt}>{f.num}</Text>
            </View>
            <Ionicons name={f.icon} size={18} color={Brand.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.gridLabel, { color: c.text }]}>{f.label}</Text>
            <Text style={[styles.gridDesc, { color: c.subtext }]}>{f.desc}</Text>
          </BlurView>
        ))}
      </View>

      {/* Live simulator */}
      <Text style={[styles.section, { color: c.text }]}>Live Simulator</Text>
      <BlurView intensity={28} tint="light" style={styles.simCard}>
        <Text style={[styles.simLabel, { color: c.text }]}>Your Phone Number</Text>
        <View style={[styles.inputWrap, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="call-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="0XX XXX XXXX"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Chat bubbles */}
        {messages.length > 0 && (
          <View style={styles.chat}>
            {messages.map((m, i) => (
              <View key={i} style={[styles.bubble, m.from === 'you' ? styles.bubbleYou : styles.bubbleServer]}>
                <Text style={[styles.bubbleTxt, m.from === 'you' ? styles.bubbleTxtYou : styles.bubbleTxtServer]}>
                  {m.text}
                </Text>
              </View>
            ))}
            {loading && <ActivityIndicator style={{ marginTop: 8 }} color={Brand.primary} />}
          </View>
        )}

        {/* Start / send */}
        {messages.length === 0 ? (
          <TouchableOpacity style={[styles.startBtn, !phone && { opacity: 0.5 }]} onPress={() => send('')} disabled={!phone}>
            <Ionicons name="play-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.startBtnTxt}>Dial *384*1#</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sendRow}>
            <View style={[styles.sendInputWrap, { backgroundColor: c.card, borderColor: c.border }]}>
              <TextInput
                style={[styles.sendInput, { color: c.text }]}
                placeholder="Type option number..."
                placeholderTextColor="#9CA3AF"
                value={input}
                onChangeText={setInput}
              />
            </View>
            <TouchableOpacity style={styles.sendBtn} onPress={() => send(input)} disabled={loading}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {messages.length > 0 && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setMessages([]); setInput(''); }}>
            <Ionicons name="refresh-outline" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
            <Text style={styles.resetTxt}>Reset Session</Text>
          </TouchableOpacity>
        )}
      </BlurView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 13 },
  dialCard: { margin: 20, borderRadius: 20, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  dialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dialLabel: { fontWeight: '700', color: Brand.primary },
  dialBox: { borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  dialCode: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  dialNote: { fontSize: 13, lineHeight: 20 },
  section: { fontWeight: '700', fontSize: 16, paddingHorizontal: 20, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 8 },
  gridItem: {
    width: '47%', borderRadius: 16, padding: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center',
  },
  gridNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Brand.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gridNumTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },
  gridLabel: { fontWeight: '700', fontSize: 13, textAlign: 'center' },
  gridDesc: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  simCard: { margin: 20, borderRadius: 20, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  simLabel: { fontWeight: '600', fontSize: 13, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  chat: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 14, padding: 12, marginBottom: 12, gap: 8 },
  bubble: { maxWidth: '85%', borderRadius: 14, padding: 10 },
  bubbleServer: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF' },
  bubbleYou: { alignSelf: 'flex-end', backgroundColor: Brand.accent },
  bubbleTxt: { fontSize: 13, lineHeight: 19 },
  bubbleTxtServer: { color: Brand.black },
  bubbleTxtYou: { color: '#fff' },
  startBtn: { flexDirection: 'row', backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  startBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sendRow: { flexDirection: 'row', gap: 10 },
  sendInputWrap: { flex: 1, flexDirection: 'row', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12 },
  sendInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  sendBtn: { backgroundColor: Brand.primary, borderRadius: 12, width: 48, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  resetTxt: { color: '#9CA3AF', fontSize: 13 },
});
