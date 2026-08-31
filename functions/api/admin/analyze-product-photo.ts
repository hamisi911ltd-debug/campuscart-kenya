// Cloudflare Pages Function - AI product cataloguing from a single photo
// (admin-only). Given one downscaled product photo, asks a Claude vision
// model for a clean title/description/category/price and returns them as
// JSON - this is what powers "Import from Photos" so the admin doesn't have
// to hand-write a CSV for every item.
//
// Requires an ANTHROPIC_API_KEY Cloudflare Pages environment variable
// (get one at console.anthropic.com) - without it this returns a clear
// "not set up yet" error instead of failing silently. Optionally set
// ANTHROPIC_MODEL to override the default vision model.
import { enforceAdminDomain } from "../_lib/adminDomain";

interface Env {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;
  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;
  return request.headers.get("X-Admin-Session") === "true";
}

// Kept in sync with the `categories` array in src/data/products.ts.
const VALID_CATEGORIES = [
  "phones", "electronics", "computing", "appliances", "fashion",
  "home", "beauty", "baby", "gaming", "watches",
];

const SYSTEM_PROMPT = `You catalog product photos for CampusMart, a wholesale online store in Kenya (campusmart.co.ke). Given one product photo, respond with ONLY a single JSON object (no markdown fences, no other text) with these exact fields:

{
  "title": "Clean, professional product name (not a filename), max 60 characters",
  "description": "1-2 sentence description a shopper would find useful",
  "category": "one of: phones, electronics, computing, appliances, fashion, home, beauty, baby, gaming, watches",
  "price": <integer, realistic Kenyan wholesale price in KES for this item>,
  "original_price": <integer, roughly 30-40% higher than price, to show as a struck-through "was" price>
}

Pick "category" by what the item actually is:
- phones = phones & phone accessories
- electronics = general electronics, small appliances/gadgets
- computing = computers, computer accessories
- appliances = home/kitchen appliances
- fashion = clothing, bags, headwear, hair accessories, scarves
- home = home/kitchen goods, home decor, tools
- beauty = cosmetics, skincare, haircare, nail/beauty tools
- baby = baby and kids items
- gaming = gaming gear
- watches = watches, jewellery, earrings, bracelets

Base the price on realistic Kenyan wholesale/market rates for that category of item - not premium/import retail pricing. If the photo shows several units or colors of the same item, price and describe it as one listing ("assorted colors" etc.), not per unit. If you cannot tell what the product is, still make your best reasonable guess rather than refusing.`;

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!env.ANTHROPIC_API_KEY) {
    console.error("analyze-product-photo: ANTHROPIC_API_KEY is not set.");
    return new Response(JSON.stringify({
      error: "Photo analysis isn't set up yet. Please contact support.",
    }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as { image_base64?: string; media_type?: string };
    if (!body.image_base64 || !body.media_type) {
      return new Response(JSON.stringify({ error: "image_base64 and media_type are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: body.media_type, data: body.image_base64 } },
            { type: "text", text: "Catalog this product photo. Respond with ONLY the JSON object." },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Anthropic API error:", res.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis request failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: any = await res.json();
    const rawText: string = data?.content?.[0]?.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: "AI response was not valid JSON" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "home";
    const price = Number(parsed.price) > 0 ? Math.round(Number(parsed.price)) : 500;
    const original_price = Number(parsed.original_price) > price ? Math.round(Number(parsed.original_price)) : Math.round(price * 1.35);

    return new Response(JSON.stringify({
      success: true,
      title: String(parsed.title || "Untitled Product").slice(0, 80),
      description: String(parsed.description || "").slice(0, 500),
      category,
      price,
      original_price,
      needs_review: !VALID_CATEGORIES.includes(parsed.category),
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing product photo:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze photo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
