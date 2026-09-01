// Sends a plain WhatsApp text message via Twilio's Messaging API (not the
// Verify product used for OTP codes in _lib/twilioVerify.ts - this is for
// one-off notifications like an order/payment confirmation).
//
// Requires three Cloudflare Pages environment variables:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM   - a WhatsApp-enabled Twilio sender, e.g.
//                            "+14155238886" (Twilio's sandbox number for
//                            testing) or your own approved WhatsApp sender
//                            in production.
//
// Important WhatsApp platform rule, not something this code can route
// around: a message the business sends first (the customer didn't message
// in first) either needs to land inside a 24-hour window after the
// customer last messaged the sender number, or use a template Twilio/Meta
// has pre-approved. Plain text like this works immediately in the Twilio
// Sandbox once the recipient has joined it; in production, order/payment
// confirmations like this one are exactly the kind of message that
// typically needs an approved "utility" template - see Twilio's WhatsApp
// template docs when moving off the sandbox.
interface TwilioEnv {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WHATSAPP_FROM?: string;
}

export async function sendWhatsAppMessage(env: TwilioEnv, toE164: string, body: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    throw new Error("WHATSAPP_NOT_CONFIGURED");
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
        To: `whatsapp:${toE164}`,
        Body: body,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Twilio WhatsApp send failed (${res.status}): ${errText}`);
  }
}
