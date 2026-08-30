import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Search, Loader2, Download } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGet, adminPost } from "@/utils/adminApi";

const CATEGORIES = [
  { slug: "phones", name: "Phones & Accessories" },
  { slug: "electronics", name: "Electronics" },
  { slug: "computing", name: "Computing" },
  { slug: "appliances", name: "Appliances" },
  { slug: "fashion", name: "Fashion" },
  { slug: "home", name: "Home & Kitchen" },
  { slug: "beauty", name: "Health & Beauty" },
  { slug: "baby", name: "Baby & Kids" },
  { slug: "gaming", name: "Gaming" },
  { slug: "watches", name: "Watches & Jewellery" },
];

interface CJResult {
  pid: string;
  name: string;
  image: string;
  sellPrice: number;
  categoryName?: string;
}

// USD -> KES is a manual placeholder here rather than a live rate lookup —
// update it to whatever rate you're actually working with, or just adjust
// each item's price in the form before importing.
const USD_TO_KES = 130;
const DEFAULT_MARKUP = 1.6; // 60% markup over CJ's cost as a starting point

const AdminCJImport = () => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CJResult[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [categoryFor, setCategoryFor] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState<Record<string, boolean>>({});

  const search = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await adminGet(`/api/admin/cj-search?keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed");

      setResults(data.results || []);
      const nextPrices: Record<string, string> = {};
      const nextCategories: Record<string, string> = {};
      for (const r of data.results || []) {
        nextPrices[r.pid] = Math.round(r.sellPrice * USD_TO_KES * DEFAULT_MARKUP).toString();
        nextCategories[r.pid] = CATEGORIES[0].slug;
      }
      setPrices((prev) => ({ ...nextPrices, ...prev }));
      setCategoryFor((prev) => ({ ...nextCategories, ...prev }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const importProduct = async (r: CJResult) => {
    const sellPrice = parseFloat(prices[r.pid]);
    if (!sellPrice || sellPrice <= 0) {
      toast.error("Set a valid sell price first");
      return;
    }

    setImporting((prev) => ({ ...prev, [r.pid]: true }));
    try {
      const response = await adminPost("/api/admin/cj-import", {
        pid: r.pid,
        category: categoryFor[r.pid] || CATEGORIES[0].slug,
        sellPrice,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed");

      toast.success(`Imported: ${r.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting((prev) => ({ ...prev, [r.pid]: false }));
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Link to="/admin/products" className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Import from CJdropshipping</h1>
          <p className="text-sm text-muted-foreground">
            Search CJ's catalog, set your sell price, and import. Imported products are flagged as
            supplier-sourced with a "ships in 2-4 weeks" note — when an order comes in for one, you place the
            matching order on CJdropshipping yourself and they ship it to the customer directly.
          </p>
        </div>

        <form onSubmit={search} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search CJ products, e.g. 'wireless earbuds'"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-glow transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {results.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-10">
            Search for a product to get started. Requires a CJ_API_KEY set in your Cloudflare Pages
            environment variables.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((r) => (
            <div key={r.pid} className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="h-40 bg-secondary">
                <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground line-clamp-2">{r.name}</h3>
                <p className="text-xs text-muted-foreground">CJ cost: ${r.sellPrice.toFixed(2)}</p>

                <label className="block">
                  <span className="text-xs font-semibold text-foreground">Your sell price (KES)</span>
                  <input
                    type="number"
                    value={prices[r.pid] ?? ""}
                    onChange={(e) => setPrices((prev) => ({ ...prev, [r.pid]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-foreground">Category</span>
                  <select
                    value={categoryFor[r.pid] ?? CATEGORIES[0].slug}
                    onChange={(e) => setCategoryFor((prev) => ({ ...prev, [r.pid]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </label>

                <button
                  onClick={() => importProduct(r)}
                  disabled={importing[r.pid]}
                  className="w-full flex items-center justify-center gap-2 rounded-lg gradient-accent py-2 text-sm font-bold text-accent-foreground shadow-accent transition disabled:opacity-50"
                >
                  {importing[r.pid] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Import
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCJImport;
