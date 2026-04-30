// Cloudflare Pages Function - User Registration
interface Env {
  DB: D1Database;
}

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.request.json() as RegisterRequest;

    // Validate required fields
    if (!data.email || !data.password || !data.full_name) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: email, password, full_name" 
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate email format
    if (!data.email.includes('@')) {
      return new Response(JSON.stringify({ 
        error: "Invalid email format" 
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user already exists
    const existingUser = await context.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(data.email).first();

    if (existingUser) {
      return new Response(JSON.stringify({ 
        error: "Email already registered" 
      }), { 
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate UUID for user
    const userId = crypto.randomUUID();

    // Hash password (simple hash for now - in production use bcrypt)
    const passwordHash = await hashPassword(data.password);

    // Insert user into database
    await context.env.DB.prepare(
      `INSERT INTO users (
        id, email, password_hash, full_name, phone_number,
        is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`
    ).bind(
      userId,
      data.email.toLowerCase(),
      passwordHash,
      data.full_name,
      data.phone_number || null
    ).run();

    // Create user settings
    await context.env.DB.prepare(
      `INSERT INTO user_settings (id, user_id, created_at)
       VALUES (?, ?, datetime('now'))`
    ).bind(crypto.randomUUID(), userId).run();

    // Return user data (without password)
    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: userId,
        email: data.email.toLowerCase(),
        full_name: data.full_name,
        phone_number: data.phone_number || null
      },
      message: "Account created successfully" 
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to create account",
      message: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// Simple password hashing (use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
