-- Migration: PayHero payments, order tracking history, seller earnings & cashout
-- Date: 2026-07-05

-- ============================================
-- ORDERS: payment + confirmation tracking
-- ============================================
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN payhero_reference TEXT;
ALTER TABLE orders ADD COLUMN confirmed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN confirmed_by VARCHAR(36);

UPDATE orders SET payment_status = 'unpaid' WHERE payment_status IS NULL;

-- ============================================
-- ORDER STATUS HISTORY (drives the real tracking timeline)
-- ============================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  status VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- ============================================
-- PAYHERO CALLBACK LOGS (audit trail / debugging safety net)
-- ============================================
CREATE TABLE IF NOT EXISTS payhero_callback_logs (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36),
  raw_payload TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SELLER EARNINGS WALLET (separate from the buyer lucky-code points wallet
-- in user_wallets/wallet_transactions, which is denominated in points, not KES)
-- ============================================
CREATE TABLE IF NOT EXISTS seller_wallets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seller_wallet_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50), -- order_sale, withdrawal, withdrawal_refund
  reference_id VARCHAR(36),
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_seller_wallet_tx_user_id ON seller_wallet_transactions(user_id);

-- ============================================
-- WALLET WITHDRAWALS (cashout requests)
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, rejected, failed
  payhero_reference TEXT,
  admin_note TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user_id ON wallet_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON wallet_withdrawals(status);

-- ============================================
-- PLATFORM REVENUE LEDGER
-- Every paid order's full amount lands in the platform's own PayHero account.
-- Sellers are only ever credited their commission-adjusted item subtotal share
-- (see seller_wallet_transactions), so the delivery fee is never passed through
-- to the seller. This table makes that split explicit and auditable rather
-- than leaving it as an implicit "whatever wasn't credited to a seller".
-- ============================================
CREATE TABLE IF NOT EXISTS platform_revenue (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_platform_revenue_order_id ON platform_revenue(order_id);
