-- ============================================================
-- Urban Store — FULL DATABASE WIPE (fresh start)
-- ============================================================
-- Deletes ALL rows from every data table so you can start posting
-- products/orders again from scratch. Schema (tables/indexes) is kept.
--
-- ⚠️  IRREVERSIBLE. This removes all users, products, orders, wallets,
--     balances, reviews and history. Admin login is NOT affected
--     (it uses hardcoded credentials, not the users table).
--
-- Run against your D1 database:
--   wrangler d1 execute <DB_NAME> --remote --file=migrations/clear-database.sql
-- (use --local instead of --remote to wipe a local dev DB)
--
-- To KEEP existing user accounts, delete/comment the two marked lines
-- in the "Accounts" section at the bottom before running.
-- ============================================================

-- Some wallet/lucky-code tables are created on demand by the API, so ensure
-- they exist before deleting from them (harmless if they already exist).
CREATE TABLE IF NOT EXISTS user_wallets (id TEXT PRIMARY KEY, user_id TEXT, balance REAL, total_earned REAL, total_spent REAL, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS wallet_transactions (id TEXT PRIMARY KEY, user_id TEXT, type TEXT, amount REAL, description TEXT, reference_type TEXT, reference_id TEXT, balance_before REAL, balance_after REAL, created_at TEXT);
CREATE TABLE IF NOT EXISTS wallet_topups (id TEXT PRIMARY KEY, user_id TEXT, amount REAL, phone_number TEXT, payhero_reference TEXT, status TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS lucky_codes (id TEXT PRIMARY KEY, code TEXT, points REAL, description TEXT, usage_limit INTEGER, used_count INTEGER, expires_at TEXT, is_active INTEGER, created_by TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS lucky_code_redemptions (id TEXT PRIMARY KEY, user_id TEXT, lucky_code_id TEXT, points_earned REAL, redeemed_at TEXT);

-- Orders & payments
DELETE FROM order_status_history;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM payhero_callback_logs;
DELETE FROM platform_revenue;

-- Customer wallets
DELETE FROM wallet_transactions;
DELETE FROM wallet_topups;
DELETE FROM user_wallets;

-- Seller wallets & withdrawals
DELETE FROM seller_wallet_transactions;
DELETE FROM seller_wallets;
DELETE FROM wallet_withdrawals;

-- Promotions
DELETE FROM lucky_code_redemptions;
DELETE FROM lucky_codes;
DELETE FROM coupons;

-- Catalogue & engagement
DELETE FROM product_reviews;
DELETE FROM cart_items;
DELETE FROM favorites;
DELETE FROM products;
DELETE FROM notifications;
DELETE FROM messages;
DELETE FROM seller_stats;

-- Accounts — comment these two lines to KEEP existing users
DELETE FROM user_settings;
DELETE FROM users;
