// Cloudflare Pages Function - PayHero payment webhook
// Called by PayHero's servers (not the browser) once an STK push resolves.
import { parseCallbackPayload, type JsonRecord } from "../_lib/payhero";
import { settleOrderPayment } from "../_lib/settlePayment";
import { settleWalletTopup } from "../_lib/settleWallet";

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const rawText = await request.text();
  let body: JsonRecord = {};
  try {
    body = rawText ? JSON.parse(rawText) : {};
  } catch {
    // fall through with an empty body; the raw text is still logged below
  }

  const parsed = parseCallbackPayload(body);

  await env.DB.prepare(`
    INSERT INTO payhero_callback_logs (id, order_id, raw_payload)
    VALUES (?, ?, ?)
  `).bind(crypto.randomUUID(), parsed.externalReference || null, rawText).run();

  // Always acknowledge receipt so PayHero doesn't endlessly retry, even if we
  // can't fully make sense of the payload (it's logged above for follow-up).
  const ack = () => new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });

  if (!parsed.externalReference) return ack();

  // Customer wallet top-ups use a "WALLET-<topupId>" reference; everything else
  // is an order id.
  if (parsed.externalReference.startsWith("WALLET-")) {
    const topupId = parsed.externalReference.slice("WALLET-".length);
    await settleWalletTopup(env, topupId, parsed);
    return ack();
  }

  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(parsed.externalReference).first();
  if (!order) return ack();

  await settleOrderPayment(env, order, parsed);

  return ack();
}
