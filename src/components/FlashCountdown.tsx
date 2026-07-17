import { useEffect, useState } from "react";

const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const getNextResetTime = () => {
  const now = Date.now();
  const lastReset = localStorage.getItem('campusmart_timer_reset');
  
  if (!lastReset) {
    // First time - set reset time to 2 hours from now
    const resetTime = now + TWO_HOURS;
    localStorage.setItem('campusmart_timer_reset', resetTime.toString());
    return resetTime;
  }
  
  const resetTime = parseInt(lastReset);
  
  // If reset time has passed, set new reset time
  if (now >= resetTime) {
    const newResetTime = now + TWO_HOURS;
    localStorage.setItem('campusmart_timer_reset', newResetTime.toString());
    return newResetTime;
  }
  
  return resetTime;
};

export const FlashCountdown = () => {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  
  const targetTime = getNextResetTime();
  const diff = Math.max(0, targetTime - now);
  
  const h = String(Math.floor(diff / 3.6e6)).padStart(2, "0");
  const m = String(Math.floor((diff % 3.6e6) / 6e4)).padStart(2, "0");
  const s = String(Math.floor((diff % 6e4) / 1000)).padStart(2, "0");
  
  // Timer only — the surrounding section supplies its own "Flash Deals" label.
  return (
    <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
      <span className="hidden text-[10px] font-semibold text-muted-foreground sm:inline">Ends in</span>
      <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary-foreground">{h}</span>
      <span className="text-[11px] font-bold text-primary">:</span>
      <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary-foreground">{m}</span>
      <span className="text-[11px] font-bold text-primary">:</span>
      <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary-foreground">{s}</span>
    </div>
  );
};
