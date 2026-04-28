import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/store/shop";
import { findProduct } from "@/data/products";
import { Heart } from "lucide-react";

const FavoritesPage = () => {
  const { favorites } = useShop();
  const items = favorites.map(findProduct).filter(Boolean) as ReturnType<typeof findProduct>[];

  return (
    <PageShell title="Favorites">
      {items.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center shadow-card">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No favorites yet. Tap the heart on items you love.</p>
          <Link to="/" className="mt-4 inline-block rounded-full gradient-accent px-5 py-2 text-sm font-bold text-accent-foreground shadow-accent">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {items.map((p) => p && <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </PageShell>
  );
};

export default FavoritesPage;
