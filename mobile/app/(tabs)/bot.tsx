import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Linking,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Role = 'bot' | 'user' | 'system';
interface Msg { id: string; role: Role; text: string; ts: number }

// ─── Q&A Knowledge Base ────────────────────────────────────────────────────────
const QA: { patterns: RegExp[]; answer: string }[] = [
  {
    patterns: [/escrow/i, /how.*work/i, /what.*veritrade/i],
    answer: `VeriTrade is a secure escrow platform 🛡️\n\n**How it works:**\n1. Buyer creates an escrow & shares the code\n2. Seller gets notified\n3. Buyer pays — funds are held securely\n4. Seller delivers goods\n5. Buyer confirms → funds released\n\nNeither party can touch the money until both sides agree.`,
  },
  {
    patterns: [/creat.*escrow/i, /start.*trade/i, /new.*escrow/i],
    answer: `To create an escrow:\n\n1. Tap the ➕ **New Escrow** button\n2. Enter the item name, amount (₵), and seller's phone\n3. Share the transaction code with your seller\n4. Wait for payment confirmation\n\nYou can also do this via USSD by dialing **\\*384\\*1#** — works on any phone!`,
  },
  {
    patterns: [/pay/i, /fund/i, /send.*money/i],
    answer: `To pay for a trade:\n\n1. Go to **My Trades** (Activity tab)\n2. Find the transaction with status PENDING\n3. Tap **Mark as Paid**\n\nFunds are held in escrow — not released until the buyer confirms delivery. 🔒`,
  },
  {
    patterns: [/confirm/i, /deliver/i, /receiv/i, /got.*item/i],
    answer: `To confirm you've received your item:\n\n1. Go to **Activity** tab\n2. Find the PAID transaction\n3. Tap **Confirm Delivery**\n\nThis releases the funds to the seller. Only do this once you're satisfied! ✅`,
  },
  {
    patterns: [/disput/i, /scam/i, /fraud/i, /cheat/i, /problem/i],
    answer: `If something went wrong, you can raise a dispute:\n\n1. Go to **Activity** tab\n2. Find the transaction\n3. Tap **Dispute**\n\nOr type **"I have a dispute"** here and I'll help judge it using the details you provide. I can also connect you to a real human if needed. 🧑‍⚖️`,
  },
  {
    patterns: [/ussd/i, /dial/i, /basic.*phone/i, /no.*smart/i],
    answer: `VeriTrade works on **any phone** — no internet needed!\n\nDial **\\*384\\*1#** on any Ghanaian SIM (MTN, Vodafone, AirtelTigo).\n\nFrom the USSD menu you can:\n• Create escrow\n• Pay\n• Confirm delivery\n• Check status\n• Raise dispute\n• Cancel trade`,
  },
  {
    patterns: [/fee/i, /charge/i, /cost/i, /how.*much/i],
    answer: `VeriTrade charges a small service fee based on the transaction amount:\n\n• Under ₵500: **₵5 flat fee**\n• ₵500–₵5,000: **1.5%**\n• Above ₵5,000: **1%**\n\nFees are deducted from the amount at release — the buyer is protected until delivery. 💰`,
  },
  {
    patterns: [/cancel/i, /refund/i, /back.*money/i],
    answer: `To cancel a trade:\n\n• If status is **PENDING** — you can cancel freely. Funds haven't been sent yet.\n• If status is **PAID** — you need to raise a **dispute** first. I can help mediate.\n\nGo to Activity → find the transaction → raise a dispute and explain what happened.`,
  },
  {
    patterns: [/safe/i, /secure/i, /trust/i, /legit/i],
    answer: `VeriTrade is built specifically for Ghanaian traders 🇬🇭\n\n• Funds are held in **escrow** — never with the seller until delivery is confirmed\n• Every transaction has a unique **code** for verification\n• Disputes are **mediated by VeriBot** or escalated to our team\n• Works even without internet via USSD\n\nYou are always protected. 🛡️`,
  },
  {
    patterns: [/hello|hi|hey|hola|good/i],
    answer: `Hey there! 👋 I'm **VeriBot**, your VeriTrade assistant.\n\nI can help you with:\n• 🤝 How escrow works\n• 💳 Payments & confirmations\n• ⚖️ Dispute resolution\n• 📱 USSD usage\n• 🙋 Any other questions\n\nWhat do you need help with?`,
  },
  {
    patterns: [/human|person|agent|real|talk.*someone/i],
    answer: `I'll connect you to a real person right now! 🙋\n\nOur support team is available on WhatsApp during business hours (8am–8pm GMT).\n\nTap the button below to open WhatsApp and chat with us directly.`,
  },
];

