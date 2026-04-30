// Image upload utility for Cloudflare R2
export const uploadImage = async (file: File): Promise<string> => {
  // Check if we're in production (has API endpoint)
  const isProduction = window.location.hostname !== 'localhost';
  
  if (isProduction) {
    // Production: Upload to R2
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
  } else {
    // Development: Use base64 for localStorage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
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
