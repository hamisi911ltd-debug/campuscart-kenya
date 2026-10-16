// Cloudflare Pages Function - admin side of customer stock enquiries.
// List every enquiry (newest first) and reply to one: mark the item
// available / unavailable with an optional note the customer sees on the
// product page.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { ensureSourceTables, getSourceForProduct } from "../_lib/productSources";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function authorize(env: Env, request: Request): Promise<Response | null> {
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!(await hasPermission(request, env, "products"))) return json({ error: "Unauthorized" }, 401);
  return null;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const denied = await authorize(env, request);
  if (denied) return denied;

  try {
    await ensureSourceTables(env);
    const { results } = await env.DB.prepare(
      `SELECT e.*, p.image_url, p.price
       FROM product_enquiries e
       LEFT JOIN products p ON p.id = e.product_id
       ORDER BY (e.status = 'pending') DESC, e.created_at DESC
       LIMIT 300`
    ).all<Record<string, unknown>>();

    // Attach the original listing so the admin can check stock themselves.
    const enquiries = await Promise.all(
      (results || []).map(async (row) => {
        const source = await getSourceForProduct(env, String(row.product_id)).catch(() => null);
        return { ...row, source_url: source?.source_url || null };
      })
    );
    return json({ success: true, enquiries });
  } catch (error) {
    console.error("Error listing enquiries:", error);
    return json({ error: "Failed to load enquiries" }, 500);
  }
}

export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const denied = await authorize(env, request);
  if (denied) return denied;

  try {
    const body = await request.json() as { id?: string; status?: string; reply?: string };
    if (!body.id || !["available", "unavailable", "pending"].includes(body.status || "")) {
      return json({ error: "id and a valid status are required" }, 400);
    }
    const defaultReply =
      body.status === "available" ? "Good news - it's in stock. You can order now."
        : body.status === "unavailable" ? "Sorry, this item is out of stock right now."
          : null;
    await ensureSourceTables(env);
    await env.DB.prepare(
      "UPDATE product_enquiries SET status = ?, reply = ?, answered_at = ? WHERE id = ?"
    ).bind(
      body.status,
      (body.reply || "").trim().slice(0, 300) || defaultReply,
      body.status === "pending" ? null : new Date().toISOString(),
      body.id
    ).run();
    return json({ success: true });
  } catch (error) {
    console.error("Error replying to enquiry:", error);
    return json({ error: "Failed to save reply" }, 500);
  }
}
