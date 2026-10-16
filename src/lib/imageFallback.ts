import type { SyntheticEvent } from "react";

// Image onError handler: a failed load (cold edge, flaky mobile network) gets
// ONE automatic retry with a cache-busting query before falling back to the
// placeholder, instead of leaving a broken/blank tile.
export const handleImageError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.retried !== "1" && img.src && !img.src.endsWith("/placeholder.svg")) {
    img.dataset.retried = "1";
    const sep = img.src.includes("?") ? "&" : "?";
    setTimeout(() => { img.src = `${img.src}${sep}r=${Date.now()}`; }, 600);
    return;
  }
  img.onerror = null;
  img.src = "/placeholder.svg";
};
