#!/usr/bin/env node

/**
 * Script to generate reviews for existing products
 * Run this after deploying to add reviews to products that were posted before the auto-review system
 * 
 * Usage: node scripts/generate-reviews-for-existing-products.js
 */

const reviewNames = [
  'John M.', 'Sarah K.', 'David O.', 'Mary W.', 'Peter N.',
  'Grace A.', 'James T.', 'Lucy M.', 'Michael K.', 'Faith W.',
  'Brian O.', 'Jane N.', 'Kevin M.', 'Rose K.', 'Daniel W.'
];

const reviewComments = [
  'Great product! Exactly as described.',
  'Very satisfied with this purchase. Highly recommend!',
  'Good quality and fast delivery.',
  'Excellent seller, smooth transaction.',
  'Product is in perfect condition. Thank you!',
  'Amazing deal! Worth every shilling.',
  'Quick response from seller. Very professional.',
  'Product exceeded my expectations!',
  'Fair price and good quality.',
  'Would definitely buy from this seller again.',
  'Genuine product, no complaints.',
  'Seller was very helpful and responsive.',
  'Great value for money!',
  'Product arrived as described. Happy with purchase.',
  'Smooth transaction, reliable seller.'
];

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomRating() {
  return 3.5 + Math.random() * 1.4; // 3.5 to 4.9
}

function generateReviewsSQL() {
  console.log('-- SQL Script to Generate Reviews for Existing Products');
  console.log('-- Generated on:', new Date().toISOString());
  console.log('-- Run this in your Cloudflare D1 database\n');
  
  console.log('-- Step 1: Update products without ratings');
  console.log(`UPDATE products 
SET 
  rating = CASE 
    WHEN rating IS NULL OR rating = 0 THEN (3.5 + (ABS(RANDOM()) % 140) / 100.0)
    ELSE rating
  END,
  reviews_count = CASE 
    WHEN reviews_count IS NULL OR reviews_count = 0 THEN (3 + (ABS(RANDOM()) % 47))
    ELSE reviews_count
  END
WHERE rating IS NULL OR rating = 0 OR reviews_count IS NULL OR reviews_count = 0;
`);

  console.log('\n-- Step 2: Generate sample reviews for each product');
  console.log('-- Note: Replace {PRODUCT_ID} with actual product IDs from your database\n');

  // Generate example SQL for creating reviews
  console.log('-- Example: Generate 3-5 reviews for a product');
  console.log('-- Replace PRODUCT_ID_HERE with actual product ID\n');

  const exampleProductId = 'PRODUCT_ID_HERE';
  const numReviews = getRandomInt(3, 5);

  for (let i = 0; i < numReviews; i++) {
    const reviewId = generateUUID();
    const rating = getRandomInt(4, 5); // 4 or 5 stars
    const name = getRandomElement(reviewNames);
    const comment = getRandomElement(reviewComments);
    const daysAgo = getRandomInt(1, 30);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    console.log(`INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, is_verified_purchase, created_at)
VALUES ('${reviewId}', '${exampleProductId}', 'auto-generated', ${rating}, '${comment}', 1, '${date}');
`);
  }

  console.log('\n-- Step 3: To generate reviews for ALL existing products, use this query:');
  console.log(`
-- This is a template - you'll need to run it for each product_id
-- Get all product IDs first:
SELECT id FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM product_reviews);

-- Then for each product_id, run the INSERT statements above
`);
}

// Generate the SQL
generateReviewsSQL();

console.log('\n===========================================');
console.log('INSTRUCTIONS:');
console.log('===========================================');
console.log('1. Copy the SQL output above');
console.log('2. Go to Cloudflare Dashboard > D1 Database');
console.log('3. Run the UPDATE query first to add ratings');
console.log('4. Get list of product IDs without reviews');
console.log('5. For each product, generate and run INSERT statements');
console.log('6. Or use the Cloudflare API to automate this');
console.log('===========================================\n');
