// Shrinks a customer's review photo in the browser before upload (phone photos are several MB;
// the server accepts 2 MB at most). Returns a WebP, or JPEG where WebP encoding is unavailable.
export async function compressReviewPhoto(file: File, maxSide = 1280): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the photo");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  for (const type of ["image/webp", "image/jpeg"]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82));
    if (blob && blob.type === type && blob.size <= 1_900_000) return blob;
  }
  throw new Error("That photo is too large - please choose a smaller one");
}
