// Shared countdown deadline for the homepage's "hot sale" messaging - used
// by both the top HotSaleBanner and the Flash Deals section's
// FlashCountdown so they always agree on the same time remaining. Purely
// a "sale ends soon" urgency cue (self-resets every 2 hours, per browser)
// rather than a real fixed sale window.
const TWO_HOURS = 2 * 60 * 60 * 1000;
const STORAGE_KEY = "campusmart_timer_reset";

export const getNextResetTime = (): number => {
  const now = Date.now();
  const lastReset = localStorage.getItem(STORAGE_KEY);

  if (!lastReset) {
    const resetTime = now + TWO_HOURS;
    localStorage.setItem(STORAGE_KEY, resetTime.toString());
    return resetTime;
  }

  const resetTime = parseInt(lastReset);

  if (now >= resetTime) {
    const newResetTime = now + TWO_HOURS;
    localStorage.setItem(STORAGE_KEY, newResetTime.toString());
    return newResetTime;
  }

  return resetTime;
};

export const getCountdownParts = (targetTime: number, now: number) => {
  const diff = Math.max(0, targetTime - now);
  return {
    h: String(Math.floor(diff / 3.6e6)).padStart(2, "0"),
    m: String(Math.floor((diff % 3.6e6) / 6e4)).padStart(2, "0"),
    s: String(Math.floor((diff % 6e4) / 1000)).padStart(2, "0"),
  };
};