// ─── Dispute Judging Logic ─────────────────────────────────────────────────────
interface DisputeContext {
  issue?: string;
  buyerClaim?: string;
  sellerClaim?: string;
  amount?: string;
  step: 'start' | 'buyer_claim' | 'seller_claim' | 'judging' | 'verdict';
}

function judgeDispute(ctx: DisputeContext): string {
  const issue = (ctx.issue || '').toLowerCase();
  const buyerClaim = (ctx.buyerClaim || '').toLowerCase();
  const sellerClaim = (ctx.sellerClaim || '').toLowerCase();

  // Scoring heuristics
  let buyerScore = 0;
  let sellerScore = 0;

  // Item not received → strong buyer claim
  if (buyerClaim.match(/not receiv|never got|didn.*arrive|no.*deliver/)) buyerScore += 3;
  if (sellerClaim.match(/delivered|sent|shipped|provid/)) sellerScore += 2;

  // Item not as described → buyer
  if (buyerClaim.match(/not.*describ|different|wrong|fake|counterfeit|broken|damage/)) buyerScore += 3;
  if (sellerClaim.match(/exactly.*describ|same.*list|photo|proof/)) sellerScore += 2;

  // Partial delivery
  if (buyerClaim.match(/partial|incomplet|missing.*part/)) buyerScore += 2;
  if (sellerClaim.match(/complet|full|everything/)) sellerScore += 1;

  // Seller claims buyer is lying
  if (sellerClaim.match(/liar|lying|false|fabricat/)) buyerScore += 1; // aggression penalises

  // Buyer claims item received but unhappy = weaker case
  if (buyerClaim.match(/receiv|got it|have it/) && !buyerClaim.match(/broken|damage|fake/)) sellerScore += 2;

  const amount = ctx.amount ? `₵${ctx.amount}` : 'the amount';

  if (buyerScore > sellerScore) {
    return `⚖️ **VeriBot Verdict**\n\nAfter reviewing both sides, I find in favour of the **Buyer** 🟢\n\n**Reasoning:** The buyer's claim — "${ctx.buyerClaim}" — presents a stronger case than the seller's response.\n\n**Recommendation:** ${amount} should be **refunded to the buyer**.\n\nIf either party disagrees, I can escalate this to a human mediator via WhatsApp. Tap the button below.`;
  } else if (sellerScore > buyerScore) {
    return `⚖️ **VeriBot Verdict**\n\nAfter reviewing both sides, I find in favour of the **Seller** 🟡\n\n**Reasoning:** The seller's claim — "${ctx.sellerClaim}" — is more substantiated based on the information provided.\n\n**Recommendation:** ${amount} should be **released to the seller**.\n\nIf the buyer has additional evidence, escalate to our human team via WhatsApp.`;
  } else {
    return `⚖️ **VeriBot Verdict**\n\nThis case is **too close to call** — both sides have valid points.\n\n**Recommendation:** This dispute needs a **human mediator**. I'm connecting you to our support team on WhatsApp where a real person will review the full details.\n\nPlease tap the WhatsApp button below and describe your case.`;
  }
}

// ─── Answer lookup ─────────────────────────────────────────────────────────────
function getAnswer(input: string): string | null {
  for (const qa of QA) {
    if (qa.patterns.some((p) => p.test(input))) return qa.answer;
  }
  return null;
}

