const sessions = new Map();
const local = require('../config/local_store');

function get(phone) {
  if (!sessions.has(phone)) sessions.set(phone, { step: 'MENU', data: {} });
  return sessions.get(phone);
}
function clear(phone) { sessions.delete(phone); }

async function handleUssd(phone, text) {
  const s = get(phone);
  text = (text || '').trim();

  // ─── MAIN MENU ────────────────────────────────────────────────
  if (s.step === 'MENU') {
    if (text === '' || text === '0') {
      return reply(
        'VeriTrade Escrow\n1 Create Escrow\n2 Pay\n3 Confirm Delivery\n4 Check Status\n5 Dispute\n6 Cancel'
      );
    }
    const jumps = { '1': 'CREATE_ITEM', '2': 'PAY_CODE', '3': 'CONFIRM_CODE', '4': 'STATUS_CODE', '5': 'DISPUTE_CODE', '6': 'CANCEL_CODE' };
    const prompts = { '1': 'Enter item name', '2': 'Enter transaction code', '3': 'Enter transaction code', '4': 'Enter transaction code', '5': 'Enter transaction code', '6': 'Enter transaction code' };
    if (jumps[text]) { s.step = jumps[text]; return reply(prompts[text]); }
    return reply('Invalid. Send 0 for menu.');
  }

  // ─── CREATE ────────────────────────────────────────────────────
  if (s.step === 'CREATE_ITEM') { s.data.item = text; s.step = 'CREATE_AMOUNT'; return reply('Enter amount (KES)'); }
  if (s.step === 'CREATE_AMOUNT') { s.data.amount = text; s.step = 'CREATE_SELLER'; return reply('Enter seller phone'); }
  if (s.step === 'CREATE_SELLER') {
    try {
      const tx = await local.addTransaction({ transaction_code: rand(), buyer_id: null, seller_id: null, item_description: s.data.item, amount: parseFloat(s.data.amount), status: 'PENDING' });
      clear(phone);
      return reply(`Escrow Created!\nCode: ${tx.transaction_code}\nAmount: KES ${tx.amount}\nShare code with seller.`);
    } catch { clear(phone); return reply('Failed. Try again.'); }
  }

  // ─── PAY ───────────────────────────────────────────────────────
  if (s.step === 'PAY_CODE') {
    const tx = await local.findTransactionByCode(text);
    clear(phone);
    if (!tx) return reply('Transaction not found.');
    if (tx.status !== 'PENDING') return reply(`Cannot pay. Status: ${tx.status}`);
    await local.updateTransactionStatus(tx.id, 'PAID');
    return reply(`Paid!\nCode: ${tx.transaction_code}\nAmount: KES ${tx.amount}\nStatus: PAID`);
  }

  // ─── CONFIRM ───────────────────────────────────────────────────
  if (s.step === 'CONFIRM_CODE') {
    const tx = await local.findTransactionByCode(text);
    clear(phone);
    if (!tx) return reply('Transaction not found.');
    if (tx.status !== 'PAID') return reply(`Cannot confirm. Status: ${tx.status}`);
    await local.updateTransactionStatus(tx.id, 'COMPLETED');
    return reply(`Delivery Confirmed!\nCode: ${tx.transaction_code}\nFunds released to seller.`);
  }

  // ─── STATUS ────────────────────────────────────────────────────
  if (s.step === 'STATUS_CODE') {
    const tx = await local.findTransactionByCode(text);
    clear(phone);
    if (!tx) return reply('Transaction not found.');
    return reply(`Code: ${tx.transaction_code}\nItem: ${tx.item_description}\nAmount: KES ${tx.amount}\nStatus: ${tx.status}`);
  }

  // ─── DISPUTE ───────────────────────────────────────────────────
  if (s.step === 'DISPUTE_CODE') { s.data.dispute_code = text; s.step = 'DISPUTE_REASON'; return reply('Enter dispute reason'); }
  if (s.step === 'DISPUTE_REASON') {
    const tx = await local.findTransactionByCode(s.data.dispute_code);
    clear(phone);
    if (!tx) return reply('Transaction not found.');
    if (!['PAID', 'PENDING'].includes(tx.status)) return reply(`Cannot dispute. Status: ${tx.status}`);
    await local.updateTransactionStatus(tx.id, 'DISPUTED');
    await local.addDispute({ transaction_id: tx.id, reason: text });
    return reply(`Dispute Raised!\nCode: ${tx.transaction_code}\nReason: ${text}\nOur team will review within 24h.`);
  }

  // ─── CANCEL ────────────────────────────────────────────────────
  if (s.step === 'CANCEL_CODE') {
    const tx = await local.findTransactionByCode(text);
    clear(phone);
    if (!tx) return reply('Transaction not found.');
    if (tx.status !== 'PENDING') return reply(`Cannot cancel. Status: ${tx.status}`);
    await local.updateTransactionStatus(tx.id, 'CANCELLED');
    return reply(`Cancelled!\nCode: ${tx.transaction_code}\nStatus: CANCELLED`);
  }

  clear(phone);
  return reply('Session expired. Send 0 for menu.');
}

function reply(text) { return { reply: text }; }
function rand() { return Math.floor(100000 + Math.random() * 900000).toString(); }

module.exports = { handleUssd };
