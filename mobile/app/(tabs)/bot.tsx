import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  FlatList, Keyboard, Linking, StatusBar, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '@/constants/theme';
import useAuth from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { askVeriBot, getQuickSuggestions, isAIEnabled } from '@/services/veribot';
import { MarkdownText } from '@/components/MarkdownText';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import type { ChatMessage } from '@/types';
import { SPACING, tabBarBottomInset } from '@/constants/layout';

const WHATSAPP_NUMBER = '233244000000';

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
}

export default function BotScreen() {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
  const { user } = useAuth();
  const { transactions } = useTransactions();

  const [msgs, setMsgs] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'bot',
      ts: Date.now(),
      text: `Hey! 👋 I'm **VeriBot** — your AI assistant for VeriTrade.\n\nI can help with escrow, payments, disputes, and your transactions. What do you need?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const ctx = useMemo(
    () => ({
      user,
      transactions,
      disputedTransactions: transactions.filter((t) => t.status === 'DISPUTED'),
    }),
    [user, transactions],
  );

  const quickSuggestions = useMemo(() => getQuickSuggestions(ctx), [ctx]);
  const tabBarPad = tabBarBottomInset(insets.bottom);
  const inputBottomPad = keyboardInset > 0 ? keyboardInset + SPACING.sm : tabBarPad;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => { scrollToEnd(); }, [msgs, typing, keyboardInset, scrollToEnd]);

  const history = useMemo(
    () =>
      msgs
        .filter((m) => m.role === 'user' || m.role === 'bot')
        .slice(-10)
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        })),
    [msgs],
  );

  async function handleSend(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || typing) return;
    setInput('');
    Keyboard.dismiss();

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: trimmed,
      ts: Date.now(),
    };
    setMsgs((m) => [...m, userMsg]);
    setTyping(true);

    const botId = String(Date.now() + 1);
    setStreamingId(botId);
    setMsgs((m) => [...m, { id: botId, role: 'bot', text: '', ts: Date.now(), streaming: true }]);

    try {
      const priorHistory = history.filter((h) => h.content !== trimmed);
      const { text: reply } = await askVeriBot(
        trimmed,
        priorHistory,
        ctx,
        (partial) => {
          setMsgs((m) =>
            m.map((msg) => (msg.id === botId ? { ...msg, text: partial } : msg)),
          );
        },
      );

      setMsgs((m) =>
        m.map((msg) =>
          msg.id === botId ? { ...msg, text: reply, streaming: false } : msg,
        ),
      );
    } catch {
      setMsgs((m) =>
        m.map((msg) =>
          msg.id === botId
            ? {
                ...msg,
                text: "Sorry, I couldn't reach the AI service. Try again or type **human** for WhatsApp support.",
                streaming: false,
              }
            : msg,
        ),
      );
    } finally {
      setTyping(false);
      setStreamingId(null);
    }
  }

  async function copyMessage(text: string) {
    await Clipboard.setStringAsync(text.replace(/\*\*/g, ''));
  }

  function openWhatsApp() {
    const msg = encodeURIComponent('Hello VeriTrade Support, I need help with my transaction.');
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
  }

  function renderBubble(item: ChatMessage) {
    const isUser = item.role === 'user';
    const isStreaming = item.id === streamingId && item.streaming;

    return (
      <Pressable
        onLongPress={() => copyMessage(item.text)}
        style={[styles.bubbleWrap, isUser ? styles.userWrap : styles.botWrap]}
      >
        {!isUser && (
          <View style={styles.botAvatarSmall}>
            <Ionicons name="hardware-chip-outline" size={12} color="#fff" />
          </View>
        )}
        <BlurView
          intensity={isUser ? 0 : 50}
          tint="dark"
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
            isUser && { backgroundColor: Brand.primary },
          ]}
        >
          {isStreaming && !item.text ? (
            <TypingIndicator />
          ) : (
            <MarkdownText
              text={item.text}
              style={[styles.bubbleTxt, isUser ? styles.userTxt : styles.botTxt]}
            />
          )}
          <Text style={[styles.ts, isUser && styles.tsUser]}>{formatTime(item.ts)}</Text>
        </BlurView>
      </Pressable>
    );
  }

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#0D1A3A', '#1A56DB']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.botAvatar}>
          <Ionicons name="hardware-chip-outline" size={22} color="#fff" />
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>VeriBot</Text>
          <Text style={styles.headerSub}>
            {isAIEnabled() ? 'AI Assistant · Context-aware' : 'Offline mode · Smart fallback'}
          </Text>
        </View>
        <TouchableOpacity style={styles.waIconBtn} onPress={openWhatsApp}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        style={styles.list}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => renderBubble(item)}
        ListFooterComponent={
          typing && !streamingId ? (
            <BlurView intensity={50} tint="dark" style={[styles.bubble, styles.botBubble, { alignSelf: 'flex-start' }]}>
              <TypingIndicator />
            </BlurView>
          ) : null
        }
      />

      <ScrollChips suggestions={quickSuggestions} onSelect={(q) => handleSend(q)} disabled={typing} />

      <BlurView intensity={60} tint="dark" style={[styles.inputBar, { paddingBottom: inputBottomPad }]}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Ask VeriBot anything..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            blurOnSubmit
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || typing) && { opacity: 0.4 }]}
          onPress={() => handleSend()}
          disabled={!input.trim() || typing}
        >
          <LinearGradient colors={['#1A56DB', '#2563EB']} style={styles.sendGrad}>
            <Ionicons name="send" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </ScreenBackground>
  );
}

function ScrollChips({
  suggestions,
  onSelect,
  disabled,
}: {
  suggestions: string[];
  onSelect: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <FlatList
      horizontal
      data={suggestions}
      keyExtractor={(q) => q}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickRow}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => onSelect(item)}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Ionicons name="flash-outline" size={12} color={Brand.primaryLight} style={{ marginRight: 4 }} />
          <Text style={styles.quickTxt}>{item}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 14, paddingHorizontal: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  botAvatar: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#1A56DB',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },
  onlineDot: {
    position: 'absolute', top: -2, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#0D1A3A',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  waIconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#25D366',
    alignItems: 'center', justifyContent: 'center',
  },
  list: { flex: 1 },
  msgList: { padding: SPACING.md, paddingBottom: SPACING.sm, gap: 4 },
  bubbleWrap: { marginBottom: 8, maxWidth: '88%' },
  userWrap: { alignSelf: 'flex-end' },
  botWrap: { alignSelf: 'flex-start', paddingLeft: 4 },
  bubble: { borderRadius: 18, padding: 12, overflow: 'hidden' },
  botBubble: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 4, paddingLeft: 12,
  },
  userBubble: { borderTopRightRadius: 4 },
  botAvatarSmall: {
    position: 'absolute', left: 0, top: 10, zIndex: 1,
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center',
  },
  bubbleTxt: { fontSize: 14, lineHeight: 21 },
  botTxt: { color: 'rgba(255,255,255,0.92)' },
  userTxt: { color: '#fff' },
  ts: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6, alignSelf: 'flex-end' },
  tsUser: { color: 'rgba(255,255,255,0.65)' },
  quickRow: { paddingHorizontal: SPACING.md, paddingVertical: 8, gap: 8 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(26,86,219,0.2)', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.35)',
  },
  quickTxt: { color: '#93C5FD', fontSize: 12, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)', gap: 10,
  },
  inputWrap: {
    flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 10, color: '#fff' },
  sendBtn: { marginBottom: 2 },
  sendGrad: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
