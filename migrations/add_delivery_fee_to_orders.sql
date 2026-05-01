-- Migration: Add delivery_fee column to orders table
-- Date: 2026-05-02

-- Add delivery_fee column if it doesn't exist
ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10, 2) DEFAULT 0;

-- Update existing orders to have a default delivery fee of 40 KES
UPDATE orders SET delivery_fee = 40 WHERE delivery_fee IS NULL OR delivery_fee = 0;
