// Cloudflare Pages Function - User Registration
//
// Sign up only collects full name, phone number and password (no email).
// The `users.email` column is still UNIQUE NOT NULL in the schema, so each
// phone-only account gets a synthetic, never-shown internal email derived
// from its phone number - this avoids a live-database migration while the
// real identity/login key becomes the phone number.
import { normalizeKenyanPhone } from "../_lib/phone";

interface Env {
  DB: D1Database;
}

function syntheticEmail(phoneE164: string): string {
  return `${phoneE164.replace(/\D/g, "")}@phone.campusmart.local`;
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
      password: string;
      full_name: string;
      phone_number: string;
      location?: string;
    };

    if (!data.password || !data.full_name || !data.phone_number) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["full_name", "phone_number", "password"],
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (data.password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
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

    const existing = await context.env.DB.prepare(
      "SELECT id FROM users WHERE phone_number = ?"
    ).bind(phone).first();

    if (existing) {
      return new Response(JSON.stringify({
        error: "This phone number is already registered. Try signing in instead.",
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
      syntheticEmail(phone),
      passwordHash,
      data.full_name,
      phone,
      data.location || null,
      now,
      now
    ).run();

    // Create default user settings
    await context.env.DB.prepare(
      `INSERT INTO user_settings (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), id, now, now).run();

    return new Response(JSON.stringify({
      success: true,
      user: { id, full_name: data.full_name, phone_number: phone },
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
