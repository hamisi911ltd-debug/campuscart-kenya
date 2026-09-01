import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { getNextResetTime, getCountdownParts } from "@/lib/hotSaleTimer";

// Prominent urgency banner for the very top of the homepage - shares its
// countdown deadline with FlashCountdown (in the Flash Deals section
// further down) so both always show the same time remaining.
export const HotSaleBanner = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const targetTime = getNextResetTime();
  const { h, m, s } = getCountdownParts(targetTime, now);

  return (
    <div className="bg-gradient-to-r from-red-600 to-orange-500">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-primary-foreground">
        <Flame className="h-4 w-4 shrink-0 fill-current" />
        <span className="text-xs font-extrabold uppercase tracking-wide sm:text-sm">Hot Sale</span>
        <span className="hidden text-xs sm:inline">— prices this low won't last</span>
        <div className="ml-1 flex shrink-0 items-center gap-1">
          <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs font-bold">{h}</span>
          <span className="font-bold">:</span>
          <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs font-bold">{m}</span>
          <span className="font-bold">:</span>
          <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs font-bold">{s}</span>
        </div>
      </div>
    </div>
  );
};
