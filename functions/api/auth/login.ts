// Cloudflare Pages Function - User Login (by phone number + password)
import { normalizeKenyanPhone } from "../_lib/phone";

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
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
      phone_number: string;
      password: string;
    };

    if (!data.phone_number || !data.password) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["phone_number", "password"]
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const phone = normalizeKenyanPhone(data.phone_number);
    if (!phone) {
      return new Response(JSON.stringify({ error: "Please enter a valid Kenyan phone number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Hash the provided password
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(data.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataToHash);
    const passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    const user = await context.env.DB.prepare(
      "SELECT id, full_name, phone_number, profile_image_url, bio, location, is_seller, seller_rating, is_admin, is_active FROM users WHERE phone_number = ? AND password_hash = ?"
    ).bind(phone, passwordHash).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid phone number or password",
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!(user as any).is_active) {
      return new Response(JSON.stringify({ error: "Account is deactivated" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update last login
    await context.env.DB.prepare(
      "UPDATE users SET last_login = ? WHERE id = ?"
    ).bind(new Date().toISOString(), (user as any).id).run();

    return new Response(JSON.stringify({ success: true, user }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/auth/login error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      stack: err.stack,
      details: "Failed to authenticate user"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
