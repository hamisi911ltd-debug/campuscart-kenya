-- Migration: Add original_price column and update ratings
-- Run this on your D1 database

-- Add original_price column
ALTER TABLE products ADD COLUMN original_price REAL;

-- Update existing products with original_price (15-35% above current price)
-- This creates realistic discount scenarios
UPDATE products 
SET original_price = ROUND(price * (1 + (ABS(RANDOM() % 20) + 15) / 100.0), 2)
WHERE original_price IS NULL;

-- Update ratings to realistic values (3.5 to 4.9)
UPDATE products 
SET rating = ROUND((ABS(RANDOM() % 140) + 350) / 100.0, 1)
WHERE rating = 0 OR rating IS NULL;

-- Update review counts to realistic values (3 to 49)
UPDATE products 
SET reviews_count = ABS(RANDOM() % 47) + 3
WHERE reviews_count = 0 OR reviews_count IS NULL;

-- Verify the changes
SELECT id, title, price, original_price, rating, reviews_count 
FROM products 
LIMIT 5;
