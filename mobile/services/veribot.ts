import type { Transaction, User } from '@/types';

const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

export type VeriBotContext = {
  user: User | null;
  transactions: Transaction[];
  disputedTransactions?: Transaction[];
};

// ─── Fallback Q&A when AI unavailable ───────────────────────────────────────

const FALLBACK_QA: { patterns: RegExp[]; answer: string }[] = [
  {
    patterns: [/escrow/i, /how.*work/i, /what.*veritrade/i],
    answer: `VeriTrade is Ghana's secure escrow platform.\n\n**How it works:**\n1. Buyer creates escrow & shares the code\n2. Seller accepts\n3. Buyer pays — funds held securely\n4. Seller ships with delivery PIN\n5. Buyer confirms → funds released`,
  },
  {
    patterns: [/creat.*escrow/i, /new.*escrow/i],
    answer: `Tap **New Escrow** (+), enter item, amount (₵), and seller phone (024XXXXXXX). Share the code with your seller.`,
  },
  {
    patterns: [/my transaction|transaction status|check.*status/i],
    answer: '', // filled dynamically
  },
  {
    patterns: [/disput/i, /scam/i, /problem/i],
    answer: `Go to **Activity**, find the transaction, tap **Dispute**. As admin, ask me to **analyze dispute** with the transaction code for a recommendation.`,
  },
  {
    patterns: [/pay/i, /momo/i, /mobile money/i],
    answer: `When status is **ACCEPTED**, tap **Pay via MoMo** and approve the prompt on your phone.`,
  },
  {
    patterns: [/ship/i, /deliver/i],
    answer: `**Sellers:** After funding, tap **Mark as Shipped** to get a delivery PIN.\n**Buyers:** Enter the PIN when status is **SHIPPED** to release funds.`,
  },
  {
    patterns: [/hello|hi|hey/i],
    answer: `Hey! I'm **VeriBot**. I can help with escrow, payments, disputes, and your transactions. What do you need?`,
  },
];

function buildSystemPrompt(ctx: VeriBotContext): string {
  const { user, transactions, disputedTransactions = [] } = ctx;
  const role = user?.role || 'BUYER';
  const txSummary = transactions.slice(0, 8).map((t) => ({
    code: t.transaction_code,
    item: t.item_description,
    amount: t.amount,
    status: t.status,
    created: t.created_at,
  }));

  return `You are VeriBot, the AI assistant for VeriTrade — a Ghana escrow platform (currency: GHS ₵).

USER CONTEXT:
- Name: ${user?.name || 'Guest'}
- Role: ${role}
- Phone: ${user?.phone || 'unknown'}
- KYC: ${user?.kyc_status || 'unknown'}

RECENT TRANSACTIONS (${transactions.length} total):
${JSON.stringify(txSummary, null, 2)}

DISPUTED/OPEN: ${disputedTransactions.length} transactions
${JSON.stringify(disputedTransactions.map((t) => ({ code: t.transaction_code, status: t.status, item: t.item_description })), null, 2)}

ESCROW RULES:
- PENDING → seller must accept
- ACCEPTED → buyer pays via MoMo
- FUNDED → seller ships, gets delivery PIN
- SHIPPED → buyer enters PIN to release funds
- DISPUTED → admin reviews

INSTRUCTIONS:
- Be concise, friendly, use Ghana context (MoMo, ₵, USSD *384*1#)
- Reference the user's actual transactions when relevant
- For ${role === 'ADMIN' ? 'ADMIN' : role}: tailor advice to their role
- ${role === 'ADMIN' ? 'For dispute analysis: provide recommendation (REFUND/PAY_SELLER/SPLIT), confidence % (0-100), and clear reasoning. Compare buyer vs seller claims if provided.' : ''}
- Use **bold** for emphasis. Use bullet points for steps.
- Never invent transaction codes not in context.`;
}

