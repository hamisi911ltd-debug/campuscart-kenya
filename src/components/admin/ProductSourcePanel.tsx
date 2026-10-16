import { useState } from "react";
import { ExternalLink, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { adminPost } from "@/utils/adminApi";
import { toast } from "sonner";

export interface SourceFields {
  id: string;
  price: number;
  src_source?: string | null;
  src_listing_id?: string | null;
  src_url?: string | null;
  src_price?: number | null;
  src_markup?: number | null;
  src_stock?: number | null;
  src_in_stock?: number | null;
  src_checked_at?: string | null;
}

interface LiveResult {
  applied: boolean;
  checkedAt: string;
  live: { price: number | null; listPrice: number | null; stock: number | null; inStock: boolean | null };
  recordedCost: number | null;
  markupPercent: number;
  storePrice: number;
  suggestedPrice: number | null;
}

const ksh = (n: number) => `KES ${Math.round(n).toLocaleString("en-KE")}`;

const stockBadge = (inStock: boolean | null | undefined, stock: number | null | undefined) => {
  if (inStock === true) {
    return <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">In stock{stock != null ? ` (${stock})` : ""}</span>;
  }
  if (inStock === false) {
    return <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">Out of stock</span>;
  }
  return <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">Stock unknown</span>;
};

// Where a product came from: link to the original listing, what it cost,
// what it sells for (margin), and a live check against the source so the
// admin can verify price + stock before buying.
export const ProductSourcePanel = ({ product, onPriceApplied }: {
  product: SourceFields;
  onPriceApplied?: (productId: string, newPrice: number) => void;
}) => {
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [live, setLive] = useState<LiveResult | null>(null);

  if (!product.src_listing_id) return null;

  const url = product.src_url || `https://www.kilimall.co.ke/listing/${product.src_listing_id}`;
  const sellPrice = live?.storePrice ?? product.price;
  const cost = live?.recordedCost ?? product.src_price ?? null;
  const margin = cost ? sellPrice - cost : null;
  const marginPct = cost && cost > 0 ? Math.round(((sellPrice - cost) / cost) * 100) : null;
  const priceChanged = !!live && live.live.price != null && cost != null && Math.round(live.live.price) !== Math.round(cost);
  const checkedAt = live?.checkedAt || product.src_checked_at;

  const check = async (apply = false) => {
    apply ? setApplying(true) : setChecking(true);
    try {
      const res = await adminPost("/api/admin/kilimall-check", { productId: product.id, apply });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setLive(data as LiveResult);
      if (data.applied) {
        onPriceApplied?.(product.id, data.storePrice);
        toast.success(`Price updated to ${ksh(data.storePrice)}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not check Kilimall");
    } finally {
      setChecking(false);
      setApplying(false);
    }
  };

  return (
    <div className="mb-3 rounded-lg border border-border bg-secondary/40 p-2.5 text-xs">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-bold text-accent hover:underline"
          title="Open the original listing"
        >
          <ExternalLink className="h-3 w-3" /> View on Kilimall
        </a>
        {stockBadge(live ? live.live.inStock : product.src_in_stock == null ? null : product.src_in_stock === 1, live ? live.live.stock : product.src_stock)}
      </div>

      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Cost</div>
          <div className="font-bold">{cost ? ksh(cost) : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Sell</div>
          <div className="font-bold">{ksh(sellPrice)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Margin</div>
          <div className={`flex items-center justify-center gap-0.5 font-bold ${margin != null && margin < 0 ? "text-red-600" : "text-green-600"}`}>
            {margin != null ? <><TrendingUp className="h-3 w-3" />{ksh(margin)}{marginPct != null && ` (${marginPct}%)`}</> : "—"}
          </div>
        </div>
      </div>

      {live && live.live.price != null && (
        <div className={`mt-2 rounded p-1.5 ${priceChanged ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"}`}>
          Kilimall now: <strong>{ksh(live.live.price)}</strong>
          {priceChanged && cost != null && <> (was {ksh(cost)}) - your margin has changed</>}
          {!priceChanged && <> - price unchanged</>}
          {live.suggestedPrice != null && live.suggestedPrice !== live.storePrice && (
            <button
              type="button"
              onClick={() => check(true)}
              disabled={applying}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded bg-amber-600 px-2 py-1 font-bold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {applying && <Loader2 className="h-3 w-3 animate-spin" />} Set to 10% markup: {ksh(live.suggestedPrice)}
            </button>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          {checkedAt ? `Checked ${new Date(checkedAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}` : "Not checked yet"}
        </span>
        <button
          type="button"
          onClick={() => check(false)}
          disabled={checking}
          className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground hover:bg-primary-glow disabled:opacity-60"
        >
          {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Check now
        </button>
      </div>
    </div>
  );
};
