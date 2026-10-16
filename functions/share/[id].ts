// Cloudflare Pages Function - /share/<productId>
//
// The store is a client-rendered app, so WhatsApp / Facebook / X crawlers
// (which don't run JavaScript) see an empty page when a product link is
// shared. This route returns a tiny server-rendered page carrying that
// product's Open Graph tags - so the shared link unfurls with the product
// photo, title, price and a short description - and then sends real visitors
// straight on to the normal product page.

interface Env {
  DB: D1Database;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function firstSentence(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const origin = new URL(context.request.url).origin;
  const id = String(context.params.id || "");
  const productUrl = `${origin}/product/${encodeURIComponent(id)}`;

  let title = "CampusMart Kenya";
  let description = "Wholesale prices, real savings. Shop online with M-Pesa.";
  let image = `${origin}/placeholder.svg`;

  try {
    const product = await context.env.DB.prepare(
      "SELECT title, description, price, image_url FROM products WHERE id = ? AND is_available = 1"
    ).bind(id).first<{ title: string; description: string | null; price: number; image_url: string | null }>();

    if (product) {
      title = `${product.title} — KES ${Number(product.price).toLocaleString("en-KE")}`;
      description = firstSentence(product.description || product.title, 160);
      if (product.image_url) {
        image = product.image_url.startsWith("http") ? product.image_url : `${origin}${product.image_url}`;
      }
    }
  } catch (err) {
    console.error("Share page lookup failed:", err);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="CampusMart Kenya">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:url" content="${escapeHtml(productUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<link rel="canonical" href="${escapeHtml(productUrl)}">
<meta http-equiv="refresh" content="0; url=${escapeHtml(productUrl)}">
</head>
<body>
<p>Opening <a href="${escapeHtml(productUrl)}">${escapeHtml(title)}</a>…</p>
<script>location.replace(${JSON.stringify(productUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
