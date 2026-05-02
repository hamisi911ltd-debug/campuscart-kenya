-- Migration: Add ratings and reviews to existing products
-- Date: 2026-05-02
-- Purpose: Generate automatic reviews for products that don't have them yet

-- Step 1: Update products that don't have ratings yet
UPDATE products 
SET 
  rating = 3.5 + (ABS(RANDOM()) % 140) / 100.0,  -- Random 3.5 to 4.9
  reviews_count = 3 + (ABS(RANDOM()) % 47)       -- Random 3 to 49
WHERE rating IS NULL OR rating = 0;

-- Step 2: Create sample reviews for existing products
-- This will be done via a separate script since SQL can't easily generate multiple random rows

-- Note: Run the Node.js script after this migration to generate actual review records
