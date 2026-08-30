-- ============================================================
-- Fix: deleting an ordered product has always failed
-- ============================================================
-- order_items.product_id was declared both NOT NULL and with
-- "ON DELETE SET NULL" on its foreign key to products - directly
-- contradictory. Deleting any product that appears in at least one order
-- makes SQLite try to null out that reference to satisfy the FK action,
-- which the NOT NULL constraint then rejects:
--   NOT NULL constraint failed: order_items.product_id
-- This has always been true for the single-product delete, not just the
-- new "Clear All Products" button - it just hadn't been hit yet.
--
-- Fix has two parts:
--   1) product_title / product_image snapshot columns, backfilled from the
--      still-live products table, so an order's line items stay readable
--      (both to the customer and in admin) even after the product itself
--      is deleted - not just technically non-crashing, but still useful.
--   2) Rebuild order_items with product_id nullable, matching what its own
--      ON DELETE SET NULL action requires. SQLite can't ALTER a column's
--      NOT NULL/foreign key directly, so this uses the standard
--      create-copy-drop-rename pattern.
--
-- Run against your D1 database:
--   wrangler d1 execute <DB_NAME> --remote --file=migrations/fix_order_items_product_delete.sql
-- ============================================================

ALTER TABLE order_items ADD COLUMN product_title VARCHAR(255);
ALTER TABLE order_items ADD COLUMN product_image VARCHAR(500);

UPDATE order_items
SET product_title = (SELECT title FROM products WHERE products.id = order_items.product_id)
WHERE product_title IS NULL AND product_id IS NOT NULL;

UPDATE order_items
SET product_image = (SELECT image_url FROM products WHERE products.id = order_items.product_id)
WHERE product_image IS NULL AND product_id IS NOT NULL;

PRAGMA foreign_keys=OFF;

CREATE TABLE order_items_new (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36),
  product_title VARCHAR(255),
  product_image VARCHAR(500),
  quantity INT NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT INTO order_items_new (id, order_id, product_id, product_title, product_image, quantity, price_at_purchase, created_at)
SELECT id, order_id, product_id, product_title, product_image, quantity, price_at_purchase, created_at FROM order_items;

DROP TABLE order_items;
ALTER TABLE order_items_new RENAME TO order_items;

PRAGMA foreign_keys=ON;
