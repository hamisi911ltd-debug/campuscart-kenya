// Product badge utility - determines which badge to show on product cards
export function getProductBadge(product: any): { label: string; color: string } {
  const now = Date.now();
  const created = new Date(product.created_at).getTime();
  const hoursSinceCreated = (now - created) / (1000 * 60 * 60);

  // NEW - Posted within last 24 hours
  if (hoursSinceCreated < 24) {
    return { label: "NEW", color: "#10b981" }; // green
  }

  // HOT - High rating with many reviews
  if (product.rating >= 4.5 && product.reviews_count >= 10) {
    return { label: "HOT", color: "#ef4444" }; // red
  }

  // DEAL - Significant discount (20% or more)
  if (product.original_price && product.original_price > product.price) {
    const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);
    if (discount >= 20) {
      return { label: "DEAL", color: "#f59e0b" }; // amber
    }
  }

  // TOP - Good rating with decent reviews
  if (product.reviews_count >= 5 && product.rating >= 4.0) {
    return { label: "TOP", color: "#8b5cf6" }; // purple
  }

  return { label: "", color: "" };
}
