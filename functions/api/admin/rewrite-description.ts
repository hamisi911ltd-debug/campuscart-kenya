// Cloudflare Pages Function - writes ONE product's own description (admin-only).
// Imported products carry the supplier's wording. This asks Claude to write fresh, original
// introduction text for the product from its facts (name, category, specifications), so the
// shop's pages have text of their own. The specification lists stay as they are - they are facts.
// Needs the ANTHROPIC_API_KEY secret in Cloudflare; without it the endpoint says so and does nothing.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { shortProductTitle } from "../_lib/productTitle";

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY?: string;
  DESCRIPTION_MODEL?: string;
}

const HEADINGS = ["Specifications", "Available options", "In the box"];
const DEFAULT_MODEL = "claude-haiku-5-5";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let flagReady = false;
async function ensureFlag(env: Env) {
  if (flagReady) return;
  try { await env.DB.prepare("ALTER TABLE products ADD COLUMN desc_original INTEGER DEFAULT 0").run(); } catch { /* exists */ }
  flagReady = true;
}
export const resetRewriteFlagCache = () => { flagReady = false; };

/** Splits a stored description into its free-text intro and the structured sections after it. */
export function splitDescription(description: string): { intro: string; rest: string } {
  const lines = description.replace(/\r/g, "").split("\n");
  const at = lines.findIndex((l) => HEADINGS.includes(l.trim()));
  if (at < 0) return { intro: lines.join("\n").trim(), rest: "" };
  return { intro: lines.slice(0, at).join("\n").trim(), rest: lines.slice(at).join("\n").trim() };
}

/** Only keeps plain sentences: no markdown, no links, no claims the model was not given. */
export function cleanIntro(text: string): string | null {
  const cleaned = text
    .replace(/[*_#`>]/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n");
  if (cleaned.length < 120 || cleaned.length > 1400) return null;
  if (/https?:\/\/|www\.|kilimall|jumia|aliexpress/i.test(cleaned)) return null;
  return cleaned;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!(await hasPermission(request, env, "products"))) return json({ error: "Unauthorized" }, 401);
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: "ANTHROPIC_API_KEY is not set in Cloudflare, so descriptions cannot be written yet." }, 503);
  }

  try {
    const body = await request.json() as { productId?: string };
    await ensureFlag(env);
    const product = await env.DB.prepare("SELECT id, title, category, description, desc_original FROM products WHERE id = ?")
      .bind(String(body.productId || ""))
      .first<{ id: string; title: string; category: string | null; description: string | null; desc_original: number | null }>();
    if (!product) return json({ error: "Product not found" }, 404);
    if (product.desc_original === 1) return json({ skipped: true, reason: "Already written" });

    const { intro, rest } = splitDescription(product.description || "");
    const facts = [`Product name: ${shortProductTitle(product.title)}`, product.category ? `Category: ${product.category}` : "", rest ? `Specifications and options:\n${rest}` : "", intro ? `Supplier text (for facts only):\n${intro.slice(0, 900)}` : ""]
      .filter(Boolean).join("\n\n");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: env.DESCRIPTION_MODEL || DEFAULT_MODEL,
        max_tokens: 500,
        system:
          "You write product descriptions for CampusMart Kenya, an online shop for Kenyan shoppers. Write 2 short paragraphs " +
          "(90-150 words total) in clear, natural English: what the product is, who it suits and how it is used day to day in Kenya, " +
          "and what to check before buying. Use ONLY facts given to you; never invent specifications, materials, warranty, brand claims, " +
          "certifications or numbers. Do not copy the supplier text - write in your own words. No markdown, no lists, no headings, " +
          "no emojis, no prices, no links, no mention of other shops.",
        messages: [{ role: "user", content: facts }],
      }),
    });
    if (!res.ok) return json({ error: `The writing service returned ${res.status}` }, 502);
    const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text || "").join("\n");
    const intro2 = cleanIntro(text);
    if (!intro2) return json({ skipped: true, reason: "The written text did not pass the quality check" });

    const next = rest ? `${intro2}\n\n${rest}` : intro2;
    await env.DB.prepare("UPDATE products SET description = ?, desc_original = 1, updated_at = ? WHERE id = ?")
      .bind(next, new Date().toISOString(), product.id).run();
    return json({ success: true, words: intro2.split(/\s+/).length });
  } catch (error) {
    console.error("Rewrite description error:", error);
    return json({ error: "Could not write the description" }, 500);
  }
}
