import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, PackageSearch, XCircle } from "lucide-react";
import { toast } from "sonner";
import { isValidKenyanPhone } from "@/data/deliveryAreas";

interface StockEnquiryProps {
  productId: string;
  productTitle: string;
  user?: { id?: string; name?: string; phone?: string } | null;
}

type Status = "pending" | "available" | "unavailable";
interface Answer { id: string; status: Status; reply: string }

const STORAGE_KEY = "campusmart_stock_enquiries"; // { [productId]: enquiryId }

const readStored = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
};
const writeStored = (productId: string, enquiryId: string) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStored(), [productId]: enquiryId })); } catch { /* optional */ }
};

// "Is it in stock?" before paying. Imported products are answered instantly
// from live stock; others wait for the admin's reply, which this picks up
// (it re-checks while the page is open) and shows in place.
export const StockEnquiry = ({ productId, productTitle, user }: StockEnquiryProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);

  // Pick up an enquiry already sent for this product (and any admin reply).
  useEffect(() => {
    const enquiryId = readStored()[productId];
    if (!enquiryId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const res = await fetch(`/api/enquiries?ids=${enquiryId}`);
        const data = await res.json();
        const row = data.enquiries?.[0];
        if (row && !cancelled) {
          setAnswer({
            id: row.id,
            status: row.status,
            reply: row.reply || "We're checking stock and will reply here shortly.",
          });
          // Once answered there's nothing left to wait for.
          if (row.status !== "pending" && timer) clearInterval(timer);
        }
      } catch { /* try again on the next tick */ }
    };

    load();
    timer = setInterval(() => { if (!cancelled) load(); }, 20000);
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [productId]);

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.phone && !phone) setPhone(user.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.phone]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidKenyanPhone(phone)) {
      toast.error("Enter a valid phone number so we can reach you");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, phone, message, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send your enquiry");
      writeStored(productId, data.id);
      setAnswer({ id: data.id, status: data.status, reply: data.reply });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your enquiry");
    } finally {
      setSending(false);
    }
  };

  const tone =
    answer?.status === "available" ? "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100"
      : answer?.status === "unavailable" ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100";

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Not sure it's in stock?</p>
          <p className="text-xs text-muted-foreground">
            Check availability before you pay - no payment needed to ask.
          </p>
        </div>
        {!open && !answer && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground hover:opacity-90"
          >
            Check availability
          </button>
        )}
      </div>

      {answer && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm ${tone}`} role="status">
          {answer.status === "available" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {answer.status === "unavailable" && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {answer.status === "pending" && <Clock className="mt-0.5 h-4 w-4 shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {answer.status === "available" ? "In stock" : answer.status === "unavailable" ? "Out of stock" : "Checking…"}
            </p>
            <p className="text-xs">{answer.reply}</p>
            <button
              type="button"
              onClick={() => { setAnswer(null); setOpen(true); }}
              className="mt-1 text-xs font-semibold underline"
            >
              Ask again
            </button>
          </div>
        </div>
      )}

      {open && (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <p className="line-clamp-1 text-xs text-muted-foreground">About: {productTitle}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone, e.g. 0712 345 678"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anything to add? e.g. colour / size / how many (optional)"
            maxLength={300}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-bold text-accent-foreground disabled:opacity-60"
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin" />} Ask if it's in stock
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
