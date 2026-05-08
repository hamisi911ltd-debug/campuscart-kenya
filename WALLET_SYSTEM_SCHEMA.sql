-- Wallet System Schema Addition
-- Add to existing DATABASE_SCHEMA.sql

-- ============================================
-- USER WALLETS TABLE
-- ============================================
CREATE TABLE user_wallets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  total_spent DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- WALLET TRANSACTIONS TABLE
-- ============================================
CREATE TABLE wallet_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50), -- lucky_code, order_refund, admin_credit, etc
  reference_id VARCHAR(36), -- coupon_id, order_id, etc
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- LUCKY CODES TABLE (Special type of coupons for wallet credits)
-- ============================================
CREATE TABLE lucky_codes (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  points DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  usage_limit INT DEFAULT 1,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(36), -- admin who created it
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- LUCKY CODE REDEMPTIONS TABLE
-- ============================================
CREATE TABLE lucky_code_redemptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  lucky_code_id VARCHAR(36) NOT NULL,
  points_earned DECIMAL(10, 2) NOT NULL,
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lucky_code_id) REFERENCES lucky_codes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_code (user_id, lucky_code_id)
);

-- ============================================
-- INDEXES FOR WALLET SYSTEM
-- ============================================
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_lucky_codes_code ON lucky_codes(code);
CREATE INDEX idx_lucky_codes_is_active ON lucky_codes(is_active);
CREATE INDEX idx_lucky_code_redemptions_user_id ON lucky_code_redemptions(user_id);