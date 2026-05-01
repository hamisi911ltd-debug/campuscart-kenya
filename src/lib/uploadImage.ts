// Image upload utility - converts to base64 for database storage
export const uploadImage = async (file: File): Promise<string> => {
  // Always convert to base64 for database storage
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
