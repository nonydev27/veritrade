const bcrypt = require('bcrypt');
const db = require('./database');
const local = require('./local_store');

const DEV_USERS = [
  { name: 'Test Buyer', phone: '0241234567', password: 'Test123!', role: 'BUYER' },
  { name: 'Admin User', phone: '0249999999', password: 'Admin123!', role: 'ADMIN' },
];

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

async function seedDevUsers() {
  if (process.env.NODE_ENV === 'production') return;

  for (const u of DEV_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);

    if (useLocal) {
      const exists = await local.findUserByPhone(u.phone);
      if (exists) continue;
      await local.addUser({ name: u.name, phone: u.phone, password_hash: hashed, role: u.role });
      console.log(`Dev seed: ${u.phone} (${u.role})`);
      continue;
    }

    try {
      const exists = await db.query('SELECT id FROM users WHERE phone=$1', [u.phone]);
      if (exists.rows.length) continue;
      await db.query(
        'INSERT INTO users(name, phone, password_hash, role, created_at) VALUES($1,$2,$3,$4,NOW())',
        [u.name, u.phone, hashed, u.role],
      );
      console.log(`Dev seed: ${u.phone} (${u.role})`);
    } catch (err) {
      console.warn(`Dev seed skipped for ${u.phone}:`, err.message);
    }
  }
}

module.exports = { seedDevUsers };
