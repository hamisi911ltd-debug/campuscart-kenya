// Cloudflare Pages Function to serve product images from R2
// Handles: /api/images/products/1777543425964-dnoxfj.jpg
export const onRequest: PagesFunction<{ STORAGE: R2Bucket }> = async (context) => {
  try {
    // Build the R2 key from the URL path segments
    // URL: /api/images/products/1777543425964-dnoxfj.jpg
    // key array: ["1777543425964-dnoxfj.jpg"] or ["subfolder", "file.jpg"]
    const keySegments = context.params.key as string[];
    const key = `products/${keySegments.join("/")}`;
    
    console.log(`Fetching image from R2: ${key}`);
    
    // Get object from R2
    const object = await context.env.STORAGE.get(key);
    
    if (!object) {
      console.error(`Image not found in R2: ${key}`);
      return new Response("Image not found", { status: 404 });
    }
    
    // Set response headers
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
    headers.set("Access-Control-Allow-Origin", "*");
    
    // Copy metadata from R2 object
    if (object.httpMetadata) {
      object.writeHttpMetadata(headers);
    }
    
    return new Response(object.body, { headers });
  } catch (error: any) {
    console.error('Image fetch error:', error);
    return new Response(`Error fetching image: ${error.message}`, { status: 500 });
  }
};
