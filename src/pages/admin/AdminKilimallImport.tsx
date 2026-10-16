import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Loader2, CheckCircle2, XCircle, Download, Star, Shuffle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminPost } from "@/utils/adminApi";
import { toast } from "sonner";

// Kept in sync with src/data/products.ts's `categories` array.
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

interface KilimallItem {
  listingId: string;
  title: string;
  image: string;
  price: number;
  listPrice: number | null;
  rating: number;
  reviews: number;
  alreadyImported: boolean;
  /** Set by "Discover mix" - the store category this item belongs in. */
  category?: string;
}

type ImportState = { status: "pending" | "running" | "done" | "failed"; message?: string };

const formatKsh = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

const AdminKilimallImport = () => {
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("auto");
  const [markup, setMarkup] = useState(15);
  const [items, setItems] = useState<KilimallItem[]>([]);
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [discovered, setDiscovered] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, ImportState>>({});
  const [importing, setImporting] = useState(false);

  const runSearch = async (nextPage: number, append: boolean) => {
    if (!query.trim() && !url.trim()) {
      toast.error("Enter a search keyword or paste a Kilimall URL");
      return;
    }
    setSearching(true);
    try {
      const res = await adminPost("/api/admin/kilimall-search", { query, url, page: nextPage });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      const found = data.items as KilimallItem[];
      setItems((prev) => {
        if (!append) return found;
        const known = new Set(prev.map((p) => p.listingId));
        return [...prev, ...found.filter((f) => !known.has(f.listingId))];
      });
      setPage(nextPage);
      setSearched(true);
      if (!append) setSelected(new Set());
      if (found.length === 0) toast.info("No more products found");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  // Random, varied mix across every category - each run is different.
  const runDiscover = async () => {
    setSearching(true);
    try {
      const res = await adminPost("/api/admin/kilimall-discover", { perCategory: 5 });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discover failed");
      setItems(data.items as KilimallItem[]);
      setPage(1);
      setSearched(true);
      setDiscovered(true);
      setSelected(new Set());
      setProgress({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Discover failed");
    } finally {
      setSearching(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectableIds = items.filter((i) => !i.alreadyImported).map((i) => i.listingId);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const handleImport = async () => {
    const ids = items.filter((i) => selected.has(i.listingId) && !i.alreadyImported);
    if (ids.length === 0) return;
    setImporting(true);
    setProgress(Object.fromEntries(ids.map((i) => [i.listingId, { status: "pending" } as ImportState])));

    let ok = 0;
    for (const item of ids) {
      setProgress((p) => ({ ...p, [item.listingId]: { status: "running" } }));
      try {
        const res = await adminPost("/api/admin/kilimall-import", {
          listingId: item.listingId,
          category: item.category || category,
          markupPercent: markup,
          fallbackPrice: item.price,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Import failed");
        ok++;
        setProgress((p) => ({ ...p, [item.listingId]: { status: "done", message: `${data.images} photos` } }));
        setItems((prev) => prev.map((x) => (x.listingId === item.listingId ? { ...x, alreadyImported: true } : x)));
      } catch (err) {
        setProgress((p) => ({
          ...p,
          [item.listingId]: { status: "failed", message: err instanceof Error ? err.message : "Failed" },
        }));
      }
    }

    setSelected(new Set());
    setImporting(false);
    if (ok === ids.length) toast.success(`Imported ${ok} product${ok === 1 ? "" : "s"}`);
    else toast.warning(`Imported ${ok} of ${ids.length} - see errors below`);
  };

  const previewSell = (price: number) => formatKsh(Math.round(price * (1 + markup / 100)));

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">Import from Kilimall</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Search Kilimall, tick the products you want, and they're added to your store with their photos, description and
            specs. Photos are copied to your own storage.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6 space-y-4">
          <form
            onSubmit={(e) => { e.preventDefault(); setDiscovered(false); runSearch(1, false); }}
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword, e.g. samsung phone"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="...or paste a Kilimall search/category URL"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={searching}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-glow transition disabled:opacity-50"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
            </button>
          </form>

          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-bold">Not sure what to add?</span> Pull a random mix of general products from every
              category - different each time. Each one is filed under its own category.
            </p>
            <button
              type="button"
              onClick={runDiscover}
              disabled={searching || importing}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />} Discover random mix
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Category for imported products
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-normal"
              >
                <option value="auto">Auto-detect from each product (recommended)</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name} (if it can't tell)</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Your markup on Kilimall's price (%)
              <input
                type="number"
                min={0}
                max={500}
                value={markup}
                onChange={(e) => setMarkup(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-normal"
              />
            </label>
          </div>
        </div>

        {searched && (
          <>
            <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/95 px-4 py-3 backdrop-blur">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={importing || selectableIds.length === 0}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(selectableIds))}
                />
                Select all ({selected.size} selected)
              </label>
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-glow transition disabled:opacity-50"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Import {selected.size || ""} selected
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const state = progress[item.listingId];
                const isSelected = selected.has(item.listingId);
                return (
                  <button
                    key={item.listingId}
                    type="button"
                    disabled={item.alreadyImported || importing}
                    onClick={() => toggle(item.listingId)}
                    className={`relative flex flex-col overflow-hidden rounded-xl border text-left transition ${
                      isSelected ? "border-primary ring-2 ring-primary" : "border-border"
                    } ${item.alreadyImported ? "opacity-60" : "hover:border-primary"} bg-white dark:bg-gray-800`}
                  >
                    <img src={item.image} alt="" loading="lazy" className="aspect-square w-full object-cover bg-secondary" />
                    {isSelected && <CheckCircle2 className="absolute right-2 top-2 h-6 w-6 rounded-full bg-white text-primary" />}
                    {item.category && !item.alreadyImported && (
                      <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold capitalize text-white">
                        {CATEGORIES.find((c) => c.slug === item.category)?.name ?? item.category}
                      </span>
                    )}
                    {item.alreadyImported && (
                      <span className="absolute left-2 top-2 rounded bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">Imported</span>
                    )}
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p className="line-clamp-2 text-xs font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <div className="mt-auto">
                        <p className="text-xs text-muted-foreground">Kilimall {formatKsh(item.price)}</p>
                        <p className="text-sm font-bold text-primary">You sell: {previewSell(item.price)}</p>
                        {item.reviews > 0 && (
                          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {item.rating.toFixed(1)} ({item.reviews})
                          </p>
                        )}
                      </div>
                      {state && (
                        <p className={`flex items-center gap-1 text-[11px] font-semibold ${
                          state.status === "failed" ? "text-red-600" : state.status === "done" ? "text-green-600" : "text-muted-foreground"
                        }`}>
                          {state.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                          {state.status === "done" && <CheckCircle2 className="h-3 w-3" />}
                          {state.status === "failed" && <XCircle className="h-3 w-3" />}
                          {state.status === "pending" ? "Waiting..." : state.status === "running" ? "Importing..." : state.message}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {items.length > 0 && !discovered && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => runSearch(page + 1, true)}
                  disabled={searching || importing}
                  className="flex items-center gap-2 rounded-xl bg-secondary px-6 py-2.5 text-sm font-bold text-foreground hover:bg-secondary/80 transition disabled:opacity-50"
                >
                  {searching && <Loader2 className="h-4 w-4 animate-spin" />} Load more
                </button>
              </div>
            )}
            {items.length === 0 && !searching && (
              <p className="py-10 text-center text-sm text-muted-foreground">No products found for that search.</p>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminKilimallImport;
