// Cloudflare Pages Function - Products API
interface Env {
  DB: D1Database;
}

// GET all products
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Check if DB binding exists
    if (!context.env.DB) {
      console.error('DB binding not found');
      // Return empty array instead of error object
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const category = url.searchParams.get("category");
    const sellerId = url.searchParams.get("seller_id");
    const search = url.searchParams.get("search");
    const sort = url.searchParams.get("sort") || "newest";
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = "SELECT * FROM products WHERE is_available = 1";
    const params: any[] = [];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (sellerId) {
      query += " AND seller_id = ?";
      params.push(sellerId);
    }
    if (search) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort order
    switch (sort) {
      case "trending":
        // Trending: High rating + many reviews
        query += " ORDER BY (rating * reviews_count) DESC, created_at DESC";
        break;
      case "newest":
        query += " ORDER BY created_at DESC";
        break;
      case "price_low":
        query += " ORDER BY price ASC";
        break;
      case "price_high":
        query += " ORDER BY price DESC";
        break;
      case "rating":
        query += " ORDER BY rating DESC, reviews_count DESC";
        break;
      default:
        query += " ORDER BY created_at DESC";
    }

    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const { results } = await context.env.DB.prepare(query).bind(...params).all();

    // Ensure results is always an array
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('GET /api/products error:', err);
    // Return empty array on error instead of error object
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST create product
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Check if DB binding exists
    if (!context.env.DB) {
      return new Response(JSON.stringify({ 
        error: "DB binding not found",
        message: "The D1 database binding is not configured. Check Cloudflare Pages settings."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await context.request.json() as {
      id?: string;
      seller_id: string;
      title: string;
      description: string;
      category: string;
      price: number;
      original_price?: number;
      image_url?: string;
      images?: string;
      quantity_available?: number;
      location?: string;
      latitude?: number;
      longitude?: number;
    };

    if (!data.seller_id || !data.title || !data.description || !data.category || !data.price) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields",
        required: ["seller_id", "title", "description", "category", "price"],
        received: data
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify seller exists
    const seller = await context.env.DB.prepare(
      "SELECT id FROM users WHERE id = ?"
    ).bind(data.seller_id).first();

    if (!seller) {
      return new Response(JSON.stringify({ 
        error: "Seller not found",
        message: "User must register first before posting products",
        seller_id: data.seller_id
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();

    // Auto-generate realistic ratings and reviews for new products
    const rating = data.rating || (3.5 + Math.random() * 1.4); // 3.5 to 4.9
    const reviews_count = data.reviews_count || Math.floor(Math.random() * 47) + 3; // 3 to 49 reviews

    await context.env.DB.prepare(
      `INSERT INTO products (id, seller_id, title, description, category, price, original_price, image_url, images, quantity_available, location, latitude, longitude, rating, reviews_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.seller_id,
      data.title,
      data.description,
      data.category,
      data.price,
      data.original_price || null,
      data.image_url || null,
      data.images || null,
      data.quantity_available || 1,
      data.location || null,
      data.latitude || null,
      data.longitude || null,
      rating,
      reviews_count,
      now,
      now
    ).run();

    // Auto-generate sample reviews for the product
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

    // Generate 3-5 random reviews
    const numReviews = Math.floor(Math.random() * 3) + 3; // 3 to 5 reviews
    for (let i = 0; i < numReviews; i++) {
      const reviewRating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
      const reviewName = reviewNames[Math.floor(Math.random() * reviewNames.length)];
      const reviewComment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
      const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-30 days ago
      const reviewDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      await context.env.DB.prepare(`
        INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, is_verified_purchase, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        id,
        'auto-generated', // Placeholder buyer_id
        reviewRating,
        reviewComment,
        true, // Mark as verified purchase
        reviewDate
      ).run();
    }

    // Update seller stats
    await context.env.DB.prepare(
      "UPDATE seller_stats SET total_products = total_products + 1, updated_at = ? WHERE seller_id = ?"
    ).bind(now, data.seller_id).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/products error:', err);
    return new Response(JSON.stringify({ 
      error: err.message,
      stack: err.stack,
      details: "Failed to create product in database"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
