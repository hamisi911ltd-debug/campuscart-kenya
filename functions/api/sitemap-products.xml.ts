// Cloudflare Pages Function - dynamically generated sitemap covering every
// live product page. Individual products aren't in the static sitemap.xml
// (there could be hundreds and it changes constantly), so this is the only
// way search engines reliably discover them beyond following on-site links.
// Referenced from public/robots.txt as an additional Sitemap: entry.
interface Env {
  DB: D1Database;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT id, updated_at FROM products WHERE is_available = 1 ORDER BY updated_at DESC LIMIT 5000"
    ).all();

    const urls = (results || []).map((p: any) => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : "";
      return `  <url>
    <loc>${escapeXml(`https://urbanstore.co.ke/product/${p.id}`)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("sitemap-products.xml error:", err);
    return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=UTF-8" },
    });
  }
};
