-- Migration: Update image columns to support base64 data
-- Run this on your D1 database

-- For D1/SQLite, we need to recreate the table since ALTER COLUMN is not supported
-- First, create a backup of existing data
CREATE TABLE products_backup AS SELECT * FROM products;

-- Drop the old table
DROP TABLE products;

-- Recreate with TEXT columns for images
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  image_url TEXT, -- Now supports base64
  images TEXT, -- Now supports base64 JSON array
  quantity_available INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  latitude REAL,
  longitude REAL,
  rating REAL DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  is_available INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Restore data from backup
INSERT INTO products SELECT * FROM products_backup;

-- Drop backup table
DROP TABLE products_backup;

-- Recreate indexes
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_location ON products(location);
