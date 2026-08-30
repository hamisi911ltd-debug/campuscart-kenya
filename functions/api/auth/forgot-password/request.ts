// Cloudflare Pages Function - Step 1 of password reset: send a 6-digit
// code to the account's phone number over WhatsApp via Twilio Verify.
// Twilio owns generating/expiring the code - see _lib/twilioVerify.ts for
// the required environment variables.
import { normalizeKenyanPhone } from "../../_lib/phone";
import { sendVerificationCode } from "../../_lib/twilioVerify";

interface Env {
  DB: D1Database;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.request.json() as { phone_number?: string };

    if (!data.phone_number) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), {
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
    ).bind(phone).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: "No account found with that phone number",
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      await sendVerificationCode(context.env, phone);
    } catch (err: any) {
      if (err.message === "WHATSAPP_NOT_CONFIGURED") {
        console.error("Forgot-password: Twilio WhatsApp credentials are not set (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_VERIFY_SERVICE_SID).");
        return new Response(JSON.stringify({
          error: "Password reset via WhatsApp isn't set up yet. Please contact support for help.",
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    return new Response(JSON.stringify({
      success: true,
      message: "We've sent a 6-digit code to your WhatsApp.",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/auth/forgot-password/request error:', err);
    return new Response(JSON.stringify({ error: "Failed to send verification code" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
