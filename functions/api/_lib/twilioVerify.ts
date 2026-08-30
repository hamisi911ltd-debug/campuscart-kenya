// Sends and checks one-time verification codes over WhatsApp using Twilio
// Verify (its "Verify" product, not a raw messaging call - Twilio owns
// generating the code, expiry and rate-limiting, so this repo doesn't need
// its own code/expiry table).
//
// Requires three Cloudflare Pages environment variables to actually send
// anything - without them, both functions below throw a recognizable
// "WHATSAPP_NOT_CONFIGURED" error that the calling route turns into a clear
// message instead of a raw 500:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_VERIFY_SERVICE_SID   (a Verify Service created in the Twilio
//                                 console, with the WhatsApp channel enabled)
interface TwilioEnv {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
}

function getCredentials(env: TwilioEnv) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("WHATSAPP_NOT_CONFIGURED");
  }
  return { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID };
}

// phoneE164 must already be normalized, e.g. "+254712345678" (see phone.ts).
export async function sendVerificationCode(env: TwilioEnv, phoneE164: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = getCredentials(env);

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phoneE164, Channel: "whatsapp" }),
    }
  );

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to send WhatsApp verification code");
  }
}

// Returns true only if Twilio confirms the code matches and hasn't expired.
export async function checkVerificationCode(
  env: TwilioEnv,
  phoneE164: string,
  code: string
): Promise<boolean> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = getCredentials(env);

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phoneE164, Code: code }),
    }
  );

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Twilio returns 404 for "no pending verification" (expired/never sent)
    // rather than an error worth surfacing verbatim.
    return false;
  }
  return data.status === "approved";
}
