const fs = require('fs').promises;
const path = require('path');
const DIR = path.join(__dirname, '..', '..', 'local_data');
const USERS_FILE        = path.join(DIR, 'users.json');
const TX_FILE           = path.join(DIR, 'transactions.json');
const DISPUTES_FILE     = path.join(DIR, 'disputes.json');
const LEDGER_FILE       = path.join(DIR, 'ledger.json');
const NOTIFICATIONS_FILE = path.join(DIR, 'notifications.json');
const KYC_FILE          = path.join(DIR, 'kyc_verifications.json');
const AUDIT_FILE        = path.join(DIR, 'admin_audit_log.json');

async function ensure() {
  await fs.mkdir(DIR, { recursive: true });
  for (const f of [USERS_FILE, TX_FILE, DISPUTES_FILE, LEDGER_FILE, NOTIFICATIONS_FILE, KYC_FILE, AUDIT_FILE]) {
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

async function findUserById(id) {
  await ensure();
  const users = await readFile(USERS_FILE);
  return users.find(u => u.id === id) || null;
}

async function updateUserFields(id, fields) {
  await ensure();
  const users = await readFile(USERS_FILE);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...fields };
  await writeFile(USERS_FILE, users);
  return users[idx];
}

// TRANSACTIONS
async function addTransaction({ transaction_code, buyer_id, seller_id, item_description, amount, status, expires_at }) {
  await ensure();
  const txs = await readFile(TX_FILE);
  const id = (txs[txs.length - 1]?.id || 0) + 1;
  const tx = {
    id,
    transaction_code,
    buyer_id: buyer_id || null,
    seller_id: seller_id || null,
    item_description,
    amount,
    status: status || 'PENDING',
    expires_at: expires_at || null,
    created_at: new Date().toISOString(),
  };
  txs.push(tx);
  await writeFile(TX_FILE, txs);
  return tx;
}

// Return all transactions in a given set of statuses (used by expiry job)
async function listTransactionsByStatuses(statuses) {
  await ensure();
  const txs = await readFile(TX_FILE);
  return txs.filter(t => statuses.includes(t.status));
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

async function findTransactionById(id) {
  await ensure();
  const txs = await readFile(TX_FILE);
  return txs.find(t => t.id === id) || null;
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

/**
 * Patch one or more fields on a transaction by id.
 * e.g. updateTransactionFields(1, { status: 'ACCEPTED', accepted_at: new Date().toISOString() })
 */
async function updateTransactionFields(id, fields) {
  await ensure();
  const txs = await readFile(TX_FILE);
  const idx = txs.findIndex(t => t.id === id);
  if (idx === -1) return null;
  txs[idx] = { ...txs[idx], ...fields };
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

async function findDisputeById(id) {
  await ensure();
  const disputes = await readFile(DISPUTES_FILE);
  return disputes.find(d => d.id === id) || null;
}

async function listDisputesByStatus(statuses) {
  await ensure();
  const disputes = await readFile(DISPUTES_FILE);
  return disputes.filter(d => statuses.includes(d.status));
}

async function updateDisputeFields(id, fields) {
  await ensure();
  const disputes = await readFile(DISPUTES_FILE);
  const idx = disputes.findIndex(d => d.id === id);
  if (idx === -1) return null;
  disputes[idx] = { ...disputes[idx], ...fields };
  await writeFile(DISPUTES_FILE, disputes);
  return disputes[idx];
}

// LEDGER — append-only, never delete or mutate existing entries
/**
 * Append a new ledger entry.
 * @param {Object} entry
 * @param {number} entry.transaction_id
 * @param {number} entry.amount        - positive = CREDIT, negative = DEBIT
 * @param {string} entry.type          - 'CREDIT' | 'DEBIT'
 * @param {string} entry.reference     - human-readable description
 */
async function addLedgerEntry({ transaction_id, amount, type, reference }) {
  await ensure();
  const ledger = await readFile(LEDGER_FILE);
  const id = (ledger[ledger.length - 1]?.id || 0) + 1;
  const entry = {
    id,
    transaction_id,
    amount,
    type,
    reference,
    created_at: new Date().toISOString(),
  };
  ledger.push(entry);
  await writeFile(LEDGER_FILE, ledger);
  return entry;
}

async function getLedgerForTransaction(transaction_id) {
  await ensure();
  const ledger = await readFile(LEDGER_FILE);
  return ledger.filter(e => e.transaction_id === transaction_id);
}

// NOTIFICATIONS
async function addNotification({ userId, type, title, body, referenceId, referenceType }) {
  await ensure();
  const notifications = await readFile(NOTIFICATIONS_FILE);
  const id = (notifications[notifications.length - 1]?.id || 0) + 1;
  const n = {
    id,
    user_id: userId,
    type,
    title,
    body,
    reference_id: referenceId || null,
    reference_type: referenceType || null,
    read_at: null,
    created_at: new Date().toISOString(),
  };
  notifications.push(n);
  await writeFile(NOTIFICATIONS_FILE, notifications);
  return n;
}

async function getNotificationsForUser(userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
  await ensure();
  const notifications = await readFile(NOTIFICATIONS_FILE);
  let result = notifications.filter(n => n.user_id === userId);
  if (unreadOnly) result = result.filter(n => !n.read_at);
  // Newest first
  result = result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return result.slice(offset, offset + limit);
}

async function markNotificationRead(notificationId, userId) {
  await ensure();
  const notifications = await readFile(NOTIFICATIONS_FILE);
  const idx = notifications.findIndex(n => n.id === notificationId && n.user_id === userId);
  if (idx === -1) return null;
  if (notifications[idx].read_at) return notifications[idx]; // already read
  notifications[idx].read_at = new Date().toISOString();
  await writeFile(NOTIFICATIONS_FILE, notifications);
  return notifications[idx];
}

async function markAllNotificationsRead(userId) {
  await ensure();
  const notifications = await readFile(NOTIFICATIONS_FILE);
  let updated = 0;
  for (let i = 0; i < notifications.length; i++) {
    if (notifications[i].user_id === userId && !notifications[i].read_at) {
      notifications[i].read_at = new Date().toISOString();
      updated++;
    }
  }
  await writeFile(NOTIFICATIONS_FILE, notifications);
  return { updated };
}

// KYC VERIFICATIONS
async function addKycVerification({ userId, idType, idNumber, fullName, dateOfBirth, selfieUrl, idDocumentUrl }) {
  await ensure();
  const records = await readFile(KYC_FILE);
  const id = (records[records.length - 1]?.id || 0) + 1;
  const now = new Date().toISOString();
  const record = {
    id,
    user_id: userId,
    status: 'PENDING',
    provider: 'MANUAL',
    provider_ref: null,
    id_type: idType || null,
    id_number: idNumber || null,
    full_name: fullName || null,
    date_of_birth: dateOfBirth || null,
    selfie_url: selfieUrl || null,
    id_document_url: idDocumentUrl || null,
    rejection_reason: null,
    verified_at: null,
    created_at: now,
    updated_at: now,
  };
  records.push(record);
  await writeFile(KYC_FILE, records);
  return record;
}

async function findKycByUserId(userId) {
  await ensure();
  const records = await readFile(KYC_FILE);
  // Return the most recent record for this user
  const userRecords = records.filter(r => r.user_id === userId);
  return userRecords[userRecords.length - 1] || null;
}

async function findKycById(id) {
  await ensure();
  const records = await readFile(KYC_FILE);
  return records.find(r => r.id === id) || null;
}

async function updateKycFields(id, fields) {
  await ensure();
  const records = await readFile(KYC_FILE);
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...fields, updated_at: new Date().toISOString() };
  await writeFile(KYC_FILE, records);
  return records[idx];
}

// ADMIN AUDIT LOG
async function addAuditLogEntry({ adminId, action, targetType, targetId, note, metadata }) {
  await ensure();
  const log = await readFile(AUDIT_FILE);
  const id = (log[log.length - 1]?.id || 0) + 1;
  const entry = {
    id,
    admin_id: adminId,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    note: note || null,
    metadata: metadata || null,
    created_at: new Date().toISOString(),
  };
  log.push(entry);
  await writeFile(AUDIT_FILE, log);
  return entry;
}

async function listAuditLog({ limit = 100, offset = 0 } = {}) {
  await ensure();
  const log = await readFile(AUDIT_FILE);
  return log
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(offset, offset + limit);
}

module.exports = { addUser, findUserByPhone, findUserById, updateUserFields, addTransaction, findTransactionById, findTransactionByCode, listTransactionsForUser, listTransactionsByStatuses, updateTransactionStatus, updateTransactionFields, addDispute, findDisputeById, listDisputesByStatus, updateDisputeFields, addLedgerEntry, getLedgerForTransaction,
  // Notifications
  addNotification, getNotificationsForUser, markNotificationRead, markAllNotificationsRead,
  // KYC
  addKycVerification, findKycByUserId, findKycById, updateKycFields,
  // Admin audit log
  addAuditLogEntry, listAuditLog,
};
