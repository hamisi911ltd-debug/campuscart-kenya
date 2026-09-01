// Cloudflare Pages Function to upload images to R2
export const onRequestPost: PagesFunction<{ STORAGE: R2Bucket }> = async (context) => {
  try {
    const formData = await context.request.formData();
    const file = formData.get("image") as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No image provided" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "Invalid file type. Only JPG, PNG, and WebP allowed" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: "File too large. Maximum 5MB" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const key = `products/${timestamp}-${randomString}.${extension}`;
    
    // Upload to R2
    await context.env.STORAGE.put(key, file.stream(), {
      httpMetadata: { 
        contentType: file.type 
      },
    });
    
    return new Response(JSON.stringify({ 
      key, 
      url: `/api/images/${key}`,
      size: file.size,
      type: file.type
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      error: "Upload failed",
      message: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
