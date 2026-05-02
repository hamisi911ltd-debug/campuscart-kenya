import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/store/shop";
import { findProduct } from "@/data/products";
import type { ProductWithCategory } from "@/data/products";
import { Heart } from "lucide-react";

const FavoritesPage = () => {
  const { favorites } = useShop();
  const [items, setItems] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      const products = await Promise.all(
        favorites.map(id => findProduct(id))
      );
      setItems(products.filter(Boolean) as ProductWithCategory[]);
      setLoading(false);
    };
    loadFavorites();
  }, [favorites]);

  return (
    <PageShell title="Favorites">
      {loading ? (
        <div className="rounded-2xl bg-card p-10 text-center shadow-card">
          <p className="text-sm text-muted-foreground">Loading favorites...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center shadow-card">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No favorites yet. Tap the heart on items you love.</p>
          <Link to="/" className="mt-4 inline-block rounded-full gradient-accent px-5 py-2 text-sm font-bold text-accent-foreground shadow-accent">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 md:grid-cols-6 md:gap-2">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </PageShell>
  );
};

export default FavoritesPage;
