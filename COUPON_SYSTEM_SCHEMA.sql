-- Coupon System Database Schema

-- ============================================
-- COUPONS TABLE
-- ============================================
CREATE TABLE coupons (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
  maximum_discount_amount DECIMAL(10, 2), -- For percentage discounts
  usage_limit INT DEFAULT NULL, -- NULL = unlimited
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  created_by VARCHAR(36), -- Admin who created it
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- COUPON USAGE TABLE
-- ============================================
CREATE TABLE coupon_usage (
  id VARCHAR(36) PRIMARY KEY,
  coupon_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36), -- If used in an order
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_coupon (coupon_id, user_id) -- One use per user per coupon
);

-- ============================================
-- USER COUPONS TABLE (Redeemed but not used)
-- ============================================
CREATE TABLE user_coupons (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  coupon_id VARCHAR(36) NOT NULL,
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_coupon_redemption (user_id, coupon_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_unused ON user_coupons(is_used);

-- ============================================
-- SAMPLE COUPONS
-- ============================================
INSERT INTO coupons (id, code, name, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, valid_until) VALUES
('coupon-1', 'WELCOME10', 'Welcome Discount', 'Get 10% off your first order', 'percentage', 10.00, 500.00, 1000.00, 100, DATE_ADD(NOW(), INTERVAL 30 DAY)),
('coupon-2', 'SAVE500', 'Save KES 500', 'Get KES 500 off orders above KES 2000', 'fixed_amount', 500.00, 2000.00, NULL, 50, DATE_ADD(NOW(), INTERVAL 15 DAY)),
('coupon-3', 'STUDENT20', 'Student Special', 'Special 20% discount for students', 'percentage', 20.00, 1000.00, 2000.00, NULL, DATE_ADD(NOW(), INTERVAL 60 DAY));