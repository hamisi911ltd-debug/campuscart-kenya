// Cloudflare Pages Function - User Profile
interface Env {
  DB: D1Database;
}

// GET user profile
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = context.params.id as string;

  const user = await context.env.DB.prepare(
    "SELECT id, email, full_name, phone_number, profile_image_url, bio, location, is_seller, seller_rating, seller_reviews_count, created_at FROM users WHERE id = ?"
  ).bind(userId).first();

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
  });
};

// PATCH update user profile
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const userId = context.params.id as string;
    const data = await context.request.json() as Record<string, any>;

    const allowedFields = ["full_name", "phone_number", "profile_image_url", "bio", "location", "latitude", "longitude", "is_seller"];
    const updates: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: "No valid fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    updates.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(userId);

    await context.env.DB.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...values).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
