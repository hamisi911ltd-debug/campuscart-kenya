// Cloudflare Pages Function - Step 2 of password reset: verify the code
// the customer received on WhatsApp and set their new password.
import { normalizeKenyanPhone } from "../../_lib/phone";
import { checkVerificationCode } from "../../_lib/twilioVerify";

interface Env {
  DB: D1Database;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.request.json() as {
      phone_number?: string;
      code?: string;
      new_password?: string;
    };

    if (!data.phone_number || !data.code || !data.new_password) {
      return new Response(JSON.stringify({
        error: "Phone number, code and new password are all required",
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (data.new_password.length < 6) {
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

    const user = await context.env.DB.prepare(
      "SELECT id FROM users WHERE phone_number = ?"
    ).bind(phone).first() as { id: string } | null;

    if (!user) {
      return new Response(JSON.stringify({ error: "No account found with that phone number" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let approved: boolean;
    try {
      approved = await checkVerificationCode(context.env, phone, data.code);
    } catch (err: any) {
      if (err.message === "WHATSAPP_NOT_CONFIGURED") {
        return new Response(JSON.stringify({
          error: "Password reset via WhatsApp isn't set up yet. Please contact support for help.",
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    if (!approved) {
      return new Response(JSON.stringify({ error: "That code is invalid or has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data.new_password));
    const passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    await context.env.DB.prepare(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?"
    ).bind(passwordHash, new Date().toISOString(), user.id).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/auth/forgot-password/reset error:', err);
    return new Response(JSON.stringify({ error: "Failed to reset password" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
