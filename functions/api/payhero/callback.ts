// Cloudflare Pages Function - PayHero payment webhook
// Called by PayHero's servers (not the browser) once an STK push resolves.
//
// SECURITY: this URL is public, so ANYONE can post to it. The message it
// receives is therefore treated as a hint only ("go and check payment X"),
// never as proof. Before any order is marked paid or any wallet credited, we
// ask PayHero's own API about the transaction (using the reference we saved
// when WE started that payment) and settle only from PayHero's answer - and
// only if the amount paid covers what was owed. A forged "payment succeeded"
// message therefore does nothing.
import { checkTransactionStatus, parseCallbackPayload, type JsonRecord, type PayHeroEnv } from "../_lib/payhero";
import { settleOrderPayment } from "../_lib/settlePayment";
import { settleWalletTopup } from "../_lib/settleWallet";

interface Env extends PayHeroEnv {
  DB: D1Database;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const rawText = (await request.text()).slice(0, 20000); // never store an unbounded body
  let body: JsonRecord = {};
  try {
    body = rawText ? JSON.parse(rawText) : {};
  } catch {
    // fall through with an empty body; the raw text is still logged below
  }

  const claimed = parseCallbackPayload(body);

  await env.DB.prepare(`
    INSERT INTO payhero_callback_logs (id, order_id, raw_payload)
    VALUES (?, ?, ?)
  `).bind(crypto.randomUUID(), claimed.externalReference || null, rawText).run();

  // Always acknowledge receipt so PayHero doesn't endlessly retry. (Nothing about
  // the response reveals whether the claim was accepted.)
  const ack = () => new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });

  const ref = claimed.externalReference;
  if (!ref) return ack();

  // Looks up PayHero's own record of the transaction we started for this reference.
  const verify = async (payheroReference: string | null | undefined) => {
    if (!payheroReference) return null; // we never started a payment for it: nothing to verify
    const { success, raw } = await checkTransactionStatus(env, payheroReference);
    if (!success) return null;
    return parseCallbackPayload({ external_reference: ref, ...(raw as JsonRecord) });
  };

  // The paid amount must cover what was owed (a smaller payment doesn't release an order).
  const covers = (paid: number | undefined, owed: number) =>
    paid === undefined || Math.round(paid) >= Math.round(owed);

  try {
    // Customer wallet top-ups use a "WALLET-<topupId>" reference; everything else is an order id.
    if (ref.startsWith("WALLET-")) {
      const topupId = ref.slice("WALLET-".length);
      const topup = await env.DB.prepare(
        "SELECT id, amount, status, payhero_reference FROM wallet_topups WHERE id = ?"
      ).bind(topupId).first<{ id: string; amount: number; status: string; payhero_reference: string | null }>();
      if (!topup || topup.status === "completed" || topup.status === "failed") return ack();

      const verified = await verify(topup.payhero_reference);
      if (verified && covers(verified.amount, Number(topup.amount))) {
        await settleWalletTopup(env, topupId, verified);
      } else if (verified) {
        console.error(`Wallet top-up ${topupId}: paid amount ${verified.amount} is less than ${topup.amount}`);
      }
      return ack();
    }

    const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(ref).first();
    if (!order) return ack();

    const verified = await verify(order.payhero_reference as string | null);
    if (verified && covers(verified.amount, Number(order.total_amount))) {
      await settleOrderPayment(env, order as never, verified);
    } else if (verified) {
      console.error(`Order ${ref}: paid amount ${verified.amount} is less than ${order.total_amount}`);
    }
  } catch (err) {
    console.error("Payment verification failed (nothing was settled):", err);
  }

  return ack();
}
