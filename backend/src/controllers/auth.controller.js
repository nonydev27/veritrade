const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const local = require('../config/local_store');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

async function register(req, res){
  try{
    const { name, phone, password, role } = req.body;
    if(!phone || !password) return res.status(400).json({ error: 'phone and password required' });
    const hashed = await bcrypt.hash(password, 10);
    if(useLocal){
      const exists = await local.findUserByPhone(phone);
      if(exists) return res.status(400).json({ error: 'phone already registered' });
      const user = await local.addUser({ name, phone, password_hash: hashed, role });
      const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return res.json({ user, token });
    }
    const exists = await db.query('SELECT id FROM users WHERE phone=$1', [phone]);
    if(exists.rows.length) return res.status(400).json({ error: 'phone already registered' });
    const result = await db.query(
      'INSERT INTO users(name, phone, password_hash, role, created_at) VALUES($1,$2,$3,$4,NOW()) RETURNING id, name, phone, role, created_at',
      [name, phone, hashed, role || 'BUYER']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ user, token });
  }catch(err){
    console.error(err.message || err);
    res.status(500).json({ error: 'server error' });
  }
}

async function login(req, res){
  try{
    const { phone, password } = req.body;
    if(!phone || !password) return res.status(400).json({ error: 'phone and password required' });
    if(useLocal){
      const user = await local.findUserByPhone(phone);
      if(!user) return res.status(400).json({ error: 'invalid credentials' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if(!ok) return res.status(400).json({ error: 'invalid credentials' });
      const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
    }
    const result = await db.query('SELECT id, name, phone, password_hash, role FROM users WHERE phone=$1', [phone]);
    const user = result.rows[0];
    if(!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if(!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
  }catch(err){
    console.error(err.message || err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { register, login };
