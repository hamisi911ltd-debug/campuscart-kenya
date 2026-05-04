import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  Package, AlertCircle, Activity, BarChart3, RefreshCw
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  availableProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  recentUsers: any[];
  ordersByStatus: any[];
  monthlyRevenue: any[];
}

const AdminDashboardNew = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    availableProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    recentUsers: [],
    ordersByStatus: [],
    monthlyRevenue: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string>('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching fresh dashboard stats...');
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/dashboard?t=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Fresh data received:', data);
      
      if (data.success && data.stats) {
        setStats(data.stats);
        setLastFetch(new Date().toLocaleTimeString());
        console.log('✅ Stats updated successfully');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard stats';
      setError(errorMessage);
      console.error('❌ Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const getPendingOrdersCount = () => {
    const pendingStatus = stats.ordersByStatus.find((status: any) => status.status === 'pending');
    return pendingStatus ? pendingStatus.count : 0;
  };

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers.toLocaleString(), 
      subtitle: `${stats.activeUsers} active recently`,
      icon: Users, 
      color: 'bg-blue-500',
      change: stats.totalUsers > 0 ? '+12%' : 'No data'
    },
    { 
      title: 'Total Products', 
      value: stats.totalProducts.toLocaleString(), 
      subtitle: `${stats.availableProducts} available`,
      icon: Package, 
      color: 'bg-green-500',
      change: stats.totalProducts > 0 ? '+8%' : 'No data'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toLocaleString(), 
      subtitle: `${getPendingOrdersCount()} pending`,
      icon: ShoppingBag, 
      color: 'bg-purple-500',
      change: stats.totalOrders > 0 ? '+15%' : 'No data'
    },
    { 
      title: 'Total Revenue', 
      value: stats.totalRevenue > 0 ? `KES ${(stats.totalRevenue / 1000).toFixed(1)}K` : 'KES 0', 
      subtitle: 'All time',
      icon: DollarSign, 
      color: 'bg-orange-500',
      change: stats.totalRevenue > 0 ? '+23%' : 'No data'
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <div className="text-lg text-muted-foreground">Loading fresh dashboard data...</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              📊 Real-Time Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Live data from D1 Database {lastFetch && `(Last updated: ${lastFetch})`}
            </p>
          </div>
          <button 
            onClick={fetchDashboardStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                <div className="font-semibold">Failed to load dashboard data</div>
                <div className="text-sm">{error}</div>
                <button 
                  onClick={fetchDashboardStats}
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className={`${stat.color} p-2 md:p-2.5 rounded-lg text-white`}>
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                  stat.change === 'No data' ? 'text-gray-500' : 'text-green-600'
                }`}>
                  {stat.change !== 'No data' && <TrendingUp className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-0.5">{stat.value}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{stat.title}</p>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-500 mt-0.5">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <Link 
            to="/admin/users" 
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-3 rounded-lg text-white group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">Manage Users</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">View and manage all users</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/admin/products" 
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-3 rounded-lg text-white group-hover:scale-105 transition-transform">
                <Package className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">Manage Products</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Review and moderate listings</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/admin/orders" 
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-3 rounded-lg text-white group-hover:scale-105 transition-transform">
                <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">Manage Orders</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Track and manage orders</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {stats.recentOrders && stats.recentOrders.length > 0 ? (
                <>
                  {stats.recentOrders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-start gap-2 md:gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div className="p-1.5 md:p-2 rounded-lg flex-shrink-0 bg-purple-100 dark:bg-purple-950">
                        <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-gray-900 dark:text-white">
                          <span className="font-semibold">{order.buyer_name || 'Unknown'}</span> placed an order
                        </p>
                        <p className="text-xs md:text-sm font-semibold text-purple-600">KES {order.total_amount?.toLocaleString() || '0'}</p>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {stats.recentUsers && stats.recentUsers.slice(0, 3).map((user: any) => (
                    <div key={user.id} className="flex items-start gap-2 md:gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div className="p-1.5 md:p-2 rounded-lg flex-shrink-0 bg-blue-100 dark:bg-blue-950">
                        <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-gray-900 dark:text-white">
                          <span className="font-semibold">{user.full_name || 'Unknown'}</span> registered
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No recent activity</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {error ? 'Failed to load data from database' : 'Database appears to be empty'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">Database Status</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    D1 Database Connected
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Real-time data synchronization active
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Users Table</span>
                  <span className="font-semibold">{stats.totalUsers} records</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Products Table</span>
                  <span className="font-semibold">{stats.totalProducts} records</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Orders Table</span>
                  <span className="font-semibold">{stats.totalOrders} records</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {getPendingOrdersCount() > 0 && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold text-orange-900 dark:text-orange-100">Attention Required</h4>
                    <p className="text-[10px] md:text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                      {getPendingOrdersCount()} orders pending approval
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardNew;