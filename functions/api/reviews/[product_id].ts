// Cloudflare Pages Function - Get reviews for a product
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const product_id = context.params.product_id as string;

    if (!product_id) {
      return new Response(JSON.stringify({ error: "Product ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch reviews for the product
    const { results } = await context.env.DB.prepare(`
      SELECT 
        id,
        buyer_id,
        rating,
        comment,
        is_verified_purchase,
        created_at
      FROM product_reviews
      WHERE product_id = ?
      ORDER BY created_at DESC
    `).bind(product_id).all();

    // Transform reviews to frontend format
    const reviews = (results || []).map((review: any) => {
      // Parse name from comment if it's in format "Name: Comment"
      let userName = getRandomName();
      let comment = review.comment || '';
      
      if (comment.includes(':')) {
        const parts = comment.split(':', 2);
        userName = parts[0].trim();
        comment = parts[1].trim();
      }

      return {
        id: review.id,
        userName,
        rating: review.rating,
        comment,
        date: review.created_at,
        verified: review.is_verified_purchase === 1,
      };
    });

    return new Response(JSON.stringify(reviews), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Helper function to generate random names for auto-generated reviews
function getRandomName(): string {
  const names = [
    'John M.', 'Sarah K.', 'David O.', 'Mary W.', 'Peter N.',
    'Grace A.', 'James T.', 'Lucy M.', 'Michael K.', 'Faith W.',
    'Brian O.', 'Jane N.', 'Kevin M.', 'Rose K.', 'Daniel W.'
  ];
  return names[Math.floor(Math.random() * names.length)];
}
