import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useSEO } from "@/hooks/useSEO";
import { categories, getProducts } from "@/data/products";

// On phones, the big card grid is one extra tap before you see any actual
// products — go straight to browsing the first category instead, same as
// tapping "Electronics" would. Desktop/tablet keep the grid. Checked as
// lazy initial state (not an effect) so a phone never even paints the grid
// before redirecting.
const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [redirectingOnMobile] = useState(isMobileViewport);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [countsLoaded, setCountsLoaded] = useState(false);

  useEffect(() => {
    if (redirectingOnMobile) {
      navigate(`/category/${categories[0].slug}`, { replace: true });
    }
  }, [redirectingOnMobile, navigate]);

  useEffect(() => {
    const loadCounts = async () => {
      // One fetch of the whole catalog, tallied client-side, rather than a
      // request per category tile.
      const all = await getProducts({ limit: 1000 });
      const tally: Record<string, number> = {};
      const imgs: Record<string, string> = {};
      for (const p of all) {
        tally[p.category] = (tally[p.category] || 0) + 1;
        if (!imgs[p.category] && p.image && p.image !== "/placeholder.svg") {
          imgs[p.category] = p.image;
        }
      }
      setCounts(tally);
      setImages(imgs);
      setCountsLoaded(true);
    };
    loadCounts();
  }, []);

  useSEO({
    title: "All Categories",
    description: "Browse every category on CampusMart Kenya: Phones, Electronics, Appliances, Fashion, Home & Kitchen, Health & Beauty, Baby & Kids and Automotive. Shop local with fast delivery and secure M-Pesa payments.",
    path: "/categories",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://campusmart.co.ke/" },
          { "@type": "ListItem", position: 2, name: "All Categories", item: "https://campusmart.co.ke/categories" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: categories.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          url: `https://campusmart.co.ke/category/${c.slug}`,
        })),
      },
    ],
  });

  if (redirectingOnMobile) return null;

  return (
  <div className="min-h-screen bg-background pb-24">
    <div className="sticky top-0 z-30">
      <TopBar />
    </div>

    <main className="mx-auto max-w-7xl px-4 py-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-accent shadow-accent">
          <LayoutGrid className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold leading-tight text-foreground">Explore Categories</h1>
          <p className="text-xs text-muted-foreground">Everything CampusMart sells, in one place</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to={`/category/${c.slug}`}
            className="group relative isolate aspect-[4/5] overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
          >
            <img
              src={images[c.slug] || c.img}
              alt={c.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            {/* Legibility gradient so white text always reads over any photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            {/* Hairline border for definition on light backgrounds */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/15" />

            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="text-sm font-extrabold leading-tight text-white drop-shadow-sm sm:text-base">
                {c.name}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white/85">
                <span>
                  {countsLoaded
                    ? `${counts[c.slug] || 0} item${counts[c.slug] === 1 ? "" : "s"}`
                    : "Shop now"}
                </span>
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>

    <BottomNav />
  </div>
  );
};

export default CategoriesPage;
