import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

const target = () => {
  const t = new Date();
  t.setHours(23, 59, 59, 0);
  return t;
};

export const FlashCountdown = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target().getTime() - now);
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
