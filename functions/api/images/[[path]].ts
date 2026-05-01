// Cloudflare Pages Function to serve images from R2
// Catch-all route: /api/images/products/123.jpg → path = ["products", "123.jpg"]
export const onRequestGet: PagesFunction<{ STORAGE: R2Bucket }> = async (context) => {
  try {
    // Get the full path from catch-all params
    const pathArray = context.params.path as string[];
    const key = pathArray.join('/');
    
    if (!key) {
      return new Response("Image path required", { status: 400 });
    }
    
    // Get object from R2
    const object = await context.env.STORAGE.get(key);
    
    if (!object) {
      console.error(`Image not found in R2: ${key}`);
      return new Response("Image not found", { status: 404 });
    }
    
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": object.etag,
      },
    });
  } catch (error: any) {
    console.error('Image fetch error:', error);
    return new Response(`Error fetching image: ${error.message}`, { status: 500 });
  }
};
