-- Migration script to add frequency and analytics columns to advertisements table
-- Run this if you have an existing advertisements table

-- Add frequency column (how often ad appears in carousel)
ALTER TABLE advertisements ADD COLUMN frequency INT DEFAULT 1;

-- Add analytics columns
ALTER TABLE advertisements ADD COLUMN clicks INT DEFAULT 0;
ALTER TABLE advertisements ADD COLUMN impressions INT DEFAULT 0;

-- Add constraint to frequency column (1-10 range)
-- Note: SQLite doesn't support adding constraints to existing columns
-- For other databases, you can add: ALTER TABLE advertisements ADD CONSTRAINT chk_frequency CHECK (frequency >= 1 AND frequency <= 10);

-- Update existing ads to have default frequency of 1
UPDATE advertisements SET frequency = 1 WHERE frequency IS NULL;
UPDATE advertisements SET clicks = 0 WHERE clicks IS NULL;
UPDATE advertisements SET impressions = 0 WHERE impressions IS NULL;