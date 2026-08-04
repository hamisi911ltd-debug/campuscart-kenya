import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Loader2, Banknote, Smartphone, X } from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  reference_type?: string;
  balance_after: number;
  created_at: string;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

const WalletPage = () => {
  const { user, refreshUser } = useShop();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWallet();
  }, [user]);

  const loadWallet = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        fetch(`/api/wallet?user_id=${user.id}`),
        fetch(`/api/wallet/transactions?user_id=${user.id}`),
      ]);
      if (balRes.ok) {
        const data = await balRes.json();
        setBalance(data.balance || 0);
      }
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
    } catch {
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Poll a top-up until it completes/fails or times out (~2 min).
  const pollTopup = useCallback(async (topupId: string) => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/wallet/topup?topup_id=${topupId}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === "completed") {
          toast.success(`Top-up successful! KES ${Number(data.amount).toLocaleString()} added.`);
          await loadWallet();
          await refreshUser();
          return;
        }
        if (data.status === "failed") {
          toast.error("Top-up was not completed. No money was deducted.");
          return;
        }
      } catch {
        // keep polling
      }
    }
    toast("Still waiting for M-Pesa confirmation. Pull to refresh in a moment.");
    await loadWallet();
  }, [loadWallet, refreshUser]);

  const handleTopup = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    const amt = Number(amount);
    if (!amt || amt < 10) {
      toast.error("Minimum top-up is KES 10");
      return;
    }
    if (!phone.trim()) {
      toast.error("Enter your M-Pesa number");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount: amt, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Top-up failed");

      toast.success(data.message || "Check your phone for the M-Pesa prompt.");
      setShowTopup(false);
      setAmount("");
      pollTopup(data.topup_id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Top-up failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <PageShell title="My Wallet" noIndex>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground shadow-elevated">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 opacity-90">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-semibold">Wallet Balance</span>
            </div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">
              KES {balance.toLocaleString()}
            </div>
            <button
              onClick={() => setShowTopup(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.03] transition"
            >
              <Plus className="h-4 w-4" /> Top Up
            </button>
          </div>
        </div>

        {/* Info strip */}
        <div className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-3 text-xs text-foreground">
          <Smartphone className="h-4 w-4 shrink-0 text-accent" />
          Top up instantly with M-Pesa and pay for orders straight from your balance at checkout.
        </div>

        {/* Transactions */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Banknote className="h-4 w-4 text-accent" />
            <h3 className="font-bold text-foreground">Transactions</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet. Top up to get started.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => {
                const credit = t.type === "credit";
                return (
                  <div key={t.id} className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${credit ? "bg-green-100 text-green-600 dark:bg-green-950" : "bg-red-100 text-red-600 dark:bg-red-950"}`}>
                        {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${credit ? "text-green-600" : "text-red-600"}`}>
                        {credit ? "+" : "−"}KES {Number(t.amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Bal: KES {Number(t.balance_after).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top-up sheet */}
      {showTopup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setShowTopup(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold">Top Up Wallet</h3>
              <button onClick={() => setShowTopup(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleTopup} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${Number(amount) === a ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-foreground hover:border-accent"}`}
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Amount (KES)</label>
                <input
                  type="number"
                  min={10}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">M-Pesa Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full gradient-accent py-3 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                {submitting ? "Sending M-Pesa prompt..." : "Pay with M-Pesa"}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default WalletPage;
