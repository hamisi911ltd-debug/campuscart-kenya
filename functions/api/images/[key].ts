// Cloudflare Pages Function to serve images from R2
export const onRequestGet: PagesFunction<{ STORAGE: R2Bucket }> = async (context) => {
  try {
    const key = decodeURIComponent(context.params.key as string);
    
    // Get object from R2
    const object = await context.env.STORAGE.get(key);
    
    if (!object) {
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
    return new Response("Error fetching image", { status: 500 });
  }
};
