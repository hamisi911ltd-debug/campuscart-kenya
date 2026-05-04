import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  Package, AlertCircle, Activity, BarChart3, RefreshCw, Database
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

// Completely new component with different name to bypass cache
const RealDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
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

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  const loadRealData = async () => {
    console.log('🚀 Starting fresh data load...');
    setIsLoading(true);
    setErrorMessage(null);
    setApiStatus('checking');
    
    try {
      // Add timestamp and cache-busting headers
      const timestamp = Date.now();
      const url = `/api/admin/dashboard?cacheBust=${timestamp}&v=2`;
      
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      console.log('📊 Response received:', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Data received:', result);
      
      if (result.success && result.stats) {
        setDashboardData(result.stats);
        setApiStatus('connected');
        setLastUpdate(new Date().toLocaleTimeString());
        console.log('🎉 Dashboard data updated successfully');
      } else {
        throw new Error('Invalid API response format');
      }
      
    } catch (error) {
      console.error('💥 Load error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setApiStatus('error');
      
      // Set empty data to show zeros instead of old cached data
      setDashboardData({
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
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🔄 Component mounted, loading data...');
    loadRealData();
  }, []);

  const getPendingCount = () => {
    const pending = dashboardData.ordersByStatus.find((s: any) => s.status === 'pending');
    return pending ? pending.count : 0;
  };

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Real Database Data...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Connecting to D1 Database and fetching fresh data
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header with Status */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🔴 LIVE Database Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time data from Cloudflare D1 Database
                {lastUpdate && ` • Last updated: ${lastUpdate}`}
              </p>
            </div>
            <button 
              onClick={loadRealData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Live Data
            </button>
          </div>

          {/* API Status Indicator */}
          <div className={`p-3 rounded-lg border ${
            apiStatus === 'connected' ? 'bg-green-50 border-green-200 text-green-800' :
            apiStatus === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-semibold">
                {apiStatus === 'connected' ? '🟢 D1 Database Connected' :
                 apiStatus === 'error' ? '🔴 Database Connection Failed' :
                 '🟡 Checking Database Connection...'}
              </span>
            </div>
            {errorMessage && (
              <p className="text-sm mt-1">Error: {errorMessage}</p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-blue-500 p-2.5 rounded-lg text-white">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-gray-500">LIVE</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {dashboardData.totalUsers.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-xs text-gray-500 mt-1">
              {dashboardData.activeUsers} active recently
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-green-500 p-2.5 rounded-lg text-white">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-gray-500">LIVE</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {dashboardData.totalProducts.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
            <p className="text-xs text-gray-500 mt-1">
              {dashboardData.availableProducts} available
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-purple-500 p-2.5 rounded-lg text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-gray-500">LIVE</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {dashboardData.totalOrders.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
            <p className="text-xs text-gray-500 mt-1">
              {getPendingCount()} pending
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-orange-500 p-2.5 rounded-lg text-white">
                <DollarSign className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-gray-500">LIVE</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              KES {dashboardData.totalRevenue > 0 ? (dashboardData.totalRevenue / 1000).toFixed(1) + 'K' : '0'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link 
            to="/admin/users" 
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-3 rounded-lg text-white group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Manage Users</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all users</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/admin/products" 
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-3 rounded-lg text-white group-hover:scale-105 transition-transform">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Manage Products</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Review and moderate listings</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/admin/orders" 
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-3 rounded-lg text-white group-hover:scale-105 transition-transform">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Manage Orders</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track and manage orders</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            
            {dashboardData.recentOrders.length > 0 || dashboardData.recentUsers.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentOrders.slice(0, 3).map((order: any) => (
                  <div key={order.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
                      <ShoppingBag className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">{order.buyer_name}</span> placed an order
                      </p>
                      <p className="text-sm font-semibold text-purple-600">KES {order.total_amount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                
                {dashboardData.recentUsers.slice(0, 2).map((user: any) => (
                  <div key={user.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">{user.full_name}</span> registered
                      </p>
                      <p className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No Recent Activity</p>
                <p className="text-xs text-gray-400 mt-1">
                  {apiStatus === 'error' ? 'Database connection failed' : 'Database appears to be empty'}
                </p>
              </div>
            )}
          </div>

          {/* Database Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Database Status</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.totalUsers}</div>
                  <div className="text-xs text-blue-600">Users</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.totalProducts}</div>
                  <div className="text-xs text-green-600">Products</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{dashboardData.totalOrders}</div>
                  <div className="text-xs text-purple-600">Orders</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">KES {dashboardData.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-orange-600">Revenue</div>
                </div>
              </div>

              {getPendingCount() > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-semibold text-red-900 dark:text-red-100">Action Required</div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {getPendingCount()} orders need attention
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RealDashboard;