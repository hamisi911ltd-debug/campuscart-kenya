import { useState, useEffect } from "react";
import { Search, Filter, Package, Truck, CheckCircle, Clock, Edit, ShieldCheck, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGet, adminPost, adminPut } from "@/utils/adminApi";
import { toast } from "sonner";

interface Order {
  id: string;
  buyer_name: string;
  buyer_email: string;
  seller_name: string;
  seller_email: string;
  item_count: number;
  total_amount: number;
  status: 'pending' | 'pending_confirmation' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';
  created_at: string;
  updated_at: string;
  delivery_address: string;
  payment_method: string;
  payment_status: 'unpaid' | 'requested' | 'paid' | 'failed';
  delivered_at?: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revenue, setRevenue] = useState<{ total_revenue: number; total_delivery_fees: number; total_commission: number } | null>(null);

  const fetchRevenue = async () => {
    try {
      const response = await adminGet('/api/admin/platform-revenue');
      const data = await response.json();
      if (response.ok) setRevenue(data);
    } catch (err) {
      console.error('Error fetching platform revenue:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminGet('/api/admin/orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }
      
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchRevenue();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await adminPut('/api/admin/orders', {
        id: orderId,
        status: newStatus,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order');
      }
      
      // Update order in local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus as any, updated_at: new Date().toISOString() } : o
      ));
      
      alert(data.message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      alert(`Error: ${errorMessage}`);
      console.error('Error updating order:', err);
    }
  };

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleConfirmAndRequestPayment = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const response = await adminPost('/api/admin/orders/confirm', { order_id: orderId });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request payment');
      }

      toast.success('M-Pesa payment prompt sent to the customer');
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecheckPayment = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const response = await adminGet(`/api/payhero/status?order_id=${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check payment status');
      }

      if (data.order_updated) {
        toast.success(`Payment ${data.payhero_status === 'success' ? 'confirmed' : 'marked failed'}`);
        fetchOrders();
      } else {
        toast.info(`PayHero status: ${data.payhero_status}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to check payment status');
    } finally {
      setActionLoading(null);
    }
  };

  const formatStatusLabel = (status: string) =>
    status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'requested': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.seller_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200';
      case 'confirmed': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200';
      case 'pending': case 'pending_confirmation': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'cancelled': case 'payment_failed': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'confirmed': return <ShieldCheck className="h-4 w-4" />;
      case 'pending': case 'pending_confirmation': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading orders...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">Error: {error}</div>
            <button 
              onClick={fetchOrders}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Order Management</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Track and manage all platform orders</p>
        </div>

        {revenue && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg mb-4 md:mb-6 text-white">
            <p className="text-xs md:text-sm opacity-90 mb-1">Platform Revenue (delivery fees + commission, never shared with sellers)</p>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <p className="text-xl md:text-2xl font-extrabold">KES {revenue.total_revenue.toLocaleString()}</p>
                <p className="text-xs opacity-80">Total kept</p>
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold">KES {revenue.total_delivery_fees.toLocaleString()}</p>
                <p className="text-xs opacity-80">Delivery fees</p>
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold">KES {revenue.total_commission.toLocaleString()}</p>
                <p className="text-xs opacity-80">Commission (10%)</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-border/50 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto pl-9 md:pl-10 pr-8 py-2 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending_confirmation">Pending Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="payment_failed">Payment Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border/50">
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Total Orders</p>
              <p className="text-lg md:text-2xl font-bold text-foreground">{orders.length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
              <p className="text-lg md:text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending' || o.status === 'pending_confirmation').length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Processing</p>
              <p className="text-lg md:text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'processing').length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Shipped</p>
              <p className="text-lg md:text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'shipped').length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Delivered</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
            </div>
          </div>
        </div>

        {/* Orders - Mobile-First Design */}
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-card rounded-xl md:rounded-2xl shadow-lg border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Order ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-accent text-sm">{order.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-foreground text-sm">{order.buyer_name}</span>
                          <div className="text-xs text-muted-foreground">{order.buyer_email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{order.item_count} items</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-accent text-sm">KES {order.total_amount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-foreground">{order.payment_method || 'M-PESA'}</span>
                          <span className={`inline-block w-fit px-2 py-0.5 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                            {formatStatusLabel(order.payment_status || 'unpaid')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {formatStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {(order.status === 'pending' || order.status === 'pending_confirmation') && (
                            <button
                              onClick={() => handleConfirmAndRequestPayment(order.id)}
                              disabled={actionLoading === order.id}
                              className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              <ShieldCheck className="h-3 w-3" /> Confirm & Request Payment
                            </button>
                          )}
                          {order.payment_status === 'requested' && (
                            <button
                              onClick={() => handleRecheckPayment(order.id)}
                              disabled={actionLoading === order.id}
                              className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-semibold rounded border border-border hover:bg-secondary disabled:opacity-50"
                            >
                              <RefreshCw className="h-3 w-3" /> Recheck Payment
                            </button>
                          )}
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-border rounded bg-background focus:ring-2 focus:ring-accent/40 outline-none"
                          >
                            <option value="pending_confirmation">Pending Confirmation</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="payment_failed">Payment Failed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {order.delivery_address && (
                            <div className="text-xs text-muted-foreground truncate max-w-32" title={order.delivery_address}>
                              📍 {order.delivery_address}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="p-8 md:p-12 text-center">
                <p className="text-sm md:text-base text-muted-foreground">No orders found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-card rounded-lg shadow-sm border border-border/50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-mono font-semibold text-accent text-sm mb-1">#{order.id}</div>
                    <div className="text-sm font-medium text-foreground">{order.buyer_name}</div>
                    <div className="text-xs text-muted-foreground">{order.buyer_email}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {formatStatusLabel(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 p-2 bg-secondary/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm font-bold text-accent">KES {order.total_amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">{order.item_count}</div>
                    <div className="text-xs text-muted-foreground">Items</div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <strong>Payment:</strong> {order.payment_method || 'M-PESA'}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                      {formatStatusLabel(order.payment_status || 'unpaid')}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  {order.delivery_address && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Address:</strong> {order.delivery_address}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {(order.status === 'pending' || order.status === 'pending_confirmation') && (
                    <button
                      onClick={() => handleConfirmAndRequestPayment(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" /> Confirm & Request Payment
                    </button>
                  )}
                  {order.payment_status === 'requested' && (
                    <button
                      onClick={() => handleRecheckPayment(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-secondary disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" /> Recheck Payment
                    </button>
                  )}
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent/40 outline-none"
                  >
                    <option value="pending_confirmation">Pending Confirmation</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="payment_failed">Payment Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="bg-card rounded-lg p-8 text-center shadow-sm border border-border/50">
                <p className="text-sm text-muted-foreground">No orders found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;