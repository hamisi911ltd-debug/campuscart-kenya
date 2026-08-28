import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowDownAZ } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useSEO } from "@/hooks/useSEO";
import { categories, productsByCategory, getCategoryImages, type GetProductsParams } from "@/data/products";
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
  const [catImages, setCatImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const products = await productsByCategory(slug, sort);
      setItems(products);
      setLoading(false);
    };
    loadProducts();
  }, [slug, sort]);

  // Real photos for the category-switcher thumbnails (one fetch, reused
  // across every chip regardless of which category is active).
  useEffect(() => {
    getCategoryImages().then(setCatImages);
  }, []);

  useSEO({
    title: cat?.name ?? "Category",
    description: cat
      ? `Shop ${cat.name} on CampusMart Kenya — quality products, fast delivery and secure M-Pesa payments across Kenya.`
      : undefined,
    path: `/category/${slug}`,
    structuredData: cat ? [{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://campusmart.co.ke/" },
        { "@type": "ListItem", position: 2, name: "All Categories", item: "https://campusmart.co.ke/categories" },
        { "@type": "ListItem", position: 3, name: cat.name, item: `https://campusmart.co.ke/category/${slug}` },
      ],
    }] : undefined,
  });

  return (
    <PageShell title={cat?.name ?? "Category"}>
      {/* Hero banner */}
      {cat && (
        <div className="relative mb-4 h-28 overflow-hidden rounded-2xl shadow-card sm:h-36">
          <img
            src={items[0]?.image || catImages[slug] || cat.img}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/60 to-primary/10" />
          <div className="absolute inset-0 flex flex-col justify-center px-5">
            <span className="text-xl font-extrabold text-primary-foreground sm:text-2xl">{cat.name}</span>
            <span className="mt-1 text-xs font-medium text-primary-foreground/85 sm:text-sm">
              {loading ? "Loading products…" : `${items.length} item${items.length === 1 ? "" : "s"} available`}
            </span>
          </div>
        </div>
      )}

      {/* Category switcher */}
      <div className="mb-4 -mx-4 overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-2">
          {categories.map((c) => {
            const active = c.slug === slug;
            return (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-bold transition ${active ? "gradient-accent text-accent-foreground shadow-accent" : "bg-muted text-foreground hover:bg-secondary"}`}
              >
                <span className={`h-6 w-6 shrink-0 overflow-hidden rounded-full ${active ? "ring-2 ring-white/60" : ""}`}>
                  <img src={catImages[c.slug] || c.img} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                </span>
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-end gap-2">
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
