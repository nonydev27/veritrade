-- VeriTrade DB initialization

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150),
  phone VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash TEXT NOT NULL,
  role VARCHAR(30) DEFAULT 'BUYER',
  kyc_status VARCHAR(30) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  transaction_code VARCHAR(20) UNIQUE NOT NULL,
  buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  item_description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS ledger (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type VARCHAR(30),
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'OPEN',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,           -- 'TRANSACTION_UPDATE' | 'DISPUTE_UPDATE' | 'KYC_UPDATE' | 'SYSTEM'
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  reference_id INTEGER,                -- transaction_id or dispute_id depending on type
  reference_type VARCHAR(30),          -- 'TRANSACTION' | 'DISPUTE' | 'KYC'
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kyc_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'PENDING',  -- 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED'
  provider VARCHAR(50) DEFAULT 'MANUAL', -- 'MANUAL' | 'SMILE_ID' | etc.
  provider_ref VARCHAR(255),             -- External provider reference/job ID
  id_type VARCHAR(50),                   -- 'GHANA_CARD' | 'PASSPORT' | 'VOTER_ID'
  id_number VARCHAR(100),
  full_name VARCHAR(200),
  date_of_birth DATE,
  selfie_url TEXT,
  id_document_url TEXT,
  rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,          -- 'RESOLVE_DISPUTE' | 'REFUND_BUYER' | 'PAY_SELLER' | 'REVIEW_DISPUTE' | 'KYC_APPROVE' | 'KYC_REJECT'
  target_type VARCHAR(30),               -- 'DISPUTE' | 'TRANSACTION' | 'KYC' | 'USER'
  target_id INTEGER,
  note TEXT,
  metadata JSONB,                        -- Any extra context (old_status, new_status, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_transactions_code ON transactions(transaction_code);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id, created_at);
