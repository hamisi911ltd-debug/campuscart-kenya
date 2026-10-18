import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminFetch, adminGet } from "@/utils/adminApi";

interface ReviewRow {
  id: string;
  product_id: string;
  product_title: string | null;
  rating: number;
  comment: string;
  author_name: string | null;
  image_url: string | null;
  is_verified_purchase: number;
  created_at: string;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await adminGet("/api/admin/reviews");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load reviews");
      setReviews(data.reviews || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this review?")) return;
    const res = await adminFetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Review deleted");
    } else {
      toast.error("Could not delete the review");
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        <h1 className="mb-4 text-2xl font-extrabold">Reviews</h1>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customer reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-3 rounded-xl bg-card p-4 shadow-card">
                {r.image_url && <img src={r.image_url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{r.product_title || "Deleted product"}</p>
                  <div className="my-0.5 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {r.author_name || "Customer"}{r.is_verified_purchase ? " · verified" : ""} · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{r.comment}</p>
                </div>
                <button onClick={() => remove(r.id)} className="self-start rounded-lg p-2 text-destructive hover:bg-destructive/10" aria-label="Delete review">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
