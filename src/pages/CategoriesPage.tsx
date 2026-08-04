import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useSEO } from "@/hooks/useSEO";
import { categories } from "@/data/products";

const CategoriesPage = () => {
  useSEO({
    title: "All Categories",
    description: "Browse every category on Urban Store Kenya: Electronics, Fashion, Books, Food, Furniture, Stationery and Property. Shop local with fast delivery and secure M-Pesa payments.",
    path: "/categories",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://urbanstore.co.ke/" },
          { "@type": "ListItem", position: 2, name: "All Categories", item: "https://urbanstore.co.ke/categories" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: categories.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          url: `https://urbanstore.co.ke/category/${c.slug}`,
        })),
      },
    ],
  });

  return (
  <div className="min-h-screen bg-background pb-24">
    <div className="sticky top-0 z-30">
      <TopBar />
    </div>

    <main className="mx-auto max-w-7xl px-4 py-4">
      <h1 className="mb-3 text-lg font-extrabold text-foreground">All Categories</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to={`/category/${c.slug}`}
            className="group flex items-center gap-3 rounded-xl bg-card p-3 shadow-card transition hover:shadow-elevated"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              <img
                src={c.img}
                alt={c.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">Shop now</div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </main>

    <BottomNav />
  </div>
  );
};

export default CategoriesPage;
