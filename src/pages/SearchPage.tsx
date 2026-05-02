import { useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useState, useEffect } from "react";
import { transformDatabaseProduct } from "@/data/products";

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const sort = params.get("sort") ?? "";
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const term = (params.get("q") ?? "").toLowerCase();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = '/api/products?limit=100';
        
        // Add sorting if specified
        if (sort) {
          url += `&sort=${sort}`;
        }
        
        // Add search term if specified
        if (term) {
          url += `&search=${encodeURIComponent(term)}`;
        }
        
        const response = await fetch(url, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        
        if (response.ok) {
          const data = await response.json();
          setResults(Array.isArray(data) ? data.map(transformDatabaseProduct) : []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [term, sort]);

  const getTitle = () => {
    if (term) return `Results for "${term}"`;
    if (sort === 'trending') return 'Trending Products';
    if (sort === 'newest') return 'Just Listed';
    return 'Browse All Products';
  };

  return (
    <PageShell title={getTitle()}>
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
        <div className="grid grid-cols-2 gap-1 md:grid-cols-6 md:gap-2">
          {results.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </PageShell>
  );
};

export default SearchPage;