// ─── Render markdown-like bold text ────────────────────────────────────────────
function BoldText({ text, style }: { text: string; style?: any }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <Text key={i} style={{ fontWeight: '700' }}>{p.slice(2, -2)}</Text>
          : <Text key={i}>{p}</Text>
      )}
    </Text>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = '233244000000'; // replace with actual support number

export default function BotScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? 'light'];
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: '0', role: 'bot', ts: Date.now(),
      text: `Hey! 👋 I'm **VeriBot** — your AI assistant for VeriTrade.\n\nI can:\n• 🤝 Explain how escrow works\n• ⚖️ Judge a dispute between buyer & seller\n• 💬 Answer your questions\n• 🙋 Connect you to a real person\n\nWhat do you need help with today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [disputeCtx, setDisputeCtx] = useState<DisputeContext | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [msgs]);

  function addMsg(role: Role, text: string) {
    setMsgs((m) => [...m, { id: String(Date.now() + Math.random()), role, text, ts: Date.now() }]);
  }

  async function botReply(text: string) {
    setTyping(true);
    await new Promise((r) => setTimeout(r, 900));
    setTyping(false);
    addMsg('bot', text);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    addMsg('user', trimmed);

    // ── Dispute flow ──
    if (disputeCtx) {
      const ctx = { ...disputeCtx };
      if (ctx.step === 'start') {
        ctx.issue = trimmed;
        ctx.step = 'buyer_claim';
        setDisputeCtx(ctx);
        await botReply(`Got it. Now, what is the **buyer's claim**? (What does the buyer say went wrong?)`);
        return;
      }
      if (ctx.step === 'buyer_claim') {
        ctx.buyerClaim = trimmed;
        ctx.step = 'seller_claim';
        setDisputeCtx(ctx);
        await botReply(`Understood. Now what is the **seller's response** to this claim?`);
        return;
      }
      if (ctx.step === 'seller_claim') {
        ctx.sellerClaim = trimmed;
        ctx.step = 'judging';
        setDisputeCtx(ctx);
        await botReply('Analysing both sides... ⚖️');
        await new Promise((r) => setTimeout(r, 1200));
        setTyping(false);
        const verdict = judgeDispute(ctx);
        addMsg('bot', verdict);
        setDisputeCtx({ ...ctx, step: 'verdict' });
        setShowWhatsApp(true);
        return;
      }
    }

    // ── Dispute trigger ──
    if (/disput|judge|mediat|settle|conflict/i.test(trimmed) && !disputeCtx) {
      await botReply(`I'll help mediate this dispute. 🧑‍⚖️\n\nFirst — what is the **transaction amount** (optional, e.g. 500)? Or type the issue directly and I'll take it from there.\n\nDescribe what the dispute is about:`);
      setDisputeCtx({ step: 'start' });
      return;
    }

    // ── Amount capture during dispute start ──
    if (disputeCtx?.step === 'start' && /^\d+$/.test(trimmed)) {
      setDisputeCtx({ ...disputeCtx, amount: trimmed });
      await botReply(`Got it — ₵${trimmed}. Now describe what the dispute is about:`);
      return;
    }

    // ── WhatsApp handoff trigger ──
    if (/human|person|agent|real|talk.*someone|whatsapp/i.test(trimmed)) {
      await botReply(`Connecting you to our team on WhatsApp 🙋\n\nA real human will respond within minutes during business hours (8am–8pm GMT).\n\nTap the button below to open WhatsApp.`);
      setShowWhatsApp(true);
      return;
    }

    // ── Q&A ──
    const answer = getAnswer(trimmed);
    if (answer) {
      await botReply(answer);
      // Offer WhatsApp if they mention human-related keywords
      if (/human|person|agent|real/i.test(answer)) setShowWhatsApp(true);
      return;
    }

    // ── Fallback ──
    await botReply(`I'm not sure about that one, but I can help with:\n\n• Type **"dispute"** to settle a trade conflict\n• Type **"escrow"** to learn how it works\n• Type **"fees"** to check costs\n• Type **"human"** to talk to a real person\n\nWhat would you like?`);
  }

  function openWhatsApp() {
    const msg = encodeURIComponent('Hello VeriTrade Support, I need help with my transaction.');
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
  }

  // ── Quick reply chips ──
  const QUICK = ['How does escrow work?', 'I have a dispute', 'Talk to a human', 'Check fees'];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0D1A3A', '#1A56DB']} style={styles.header}>
        <View style={styles.botAvatar}>
          <Ionicons name="hardware-chip-outline" size={22} color="#fff" />
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>VeriBot</Text>
          <Text style={styles.headerSub}>AI Assistant · Always available</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeTxt}>AI</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            <>
              {typing && (
                <View style={[styles.bubble, styles.botBubble]}>
                  <View style={styles.typingDots}>
                    {[0, 1, 2].map((i) => (
                      <View key={i} style={[styles.typingDot, { opacity: 0.4 + i * 0.2 }]} />
                    ))}
                  </View>
                </View>
              )}
              {showWhatsApp && (
                <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.waBtnTxt}>Chat with a real person on WhatsApp</Text>
                </TouchableOpacity>
              )}
            </>
          }
          renderItem={({ item }) => (
            <View style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.botBubble,
            ]}>
              {item.role === 'bot' && (
                <View style={styles.botAvatarSmall}>
                  <Ionicons name="hardware-chip-outline" size={12} color="#fff" />
                </View>
              )}
              <BoldText
                text={item.text}
                style={[styles.bubbleTxt, item.role === 'user' ? styles.userTxt : styles.botTxt]}
              />
            </View>
          )}
        />

        {/* Quick replies */}
        {msgs.length <= 2 && (
          <View style={styles.quickRow}>
            {QUICK.map((q) => (
              <TouchableOpacity key={q} style={styles.quickChip} onPress={() => {
                setInput(q);
                setTimeout(() => {
                  setInput('');
                  addMsg('user', q);
                  // trigger same logic
                  const fakeEvent = { trim: () => q } as any;
                  setInput(q);
                }, 0);
              }}>
                <Text style={styles.quickTxt}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: c.card, borderTopColor: c.border }]}>
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="Ask VeriBot anything..."
            placeholderTextColor={c.subtext}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || typing}
          >
            <LinearGradient colors={['#1A56DB', '#2563EB']} style={styles.sendGrad}>
              <Ionicons name="send" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
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
  headerBadge: {
    backgroundColor: Brand.accent,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  headerBadgeTxt: { color: '#fff', fontWeight: '800', fontSize: 11 },

  // Messages
  msgList: { padding: 16, gap: 10, paddingBottom: 8 },
  bubble: { maxWidth: '82%', borderRadius: 18, padding: 12, marginBottom: 2 },
  botBubble: {
    alignSelf: 'flex-start', backgroundColor: '#0D1A3A',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
    borderTopLeftRadius: 4, paddingLeft: 38,
  },
  userBubble: {
    alignSelf: 'flex-end', borderTopRightRadius: 4,
    backgroundColor: Brand.primary,
  },
  botAvatarSmall: {
    position: 'absolute', left: 10, top: 12,
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: Brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  bubbleTxt: { fontSize: 14, lineHeight: 21 },
  botTxt: { color: 'rgba(255,255,255,0.9)' },
  userTxt: { color: '#fff' },

  // Typing
  typingDots: { flexDirection: 'row', gap: 5, paddingVertical: 4, paddingLeft: 12 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.primary },

  // WhatsApp button
  waBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#25D366', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 20,
    marginHorizontal: 16, marginTop: 8, marginBottom: 4,
  },
  waBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Quick replies
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  quickChip: {
    backgroundColor: 'rgba(26,86,219,0.12)', borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 13,
    borderWidth: 1, borderColor: 'rgba(26,86,219,0.25)',
  },
  quickTxt: { color: Brand.primary, fontSize: 12, fontWeight: '600' },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, gap: 10,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { marginBottom: 2 },
  sendGrad: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
