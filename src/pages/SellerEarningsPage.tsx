import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Banknote, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Withdrawal {
  id: string;
  amount: number;
  phone_number: string;
  status: 'pending' | 'completed' | 'rejected' | 'failed';
  admin_note?: string;
  requested_at: string;
  processed_at?: string;
}

const withdrawalStatusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950' },
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-600 bg-red-50 dark:bg-red-950' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-red-600 bg-red-50 dark:bg-red-950' },
};

const MIN_WITHDRAWAL = 100;

const SellerEarningsPage = () => {
  const { user } = useShop();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadWalletData();
  }, [user, navigate]);

  const loadWalletData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [balanceRes, withdrawalsRes] = await Promise.all([
        fetch(`/api/seller-wallet?user_id=${user.id}`),
        fetch(`/api/wallet/withdraw?user_id=${user.id}`),
      ]);

      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalance(data.balance || 0);
        setTotalEarned(data.totalEarned || 0);
      }

      if (withdrawalsRes.ok) {
        const data = await withdrawalsRes.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const amountNum = Number(amount);
    if (!amountNum || amountNum < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is KES ${MIN_WITHDRAWAL}`);
      return;
    }
    if (amountNum > balance) {
      toast.error('Amount exceeds your wallet balance');
      return;
    }
    if (!phone.trim()) {
      toast.error('Enter the M-Pesa number to send the money to');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: amountNum, phone_number: phone }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal request failed');
      }

      toast.success('Withdrawal request submitted. You will be paid once an admin approves it.');
      setAmount("");
      loadWalletData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Withdrawal request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <PageShell title="Seller Earnings">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white shadow-elevated">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-5 w-5" />
            <h3 className="font-bold">Available Balance</h3>
          </div>
          <div className="text-3xl font-extrabold">KES {balance.toLocaleString()}</div>
          <div className="text-xs opacity-90 mt-1">Total earned from sales: KES {totalEarned.toLocaleString()}</div>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-bold text-foreground mb-3">Cash Out to M-Pesa</h3>
          <form onSubmit={handleWithdraw} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Amount (KES)</label>
              <input
                type="number"
                min={MIN_WITHDRAWAL}
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Minimum KES ${MIN_WITHDRAWAL}`}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">M-Pesa Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || balance < MIN_WITHDRAWAL}
              className="w-full rounded-full gradient-accent py-2.5 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Request Withdrawal
            </button>
            {balance < MIN_WITHDRAWAL && (
              <p className="text-xs text-center text-muted-foreground">
                You need at least KES {MIN_WITHDRAWAL} to cash out
              </p>
            )}
          </form>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-bold text-foreground mb-3">Withdrawal History</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => {
                const config = withdrawalStatusConfig[w.status];
                const Icon = config.icon;
                return (
                  <div key={w.id} className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-foreground">KES {w.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{w.phone_number} · {new Date(w.requested_at).toLocaleDateString()}</p>
                      {w.admin_note && <p className="text-xs text-muted-foreground mt-0.5">{w.admin_note}</p>}
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                      <Icon className="h-3 w-3" /> {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default SellerEarningsPage;
