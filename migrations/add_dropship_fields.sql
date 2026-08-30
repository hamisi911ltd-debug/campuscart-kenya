-- ============================================================
-- Dropship sourcing fields for products
-- ============================================================
-- Adds the columns needed to distinguish products you already have in
-- hand (regular listings) from products sourced on order through a
-- dropship supplier (e.g. CJdropshipping) — different delivery-time
-- promise, and a reference back to the supplier's product so you know
-- what to actually go order once a customer pays.
--
-- Run against your D1 database:
--   wrangler d1 execute <DB_NAME> --remote --file=migrations/add_dropship_fields.sql
-- ============================================================

ALTER TABLE products ADD COLUMN sourced_from VARCHAR(50);          -- e.g. 'cjdropshipping'; NULL = your own stock
ALTER TABLE products ADD COLUMN external_product_id VARCHAR(100);  -- supplier's product id, to place the fulfillment order later
ALTER TABLE products ADD COLUMN external_sku VARCHAR(100);
ALTER TABLE products ADD COLUMN supplier_cost DECIMAL(10, 2);      -- what you pay the supplier per unit, for margin tracking
ALTER TABLE products ADD COLUMN shipping_note VARCHAR(255);        -- e.g. "Ships in 2-4 weeks — sourced on order"

CREATE INDEX IF NOT EXISTS idx_products_sourced_from ON products(sourced_from);
