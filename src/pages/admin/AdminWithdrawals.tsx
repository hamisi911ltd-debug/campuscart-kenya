import { useState, useEffect } from "react";
import { Banknote, CheckCircle, XCircle, Clock, type LucideIcon } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGet, adminPut } from "@/utils/adminApi";
import { toast } from "sonner";

interface Withdrawal {
  id: string;
  user_id: string;
  seller_name: string;
  seller_email: string;
  amount: number;
  phone_number: string;
  status: 'pending' | 'completed' | 'rejected' | 'failed';
  admin_note?: string;
  requested_at: string;
  processed_at?: string;
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

const statusIcon: Record<string, LucideIcon> = {
  pending: Clock,
  completed: CheckCircle,
  rejected: XCircle,
  failed: XCircle,
};

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await adminGet('/api/admin/withdrawals');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch withdrawals');
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const response = await adminPut('/api/admin/withdrawals', { id, action });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} withdrawal`);
      toast.success(data.message);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} withdrawal`);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 flex items-center gap-2">
            <Banknote className="h-6 w-6" /> Seller Withdrawals
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {pendingCount} pending request{pendingCount === 1 ? '' : 's'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center shadow-lg border border-border/50">
            <p className="text-muted-foreground">No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const Icon = statusIcon[w.status];
              return (
                <div key={w.id} className="bg-card rounded-xl p-4 shadow-lg border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">KES {w.amount.toLocaleString()}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[w.status]}`}>
                        <Icon className="h-3 w-3" /> {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{w.seller_name} · {w.seller_email}</p>
                    <p className="text-xs text-muted-foreground">To {w.phone_number} · Requested {new Date(w.requested_at).toLocaleString()}</p>
                    {w.admin_note && <p className="text-xs text-muted-foreground mt-1">Note: {w.admin_note}</p>}
                  </div>
                  {w.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(w.id, 'approve')}
                        disabled={actionLoading === w.id}
                        className="px-3 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve & Pay
                      </button>
                      <button
                        onClick={() => handleAction(w.id, 'reject')}
                        disabled={actionLoading === w.id}
                        className="px-3 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-secondary disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
