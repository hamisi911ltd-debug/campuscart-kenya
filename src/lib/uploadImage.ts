// Image upload utility - uploads to Cloudflare R2

const MAX_DIMENSION = 1000; // px - plenty for a product page, far lighter than a phone photo
const COMPRESS_ABOVE_BYTES = 150 * 1024;

// Phone photos are routinely 2-5 MB; shown in a product grid that makes pages
// crawl. Downscale + re-encode as WebP in the browser before uploading. Falls
// back to the original file if anything about that fails.
const compressImage = async (file: File): Promise<File> => {
  try {
    if (file.size <= COMPRESS_ABOVE_BYTES || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
};

export const uploadImage = async (original: File): Promise<string> => {
  const file = await compressImage(original);
  // Upload to R2 via API
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url; // Returns "/api/images/products/1234-photo.jpg"
  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
};

// Upload multiple images
export const uploadImages = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadImage(file));
  return Promise.all(uploadPromises);
};

// Validate image file
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and WebP images are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }

  return { valid: true };
};
