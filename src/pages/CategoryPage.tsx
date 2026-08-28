import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowDownAZ } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useSEO } from "@/hooks/useSEO";
import { categories, productsByCategory, type GetProductsParams } from "@/data/products";
import type { ProductWithCategory } from "@/data/products";

const SORT_OPTIONS: { value: GetProductsParams["sort"]; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "trending", label: "Trending" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const CategoryPage = () => {
  const { slug = "" } = useParams();
  const cat = categories.find((c) => c.slug === slug);
  const [items, setItems] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<GetProductsParams["sort"]>("newest");

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const products = await productsByCategory(slug, sort);
      setItems(products);
      setLoading(false);
    };
    loadProducts();
  }, [slug, sort]);

  useSEO({
    title: cat?.name ?? "Category",
    description: cat
      ? `Shop ${cat.name} on Urban Store Kenya — quality products, fast delivery and secure M-Pesa payments across Kenya.`
      : undefined,
    path: `/category/${slug}`,
    structuredData: cat ? [{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://urbanstore.co.ke/" },
        { "@type": "ListItem", position: 2, name: "All Categories", item: "https://urbanstore.co.ke/categories" },
        { "@type": "ListItem", position: 3, name: cat.name, item: `https://urbanstore.co.ke/category/${slug}` },
      ],
    }] : undefined,
  });

  return (
    <PageShell title={cat?.name ?? "Category"}>
      <div className="mb-3 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to={`/category/${c.slug}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${c.slug === slug ? "gradient-accent text-accent-foreground shadow-accent" : "bg-muted text-foreground hover:bg-secondary"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {loading ? "Loading…" : `${items.length} item${items.length === 1 ? "" : "s"}`}
        </span>
        <label className="flex items-center gap-1.5 text-xs">
          <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as GetProductsParams["sort"])}
            aria-label="Sort products"
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/40"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
          Loading products...
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
          No listings yet in this category. Check back soon!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1 md:grid-cols-6 md:gap-2">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </PageShell>
  );
};

export default CategoryPage;
