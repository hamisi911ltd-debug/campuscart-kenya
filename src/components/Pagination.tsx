import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  hasMore: boolean;
  onChange: (page: number) => void;
  loading?: boolean;
}

// Prev/Next pager for a product grid fetched one page at a time (see
// getProductsPage in data/products.ts) — no total-page-count is available
// from the API, so this shows "Page N" rather than numbered page links.
export const Pagination = ({ page, hasMore, onChange, loading }: PaginationProps) => {
  if (page === 1 && !hasMore) return null;

  const goTo = (next: number) => {
    onChange(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1 || loading}
        className="flex items-center gap-1 rounded-full bg-muted px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Previous
      </button>
      <span className="text-xs font-bold text-muted-foreground">Page {page}</span>
      <button
        onClick={() => goTo(page + 1)}
        disabled={!hasMore || loading}
        className="flex items-center gap-1 rounded-full gradient-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-accent transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