function findRelevantTransactions(input: string, txs: Transaction[]): Transaction[] {
  const lower = input.toLowerCase();
  if (/my transaction|recent|latest|last trade/i.test(lower)) {
    return txs.slice(0, 3);
  }
  const codeMatch = input.match(/#?([A-Z0-9]{6,12})/i);
  if (codeMatch) {
    const code = codeMatch[1].toUpperCase();
    const found = txs.filter((t) => t.transaction_code.toUpperCase().includes(code));
    if (found.length) return found;
  }
  return [];
}

function getFallbackAnswer(input: string, ctx: VeriBotContext): string | null {
  const relevant = findRelevantTransactions(input, ctx.transactions);
  if (/my transaction|transaction status|check.*status/i.test(input) && ctx.transactions.length) {
    const lines = (relevant.length ? relevant : ctx.transactions.slice(0, 3)).map(
      (t) => `• **#${t.transaction_code}** — ${t.item_description} — ₵${t.amount} — **${t.status}**`,
    );
    return `Here are your recent transactions:\n\n${lines.join('\n')}\n\nTap **Activity** for full details.`;
  }
  for (const qa of FALLBACK_QA) {
    if (qa.patterns.some((p) => p.test(input))) {
      return qa.answer || null;
    }
  }
  return null;
}

type ChatMsg = { role: 'user' | 'assistant'; content: string };

async function callOpenRouter(
  messages: ChatMsg[],
  systemPrompt: string,
  onChunk?: (text: string) => void,
): Promise<string> {
  if (!OPENROUTER_KEY) throw new Error('No OpenRouter API key');

  const body = {
    model: DEFAULT_MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: !!onChunk,
  };

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://veritrade.com.gh',
      'X-Title': 'VeriTrade Mobile',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${err}`);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // Streaming
  const reader = res.body?.getReader();
  if (!reader) {
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onChunk(full);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
  return full;
}

async function callGemini(messages: ChatMsg[], systemPrompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('No Gemini API key');

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export function getQuickSuggestions(ctx: VeriBotContext): string[] {
  const role = ctx.user?.role || 'BUYER';
  const active = ctx.transactions.filter((t) =>
    ['PENDING', 'ACCEPTED', 'FUNDED', 'SHIPPED', 'DISPUTED'].includes(t.status),
  );
  const base = ['How does escrow work?', "Check my transaction status"];

  if (role === 'BUYER') {
    return [
      ...base,
      active.some((t) => t.status === 'ACCEPTED') ? 'Help with payment' : 'How do I create escrow?',
      active.some((t) => t.status === 'SHIPPED') ? 'I never received my item' : "What's a dispute?",
    ].slice(0, 4);
  }
  if (role === 'SELLER') {
    return [
      ...base,
      active.some((t) => t.status === 'FUNDED') ? 'I want to ship my item' : 'How do I accept a trade?',
      "What's a dispute?",
    ].slice(0, 4);
  }
  // ADMIN
  const disputed = ctx.transactions.filter((t) => t.status === 'DISPUTED');
  return [
    'Analyze open disputes',
    disputed.length ? `Review #${disputed[0].transaction_code}` : 'Dispute resolution guide',
    'Escrow rules summary',
    'Check my transaction status',
  ].slice(0, 4);
}

export async function askVeriBot(
  userMessage: string,
  history: ChatMsg[],
  ctx: VeriBotContext,
  onStream?: (partial: string) => void,
): Promise<{ text: string; usedAI: boolean }> {
  const systemPrompt = buildSystemPrompt(ctx);
  const messages: ChatMsg[] = [...history, { role: 'user', content: userMessage }];

  try {
    if (OPENROUTER_KEY) {
      const text = await callOpenRouter(messages, systemPrompt, onStream);
      return { text: text || 'I could not generate a response. Please try again.', usedAI: true };
    }
    if (GEMINI_KEY) {
      const text = await callGemini(messages, systemPrompt);
      if (onStream && text) onStream(text);
      return { text, usedAI: true };
    }
  } catch (err) {
    console.warn('VeriBot AI error:', err);
  }

  const fallback = getFallbackAnswer(userMessage, ctx);
  const text =
    fallback ||
    `I'm running in offline mode (no AI key configured). I can help with:\n\n• **escrow** — how it works\n• **my transaction** — your recent trades\n• **dispute** — raise or resolve conflicts\n• **pay** — MoMo payment help\n\nAdd \`EXPO_PUBLIC_OPENROUTER_API_KEY\` to mobile/.env for full AI.`;

  if (onStream) onStream(text);
  return { text, usedAI: false };
}

export function isAIEnabled(): boolean {
  return !!(OPENROUTER_KEY || GEMINI_KEY);
}
