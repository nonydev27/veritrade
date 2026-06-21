const fs = require('fs').promises;
const path = require('path');
const DIR = path.join(__dirname, '..', '..', 'local_data');
const USERS_FILE = path.join(DIR, 'users.json');
const TX_FILE = path.join(DIR, 'transactions.json');
const DISPUTES_FILE = path.join(DIR, 'disputes.json');

async function ensure() {
  await fs.mkdir(DIR, { recursive: true });
  for (const f of [USERS_FILE, TX_FILE, DISPUTES_FILE]) {
    try { await fs.access(f); } catch { await fs.writeFile(f, '[]'); }
  }
}

async function readFile(file) {
  const txt = await fs.readFile(file, 'utf8');
  return JSON.parse(txt || '[]');
}

async function writeFile(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// USERS
async function addUser({ name, phone, password_hash, role }) {
  await ensure();
  const users = await readFile(USERS_FILE);
  if (users.find(u => u.phone === phone)) throw new Error('phone exists');
  const id = (users[users.length - 1]?.id || 0) + 1;
  const user = { id, name, phone, password_hash, role: role || 'BUYER', kyc_status: 'PENDING', created_at: new Date().toISOString() };
  users.push(user);
  await writeFile(USERS_FILE, users);
  return user;
}

async function findUserByPhone(phone) {
  await ensure();
  const users = await readFile(USERS_FILE);
  return users.find(u => u.phone === phone) || null;
}

// TRANSACTIONS
async function addTransaction({ transaction_code, buyer_id, seller_id, item_description, amount, status }) {
  await ensure();
  const txs = await readFile(TX_FILE);
  const id = (txs[txs.length - 1]?.id || 0) + 1;
  const tx = { id, transaction_code, buyer_id: buyer_id || null, seller_id: seller_id || null, item_description, amount, status: status || 'PENDING', created_at: new Date().toISOString() };
  txs.push(tx);
  await writeFile(TX_FILE, txs);
  return tx;
}

async function findTransactionByCode(code) {
  await ensure();
  const txs = await readFile(TX_FILE);
  return txs.find(t => t.transaction_code === code) || null;
}

async function listTransactionsForUser(user_id) {
  await ensure();
  const txs = await readFile(TX_FILE);
  if (!user_id) return txs; // unauthenticated → return all (dev mode)
  return txs.filter(t => t.buyer_id === user_id || t.seller_id === user_id);
}

async function updateTransactionStatus(id, status) {
  await ensure();
  const txs = await readFile(TX_FILE);
  const idx = txs.findIndex(t => t.id === id);
  if (idx === -1) return null;
  txs[idx].status = status;
  await writeFile(TX_FILE, txs);
  return txs[idx];
}

// DISPUTES
async function addDispute({ transaction_id, reason }) {
  await ensure();
  const disputes = await readFile(DISPUTES_FILE);
  const id = (disputes[disputes.length - 1]?.id || 0) + 1;
  const d = { id, transaction_id, reason, status: 'OPEN', admin_note: null, created_at: new Date().toISOString() };
  disputes.push(d);
  await writeFile(DISPUTES_FILE, disputes);
  return d;
}

module.exports = { addUser, findUserByPhone, addTransaction, findTransactionByCode, listTransactionsForUser, updateTransactionStatus, addDispute };
