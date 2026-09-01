import { useEffect, useState } from "react";
import { getNextResetTime, getCountdownParts } from "@/lib/hotSaleTimer";

export const FlashCountdown = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const targetTime = getNextResetTime();
  const { h, m, s } = getCountdownParts(targetTime, now);

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
