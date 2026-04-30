// Cloudflare Pages Function - User Registration
interface Env {
  DB: D1Database;
}

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
      email: string;
      password: string;
      full_name: string;
      phone_number?: string;
      location?: string;
    };

    if (!data.email || !data.password || !data.full_name) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields",
        required: ["email", "password", "full_name"],
        received: { email: data.email, full_name: data.full_name, has_password: !!data.password }
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if email already exists
    const existing = await context.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(data.email.toLowerCase()).first();

    if (existing) {
      return new Response(JSON.stringify({ 
        error: "Email already registered",
        email: data.email
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Simple password hashing (for production, use a proper hash like bcrypt in a Worker)
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(data.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataToHash);
    const passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    await context.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, phone_number, location, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.email.toLowerCase(),
      passwordHash,
      data.full_name,
      data.phone_number || null,
      data.location || null,
      now,
      now
    ).run();

    // Create default user settings
    await context.env.DB.prepare(
      `INSERT INTO user_settings (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), id, now, now).run();

    // Create default seller stats
    await context.env.DB.prepare(
      `INSERT INTO seller_stats (id, seller_id, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), id, now, now).run();

    return new Response(JSON.stringify({
      success: true,
      user: { id, email: data.email.toLowerCase(), full_name: data.full_name, phone_number: data.phone_number },
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/auth/register error:', err);
    return new Response(JSON.stringify({ 
      error: err.message,
      stack: err.stack,
      details: "Failed to create user account in database"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
