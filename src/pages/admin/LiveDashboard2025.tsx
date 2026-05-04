import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  Package, AlertCircle, Activity, BarChart3, RefreshCw, Database, Wifi, WifiOff
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

// BRAND NEW COMPONENT - COMPLETELY DIFFERENT NAME TO BYPASS ALL CACHE
const LiveDashboard2025 = () => {
  // Use completely different state variable names
  const [liveStats, setLiveStats] = useState({
    users: 0,
    activeUsers: 0,
    products: 0,
    availableProducts: 0,
    orders: 0,
    revenue: 0,
    recentOrders: [],
    recentUsers: [],
    ordersByStatus: [],
  });

  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');

  // Completely new function name
  const syncWithDatabase = async () => {
    console.log('🔥 SYNCING WITH LIVE DATABASE...');
    setIsLoadingLive(true);
    setConnectionError(null);
    setDbStatus('connecting');
    
    try {
      // Force bypass ALL cache with unique timestamp
      const uniqueId = `${Date.now()}_${Math.random()}`;
      const apiUrl = `/api/admin/dashboard?live=${uniqueId}&nocache=true&force=1`;
      
      console.log('🌐 API Call:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Force-Refresh': 'true',
          'X-Timestamp': uniqueId
        }
      });
      
      console.log('📡 Response Status:', response.status);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Failed:', response.status, errorText);
        throw new Error(`Database API Error: ${response.status} - ${errorText}`);
      }
      
      const apiData = await response.json();
      console.log('📊 Raw API Response:', apiData);
      
      if (apiData.success && apiData.stats) {
        // Map to our state with different property names
        setLiveStats({
          users: apiData.stats.totalUsers || 0,
          activeUsers: apiData.stats.activeUsers || 0,
          products: apiData.stats.totalProducts || 0,
          availableProducts: apiData.stats.availableProducts || 0,
          orders: apiData.stats.totalOrders || 0,
          revenue: apiData.stats.totalRevenue || 0,
          recentOrders: apiData.stats.recentOrders || [],
          recentUsers: apiData.stats.recentUsers || [],
          ordersByStatus: apiData.stats.ordersByStatus || [],
        });
        
        setDbStatus('online');
        setLastSync(new Date().toLocaleTimeString());
        console.log('✅ LIVE DATA UPDATED:', liveStats);
      } else {
        throw new Error('Invalid API response structure');
      }
      
    } catch (error) {
      console.error('💥 Database Sync Failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Database connection failed');
      setDbStatus('offline');
      
      // Show zeros instead of cached data
      setLiveStats({
        users: 0,
        activeUsers: 0,
        products: 0,
        availableProducts: 0,
        orders: 0,
        revenue: 0,
        recentOrders: [],
        recentUsers: [],
        ordersByStatus: [],
      });
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Auto-sync on mount
  useEffect(() => {
    console.log('🚀 LiveDashboard2025 Component Mounted - Starting Sync...');
    syncWithDatabase();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(syncWithDatabase, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPendingOrdersCount = () => {
    const pending = liveStats.ordersByStatus.find((s: any) => s.status === 'pending');
    return pending ? pending.count : 0;
  };

  // Loading state with different design
  if (isLoadingLive) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
            <div className="relative">
              <RefreshCw className="h-16 w-16 animate-spin text-blue-600 mb-6" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🔄 Syncing with Live Database
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              Connecting to Cloudflare D1 Database and fetching real-time data...
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
              <Database className="h-4 w-4 animate-pulse" />
              <span>Establishing secure connection...</span>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header with Live Status */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🔴 LIVE DATABASE DASHBOARD 2025
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Real-time synchronization with Cloudflare D1 Database
                {lastSync && (
                  <span className="ml-2 text-green-600 font-semibold">
                    • Last synced: {lastSync}
                  </span>
                )}
              </p>
            </div>
            <button 
              onClick={syncWithDatabase}
              disabled={isLoadingLive}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-xl hover:from-red-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg"
            >
              <RefreshCw className={`h-5 w-5 ${isLoadingLive ? 'animate-spin' : ''}`} />
              Sync Live Data
            </button>
          </div>

          {/* Connection Status */}
          <div className={`p-4 rounded-xl border-2 ${
            dbStatus === 'online' ? 'bg-green-50 border-green-200 text-green-800' :
            dbStatus === 'offline' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center gap-3">
              {dbStatus === 'online' ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
              <div>
                <div className="font-bold text-lg">
                  {dbStatus === 'online' ? '🟢 DATABASE ONLINE - LIVE DATA ACTIVE' :
                   dbStatus === 'offline' ? '🔴 DATABASE OFFLINE - CONNECTION FAILED' :
                   '🟡 CONNECTING TO DATABASE...'}
                </div>
                {connectionError && (
                  <div className="text-sm mt-1">Connection Error: {connectionError}</div>
                )}
                {dbStatus === 'online' && (
                  <div className="text-sm mt-1">✅ Successfully connected to D1 Database • Data is live and real-time</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>
            <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {liveStats.users.toLocaleString()}
            </h3>
            <p className="text-blue-700 dark:text-blue-300 font-semibold">Total Users</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              {liveStats.activeUsers} active recently
            </p>
          </div>

          {/* Products Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-600 p-3 rounded-xl text-white shadow-lg">
                <Package className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>
            <h3 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
              {liveStats.products.toLocaleString()}
            </h3>
            <p className="text-green-700 dark:text-green-300 font-semibold">Total Products</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {liveStats.availableProducts} available
            </p>
          </div>

          {/* Orders Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-600 p-3 rounded-xl text-white shadow-lg">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>
            <h3 className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              {liveStats.orders.toLocaleString()}
            </h3>
            <p className="text-purple-700 dark:text-purple-300 font-semibold">Total Orders</p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              {getPendingOrdersCount()} pending
            </p>
          </div>

          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-700">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-orange-600 p-3 rounded-xl text-white shadow-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>
            <h3 className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">
              KES {liveStats.revenue > 0 ? (liveStats.revenue / 1000).toFixed(1) + 'K' : '0'}
            </h3>
            <p className="text-orange-700 dark:text-orange-300 font-semibold">Total Revenue</p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">All time</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link 
            to="/admin/users" 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-4 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Manage Users</h3>
                <p className="text-gray-600 dark:text-gray-400">View and manage all users</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/admin/products" 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-4 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Manage Products</h3>
                <p className="text-gray-600 dark:text-gray-400">Review and moderate listings</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/admin/orders" 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-4 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Manage Orders</h3>
                <p className="text-gray-600 dark:text-gray-400">Track and manage orders</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Live Activity & Database Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Activity Feed</h2>
              <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold ml-auto">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                REAL-TIME
              </div>
            </div>
            
            {liveStats.recentOrders.length > 0 || liveStats.recentUsers.length > 0 ? (
              <div className="space-y-4">
                {liveStats.recentOrders.slice(0, 3).map((order: any) => (
                  <div key={order.id} className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="p-3 rounded-xl bg-purple-500 text-white shadow-lg">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.buyer_name} placed an order
                      </p>
                      <p className="text-lg font-bold text-purple-600">KES {order.total_amount?.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                
                {liveStats.recentUsers.slice(0, 2).map((user: any) => (
                  <div key={user.id} className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="p-3 rounded-xl bg-blue-500 text-white shadow-lg">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.full_name} registered
                      </p>
                      <p className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No Live Activity</h3>
                <p className="text-gray-400">
                  {dbStatus === 'offline' ? 'Database connection failed' : 'Database appears to be empty'}
                </p>
              </div>
            )}
          </div>

          {/* Database Status Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Database Status</h2>
            </div>
            
            <div className="space-y-6">
              {/* Connection Status */}
              <div className={`p-4 rounded-xl border-2 ${
                dbStatus === 'online' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    dbStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-bold ${
                    dbStatus === 'online' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {dbStatus === 'online' ? 'Cloudflare D1 Connected' : 'Database Offline'}
                  </span>
                </div>
              </div>

              {/* Live Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{liveStats.users}</div>
                  <div className="text-sm text-blue-600 font-semibold">Users</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-600">{liveStats.products}</div>
                  <div className="text-sm text-green-600 font-semibold">Products</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">{liveStats.orders}</div>
                  <div className="text-sm text-purple-600 font-semibold">Orders</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600">KES {liveStats.revenue.toLocaleString()}</div>
                  <div className="text-sm text-orange-600 font-semibold">Revenue</div>
                </div>
              </div>

              {/* Alerts */}
              {getPendingOrdersCount() > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-bold text-red-900 dark:text-red-100">Urgent Action Required</div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {getPendingOrdersCount()} orders need immediate attention
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

export default LiveDashboard2025;