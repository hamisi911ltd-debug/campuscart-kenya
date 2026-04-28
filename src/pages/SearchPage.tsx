import { useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { useState } from "react";

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const term = (params.get("q") ?? "").toLowerCase();

  const results = term
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.campus.toLowerCase().includes(term) ||
          (term === "sale" && p.oldPrice)
      )
    : products;

  return (
    <PageShell title={term ? `Results for "${term}"` : "Browse all"}>
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
      {results.length === 0 ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">No matches. Try a different keyword.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {results.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </PageShell>
  );
};

export default SearchPage;
