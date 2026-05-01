import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { categories, productsByCategory } from "@/data/products";
import type { ProductWithCategory } from "@/data/products";

const CategoryPage = () => {
  const { slug = "" } = useParams();
  const cat = categories.find((c) => c.slug === slug);
  const [items, setItems] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const products = await productsByCategory(slug);
      setItems(products);
      setLoading(false);
    };
    loadProducts();
  }, [slug]);

  return (
    <PageShell title={cat?.name ?? "Category"}>
      <div className="mb-4 flex flex-wrap gap-2">
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
      {loading ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
          Loading products...
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
          No listings yet in this category. Be the first to <Link to="/sell" className="font-bold text-accent">post one</Link>.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </PageShell>
  );
};

export default CategoryPage;
