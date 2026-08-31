import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowDownAZ } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { useSEO, SITE_URL } from "@/hooks/useSEO";
import { categories, productsByCategory, getCategoryImages, DEFAULT_PAGE_SIZE, type GetProductsParams } from "@/data/products";
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
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<GetProductsParams["sort"]>("newest");
  const [page, setPage] = useState(1);
  const [catImages, setCatImages] = useState<Record<string, string>>({});

  // Changing category or sort starts back at page 1 rather than keeping
  // whatever page you'd scrolled to in the previous listing.
  useEffect(() => {
    setPage(1);
  }, [slug, sort]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const result = await productsByCategory(slug, sort, page);
      setItems(result.items);
      setHasMore(result.hasMore);
      setLoading(false);
    };
    loadProducts();
  }, [slug, sort, page]);

  // Real photos for the category-switcher thumbnails (one fetch, reused
  // across every chip regardless of which category is active).
  useEffect(() => {
    getCategoryImages().then(setCatImages);
  }, []);

  useSEO({
    title: cat?.name ?? "Category",
    description: cat
      ? `Shop ${cat.name} at wholesale prices on CampusMart Kenya — quality products, fast delivery and secure M-Pesa payments across Kenya.`
      : undefined,
    path: `/category/${slug}`,
    structuredData: cat ? [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://campusmart.co.ke/" },
          { "@type": "ListItem", position: 2, name: "All Categories", item: "https://campusmart.co.ke/categories" },
          { "@type": "ListItem", position: 3, name: cat.name, item: `https://campusmart.co.ke/category/${slug}` },
        ],
      },
      // Lists the real products actually shown on this page (this page of
      // results, not the whole category) as Product entities — the more
      // pages Google can see are full of genuine, distinct products with
      // real prices/images, the more of them it has a reason to index and
      // surface individually.
      ...(items.length > 0 ? [{
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: items.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: p.title,
            image: p.image ? (p.image.startsWith("http") ? p.image : `${SITE_URL}${p.image}`) : undefined,
            url: `${SITE_URL}/product/${p.id}`,
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: "KES",
              availability: "https://schema.org/InStock",
              url: `${SITE_URL}/product/${p.id}`,
            },
          },
        })),
      }] : []),
    ] : undefined,
  });

  return (
    <PageShell title={cat?.name ?? "Category"}>
      {/* Hero banner — taller on larger screens so a wide desktop container
          doesn't force such a short/wide crop that the photo is barely
          recognizable; object-cover centers the interesting part either way. */}
      {cat && (
        <div className="relative mb-4 h-28 overflow-hidden rounded-2xl shadow-card sm:h-36 md:h-48 lg:h-60">
          <img
            src={items[0]?.image || catImages[slug] || cat.img}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/60 to-primary/10" />
          <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-8">
            <span className="text-xl font-extrabold text-primary-foreground sm:text-2xl md:text-3xl">{cat.name}</span>
            <span className="mt-1 text-xs font-medium text-primary-foreground/85 sm:text-sm md:text-base">
              {loading
                ? "Loading products…"
                : items.length === 0
                ? "No items yet"
                : `Showing ${(page - 1) * DEFAULT_PAGE_SIZE + 1}–${(page - 1) * DEFAULT_PAGE_SIZE + items.length}`}
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
        <>
          <div className="grid grid-cols-2 gap-1 md:grid-cols-6 md:gap-2">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          <Pagination page={page} hasMore={hasMore} onChange={setPage} loading={loading} />
        </>
      )}
    </PageShell>
  );
};

export default CategoryPage;
