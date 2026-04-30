// Cloudflare Pages Function - User Login
interface Env {
  DB: D1Database;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.request.json() as LoginRequest;

    // Validate required fields
    if (!data.email || !data.password) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: email, password" 
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Hash the provided password
    const passwordHash = await hashPassword(data.password);

    // Find user by email and password
    const user = await context.env.DB.prepare(
      `SELECT id, email, full_name, phone_number, profile_image_url, location, is_active
       FROM users 
       WHERE email = ? AND password_hash = ?`
    ).bind(data.email.toLowerCase(), passwordHash).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: "Invalid email or password" 
      }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!user.is_active) {
      return new Response(JSON.stringify({ 
        error: "Account is inactive. Please contact support." 
      }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Update last login time
    await context.env.DB.prepare(
      "UPDATE users SET last_login = datetime('now') WHERE id = ?"
    ).bind(user.id).run();

    // Return user data (without password)
    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        profile_image_url: user.profile_image_url,
        location: user.location
      },
      message: "Login successful" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to login",
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
