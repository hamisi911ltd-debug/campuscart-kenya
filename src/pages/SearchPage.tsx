import { useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { useState, useEffect } from "react";
import { getProductsPage, type ProductWithCategory, type GetProductsParams } from "@/data/products";

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const sort = (params.get("sort") ?? undefined) as GetProductsParams["sort"] | undefined;
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<ProductWithCategory[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const term = (params.get("q") ?? "").toLowerCase();

  // A new search term or sort starts back at page 1.
  useEffect(() => {
    setPage(1);
  }, [term, sort]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await getProductsPage({ search: term || undefined, sort }, page);
      setResults(result.items);
      setHasMore(result.hasMore);
      setLoading(false);
    };
    fetchProducts();
  }, [term, sort, page]);

  const getTitle = () => {
    if (term) return `Results for "${term}"`;
    if (sort === 'trending') return 'Trending Products';
    if (sort === 'newest') return 'Just Listed';
    return 'Browse All Products';
  };

  return (
    <PageShell title={getTitle()} noIndex>
      <form
        onSubmit={(e) => { e.preventDefault(); setParams(q ? { q } : {}); }}
        className="mb-4 flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search anything..."
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button className="rounded-full gradient-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-accent">Search</button>
      </form>
      {loading ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">Loading products...</p>
      ) : results.length === 0 ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">No matches. Try a different keyword.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 md:gap-2">
            {results.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          <Pagination page={page} hasMore={hasMore} onChange={setPage} loading={loading} />
        </>
      )}
    </PageShell>
  );
};

export default SearchPage;
