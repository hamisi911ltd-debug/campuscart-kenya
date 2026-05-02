// Cloudflare Pages Function - Generate reviews for existing products
// This is an admin endpoint to backfill reviews for products posted before the auto-review system
// Access: POST /api/admin/generate-reviews

interface Env {
  DB: D1Database;
}

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

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Step 1: Get all products without reviews (or with very few reviews)
    const { results: products } = await context.env.DB.prepare(`
      SELECT p.id, p.title, p.seller_id,
             (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count
      FROM products p
      WHERE (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) < 3
    `).all();

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All products already have reviews',
        productsProcessed: 0
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let reviewsCreated = 0;
    let productsUpdated = 0;

    // Step 2: For each product, generate reviews
    for (const product of products) {
      const productId = product.id as string;
      const sellerId = product.seller_id as string;
      const currentReviewCount = (product.review_count as number) || 0;

      // How many reviews to add (target 3-5 total)
      const targetReviews = getRandomInt(3, 5);
      const reviewsToAdd = Math.max(0, targetReviews - currentReviewCount);

      if (reviewsToAdd === 0) continue; // Skip if already has enough reviews

      // Generate reviews
      const allRatings: number[] = [];
      for (let i = 0; i < reviewsToAdd; i++) {
        const reviewId = crypto.randomUUID();
        const reviewRating = getRandomInt(4, 5); // 4 or 5 stars
        allRatings.push(reviewRating);
        const reviewName = getRandomElement(reviewNames);
        const reviewComment = `${reviewName}: ${getRandomElement(reviewComments)}`;
        const daysAgo = getRandomInt(1, 30); // 1-30 days ago
        const reviewDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

        // Use seller_id as buyer_id to avoid foreign key constraint issues
        // Store reviewer name in the comment field prefixed
        await context.env.DB.prepare(`
          INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, is_verified_purchase, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          reviewId,
          productId,
          sellerId, // Use seller_id to satisfy foreign key constraint
          reviewRating,
          reviewComment, // Comment includes reviewer name
          true,
          reviewDate
        ).run();

        reviewsCreated++;
      }

      // Calculate new average rating
      const avgRating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
      const newTotalReviews = currentReviewCount + reviewsToAdd;

      // Update product with new rating and count
      await context.env.DB.prepare(`
        UPDATE products 
        SET rating = ?, reviews_count = ?
        WHERE id = ?
      `).bind(avgRating, newTotalReviews, productId).run();

      productsUpdated++;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Reviews generated successfully',
      productsProcessed: productsUpdated,
      reviewsCreated: reviewsCreated,
      products: products.map((p: any) => ({ id: p.id, title: p.title }))
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Error generating reviews:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Failed to generate reviews'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
