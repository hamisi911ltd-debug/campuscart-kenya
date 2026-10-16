import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, RefreshCw, XCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGet, adminPut } from "@/utils/adminApi";
import { toast } from "sonner";

interface Enquiry {
  id: string;
  product_id: string;
  product_title: string | null;
  name: string | null;
  phone: string;
  message: string | null;
  status: "pending" | "available" | "unavailable";
  reply: string | null;
  auto_checked: number;
  created_at: string;
  answered_at: string | null;
  image_url?: string | null;
  price?: number | null;
  source_url?: string | null;
}

const statusStyle: Record<Enquiry["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  available: "bg-green-100 text-green-800",
  unavailable: "bg-red-100 text-red-800",
};

const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminGet("/api/admin/enquiries");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load enquiries");
      setEnquiries(data.enquiries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reply = async (enquiry: Enquiry, status: Enquiry["status"]) => {
    setBusy(enquiry.id + status);
    try {
      const res = await adminPut("/api/admin/enquiries", { id: enquiry.id, status });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save reply");
      toast.success(status === "available" ? "Marked in stock - customer will see it" : "Marked out of stock - customer will see it");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save reply");
    } finally {
      setBusy(null);
    }
  };

  // Opens the customer's own WhatsApp chat with the answer pre-filled.
  const whatsappLink = (e: Enquiry) => {
    const answer =
      e.status === "available" ? "it's in stock and ready to order"
        : e.status === "unavailable" ? "sorry, it's out of stock right now"
          : "we're checking stock and will confirm shortly";
    const text = `Hi ${e.name || "there"}, about "${e.product_title}": ${answer}. - CampusMart`;
    return `https://wa.me/${e.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  };

  const shown = filter === "pending" ? enquiries.filter((e) => e.status === "pending") : enquiries;
  const pendingCount = enquiries.filter((e) => e.status === "pending").length;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">Stock Enquiries</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customers asking if an item is in stock before they pay. Each one also arrives on your WhatsApp.
              Check the stock (use "Check on Kilimall"), then mark it here - the customer sees your confirmed answer.
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold hover:bg-secondary/80"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {f === "pending" ? `Needs reply (${pendingCount})` : `All (${enquiries.length})`}
            </button>
          ))}
        </div>

        {loading && <p className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</p>}
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!loading && !error && shown.length === 0 && (
          <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            {filter === "pending" ? "No enquiries waiting for a reply." : "No enquiries yet."}
          </p>
        )}

        <div className="space-y-3">
          {shown.map((e) => (
            <div key={e.id} className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
              {e.image_url && <img src={e.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="line-clamp-1 text-sm font-bold">{e.product_title || e.product_id}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle[e.status]}`}>{e.status}</span>
                  {e.auto_checked === 1 && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold">Auto-checked</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.name || "Customer"} · <a href={`tel:${e.phone}`} className="font-semibold text-accent">{e.phone}</a> ·{" "}
                  {new Date(e.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {e.message && <p className="mt-1 text-xs">“{e.message}”</p>}
                {e.reply && e.status !== "pending" && <p className="mt-1 text-xs text-muted-foreground">Replied: {e.reply}</p>}

                <div className="mt-2 flex flex-wrap gap-2">
                  {e.source_url && (
                    <a
                      href={e.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80"
                    >
                      <ExternalLink className="h-3 w-3" /> Check on Kilimall
                    </a>
                  )}
                  <button
                    onClick={() => reply(e, "available")}
                    disabled={busy !== null}
                    className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {busy === e.id + "available" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} In stock
                  </button>
                  <button
                    onClick={() => reply(e, "unavailable")}
                    disabled={busy !== null}
                    className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy === e.id + "unavailable" ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />} Out of stock
                  </button>
                  <a
                    href={whatsappLink(e)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-green-600 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-50"
                  >
                    <MessageCircle className="h-3 w-3" /> WhatsApp customer
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEnquiries;
