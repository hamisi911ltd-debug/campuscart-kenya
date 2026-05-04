import { useState, useEffect } from "react";
import { 
  Activity, Users, ShoppingBag, Package, MessageSquare, Star,
  TrendingUp, TrendingDown, Clock, MapPin, AlertTriangle,
  RefreshCw, Filter, Calendar, Eye, BarChart3
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface ActivityStats {
  newUsers: number;
  activeUsers: number;
  newProducts: number;
  productUpdates: number;
  newOrders: number;
  completedOrders: number;
  newReviews: number;
  newMessages: number;
  revenue: number;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  created_at: string;
  full_name?: string;
  email?: string;
  title?: string;
  price?: number;
  seller_name?: string;
  buyer_name?: string;
  total_amount?: number;
  status?: string;
  rating?: number;
  comment?: string;
  reviewer_name?: string;
  product_title?: string;
}

const ActivityMonitor = () => {
  const [stats, setStats] = useState<ActivityStats>({
    newUsers: 0,
    activeUsers: 0,
    newProducts: 0,
    productUpdates: 0,
    newOrders: 0,
    completedOrders: 0,
    newReviews: 0,
    newMessages: 0,
    revenue: 0
  });

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>({});
  const [geographicData, setGeographicData] = useState<any[]>([]);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/activity-monitor?timeframe=${timeframe}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setActivities(data.recentActivities || []);
        setSystemHealth(data.systemHealth || {});
        setGeographicData(data.geographicData || []);
        setTopSellers(data.topSellers || []);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        throw new Error(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity data');
      console.error('Activity monitor error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivityData, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return <Users className="h-4 w-4 text-blue-600" />;
      case 'product_listed': return <Package className="h-4 w-4 text-green-600" />;
      case 'order_placed': return <ShoppingBag className="h-4 w-4 text-purple-600" />;
      case 'review_posted': return <Star className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    switch (activity.activity_type) {
      case 'user_registered':
        return `${activity.full_name} registered with email ${activity.email}`;
      case 'product_listed':
        return `${activity.seller_name} listed "${activity.title}" for KES ${activity.price?.toLocaleString()}`;
      case 'order_placed':
        return `${activity.buyer_name} placed an order worth KES ${activity.total_amount?.toLocaleString()}`;
      case 'review_posted':
        return `${activity.reviewer_name} rated "${activity.product_title}" ${activity.rating}/5 stars`;
      default:
        return 'Unknown activity';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg">Loading activity monitor...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📊 Activity Monitor & Control Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time monitoring of all platform activities
                {lastUpdate && (
                  <span className="ml-2 text-green-600 font-semibold">
                    • Last updated: {lastUpdate}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              
              <button 
                onClick={fetchActivityData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">Error: {error}</div>
              <button 
                onClick={fetchActivityData}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Activity Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newUsers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">New Users</div>
              </div>
            </div>
            <div className="text-xs text-blue-600">{stats.activeUsers} active</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newProducts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">New Products</div>
              </div>
            </div>
            <div className="text-xs text-green-600">{stats.productUpdates} updates</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBag className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newOrders}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">New Orders</div>
              </div>
            </div>
            <div className="text-xs text-purple-600">{stats.completedOrders} completed</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newReviews}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">New Reviews</div>
              </div>
            </div>
            <div className="text-xs text-yellow-600">{stats.newMessages} messages</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  KES {(stats.revenue / 1000).toFixed(1)}K
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Revenue</div>
              </div>
            </div>
            <div className="text-xs text-orange-600">Period total</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities Feed */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Activity Feed</h2>
              <div className="ml-auto flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activities.length > 0 ? activities.map((activity, index) => (
                <div key={`${activity.id}-${index}`} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-600 shadow-sm">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {getActivityDescription(activity)}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activities in the selected timeframe</p>
                </div>
              )}
            </div>
          </div>

          {/* System Health & Controls */}
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">System Health</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                  <span className="font-semibold">{systemHealth.totalUsers?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Products</span>
                  <span className="font-semibold">{systemHealth.totalProducts?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Orders</span>
                  <span className="font-semibold">{systemHealth.totalOrders?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                  <span className="font-semibold">KES {systemHealth.totalRevenue?.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Performance</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Avg Order Value</span>
                    <span>KES {systemHealth.averageOrderValue?.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Conversion Rate</span>
                    <span>{systemHealth.conversionRate?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Geographic Data</h3>
              </div>
              
              <div className="space-y-3">
                {geographicData.slice(0, 5).map((location, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{location.location}</span>
                    <span className="font-semibold">{location.user_count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Sellers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Sellers</h3>
              </div>
              
              <div className="space-y-3">
                {topSellers.slice(0, 5).map((seller, index) => (
                  <div key={seller.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {seller.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        KES {seller.total_revenue?.toLocaleString()} • {seller.total_sales} sales
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ActivityMonitor;