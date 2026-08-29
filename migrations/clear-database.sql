-- ============================================================
-- CampusMart — DATABASE WIPE (fresh start, KEEPS user accounts)
-- ============================================================
-- Deletes all products, orders, wallets, promotions, reviews and history
-- so you can start posting products again from a clean slate. Schema
-- (tables/indexes) is kept, and so are existing user accounts/logins —
-- the two lines that would delete `users`/`user_settings` are commented
-- out on purpose. Flip this back to a full wipe by uncommenting them.
--
-- ⚠️  IRREVERSIBLE for everything else it touches: products, orders,
--     wallets, balances, reviews, coupons, lucky codes, notifications.
--     Admin login is NOT affected either way (hardcoded credentials, not
--     a users-table row).
--
-- Run against your D1 database, logged into the CORRECT Cloudflare
-- account for this project (check with `wrangler whoami` first):
--   wrangler d1 list                          # find this project's DB name
--   wrangler d1 execute <DB_NAME> --remote --file=migrations/clear-database.sql
-- (use --local instead of --remote to wipe a local dev DB)
--
-- Or paste this file's contents into the Cloudflare dashboard's
-- D1 → your database → Console query editor and run it there.
-- ============================================================

-- Several tables here are created on demand by the API rather than in the
-- base schema, so their existence in any given database isn't guaranteed.
-- These guards make every DELETE below safe to run regardless of history.
CREATE TABLE IF NOT EXISTS order_status_history (id TEXT PRIMARY KEY, order_id TEXT, status TEXT, note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS payhero_callback_logs (id TEXT PRIMARY KEY, order_id TEXT, raw_payload TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS platform_revenue (id TEXT PRIMARY KEY, order_id TEXT, delivery_fee REAL, commission_amount REAL, total_amount REAL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS seller_wallets (id TEXT PRIMARY KEY, user_id TEXT, balance REAL, total_earned REAL, total_withdrawn REAL, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS seller_wallet_transactions (id TEXT PRIMARY KEY, user_id TEXT, type TEXT, amount REAL, description TEXT, reference_type TEXT, reference_id TEXT, balance_before REAL, balance_after REAL, created_at TEXT);
CREATE TABLE IF NOT EXISTS wallet_withdrawals (id TEXT PRIMARY KEY, user_id TEXT, amount REAL, phone_number TEXT, status TEXT, admin_note TEXT, payhero_reference TEXT, requested_at TEXT, processed_at TEXT);
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

-- Customer wallets (top-up/points balance — distinct from seller wallets)
DELETE FROM wallet_transactions;
DELETE FROM wallet_topups;
DELETE FROM user_wallets;

-- Legacy seller wallets & withdrawals (from the pre-single-vendor version;
-- harmless to clear even if empty)
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

-- Accounts — KEPT. Uncomment these two lines for a full wipe including
-- every user's signup/login.
-- DELETE FROM user_settings;
-- DELETE FROM users;
