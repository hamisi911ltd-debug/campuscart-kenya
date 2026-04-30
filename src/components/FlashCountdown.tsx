import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

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
  
  return (
    <div className="flex items-center gap-3 text-primary-foreground">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-bold">Flash Deals</span>
      </div>
      <div className="flex items-center gap-1 font-mono text-sm">
        <span className="flex items-center gap-1">
          <span className="rounded bg-background/20 px-1.5 py-0.5 font-bold">{h}</span>
          <span className="text-[9px] opacity-70">hours</span>
        </span>
        <span className="opacity-70">:</span>
        <span className="flex items-center gap-1">
          <span className="rounded bg-background/20 px-1.5 py-0.5 font-bold">{m}</span>
          <span className="text-[9px] opacity-70">mins</span>
        </span>
        <span className="opacity-70">:</span>
        <span className="flex items-center gap-1">
          <span className="rounded bg-background/20 px-1.5 py-0.5 font-bold">{s}</span>
          <span className="text-[9px] opacity-70">secs</span>
        </span>
      </div>
    </div>
  );
};
