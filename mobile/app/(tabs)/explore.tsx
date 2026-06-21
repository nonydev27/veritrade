import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import api from '@/services/api';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const FLOWS = [
  { code: '1', label: 'Create Escrow', desc: 'Start a new trade' },
  { code: '2', label: 'Pay',           desc: 'Fund a transaction' },
  { code: '3', label: 'Confirm',       desc: 'Confirm delivery' },
  { code: '4', label: 'Check Status',  desc: 'Look up a transaction' },
  { code: '5', label: 'Dispute',       desc: 'Raise a dispute' },
  { code: '6', label: 'Cancel',        desc: 'Cancel a pending trade' },
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
    setMessages((m) => [...m, { from: 'you', text: text || '(empty)' }]);
    setLoading(true);
    try {
      const res = await api.post('/ussd', { phone, text });
      setMessages((m) => [...m, { from: 'server', text: res.data.response }]);
    } catch {
      setMessages((m) => [...m, { from: 'server', text: 'Error connecting to server' }]);
    }
    setInput('');
    setLoading(false);
  }

  function reset() { setMessages([]); setInput(''); }

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📱 USSD Simulator</Text>
        <Text style={styles.headerSub}>Test VeriTrade without a smartphone</Text>
      </View>

      {/* Info card */}
      <View style={[styles.infoCard, { backgroundColor: c.card }]}>
        <Text style={styles.infoTitle}>Real Dial Code</Text>
        <View style={styles.dialBox}>
          <Text style={styles.dialCode}>*384*1#</Text>
        </View>
        <Text style={[styles.infoBody, { color: c.subtext }]}>
          In production, users dial this code on any phone — smartphone or not — to access all escrow features without the app.
        </Text>
      </View>

      {/* Menu reference */}
      <Text style={[styles.section, { color: c.text }]}>Menu Options</Text>
      <View style={styles.menuGrid}>
        {FLOWS.map((f) => (
          <View key={f.code} style={[styles.menuItem, { backgroundColor: c.card }]}>
            <View style={styles.menuNum}><Text style={styles.menuNumTxt}>{f.code}</Text></View>
            <View>
              <Text style={[styles.menuLabel, { color: c.text }]}>{f.label}</Text>
              <Text style={[styles.menuDesc, { color: c.subtext }]}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Simulator */}
      <Text style={[styles.section, { color: c.text }]}>Live Simulator</Text>
      <View style={[styles.simCard, { backgroundColor: c.card }]}>
        <Text style={styles.simLabel}>Your Phone Number</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text }]}
          placeholder="+254 700 000 000"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* Chat messages */}
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
          <TouchableOpacity style={styles.startBtn} onPress={() => send('')} disabled={!phone}>
            <Text style={styles.startBtnTxt}>▶ Start Session (dial *384*1#)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sendRow}>
            <TextInput
              style={[styles.sendInput, { borderColor: c.border, color: c.text }]}
              placeholder="Type your option..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => send(input)} disabled={loading}>
              <Text style={styles.sendBtnTxt}>Send</Text>
            </TouchableOpacity>
          </View>
        )}

        {messages.length > 0 && (
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetTxt}>↺ Reset Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { backgroundColor: Brand.primaryDark, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 13 },
  infoCard: { margin: 20, borderRadius: 16, padding: 20 },
  infoTitle: { fontWeight: '700', color: Brand.primary, marginBottom: 12 },
  dialBox: { backgroundColor: Brand.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  dialCode: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  infoBody: { fontSize: 13, lineHeight: 20 },
  section: { fontWeight: '700', fontSize: 16, paddingHorizontal: 20, marginBottom: 12, marginTop: 4 },
  menuGrid: { paddingHorizontal: 20, gap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, gap: 12 },
  menuNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Brand.accent, alignItems: 'center', justifyContent: 'center' },
  menuNumTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  menuLabel: { fontWeight: '600', fontSize: 14 },
  menuDesc: { fontSize: 12, marginTop: 1 },
  simCard: { margin: 20, borderRadius: 16, padding: 20 },
  simLabel: { fontWeight: '600', color: '#374151', fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 },
  chat: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  bubble: { maxWidth: '85%', borderRadius: 12, padding: 10 },
  bubbleServer: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF' },
  bubbleYou: { alignSelf: 'flex-end', backgroundColor: Brand.accent },
  bubbleTxt: { fontSize: 13, lineHeight: 18 },
  bubbleTxtServer: { color: Brand.black },
  bubbleTxtYou: { color: '#fff' },
  startBtn: { backgroundColor: Brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  startBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sendRow: { flexDirection: 'row', gap: 10 },
  sendInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 15 },
  sendBtn: { backgroundColor: Brand.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  sendBtnTxt: { color: '#fff', fontWeight: '700' },
  resetBtn: { alignItems: 'center', marginTop: 12 },
  resetTxt: { color: '#9CA3AF', fontSize: 13 },
});
