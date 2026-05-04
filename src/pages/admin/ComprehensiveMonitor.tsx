import { useState, useEffect } from "react";
import { 
  Activity, Users, ShoppingBag, Package, MessageSquare, Star,
  TrendingUp, TrendingDown, Clock, MapPin, AlertTriangle,
  RefreshCw, Filter, Calendar, Eye, BarChart3, Database,
  Shield, Settings, Ban, CheckCircle, Trash2, Send
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface MonitorData {
  // Real-time stats
  stats: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    totalProducts: number;
    newProductsToday: number;
    totalOrders: number;
    newOrdersToday: number;
    totalRevenue: number;
    revenueToday: number;
    pendingOrders: number;
    totalReviews: number;
    averageRating: number;
  };
  
  // Recent activities
  recentActivities: Array<{
    id: string;
    type: 'user_registered' | 'product_listed' | 'order_placed' | 'review_posted' | 'message_sent';
    user: string;
    description: string;
    timestamp: string;
    metadata?: any;
  }>;
  
  // System health
  systemHealth: {
    database: { status: 'online' | 'offline'; responseTime: number };
    storage: { status: 'online' | 'offline'; usage: string };
    api: { status: 'online' | 'offline'; uptime: string };
  };
  
  // Geographic data
  usersByLocation: Array<{ location: string; count: number }>;
  
  // Performance metrics
  performance: {
    avgOrderValue: number;
    conversionRate: number;
    customerSatisfaction: number;
    responseTime: number;
  };
}

const ComprehensiveMonitor = () => {
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Control panel state
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [controlAction, setControlAction] = useState('');
  const [controlTarget, setControlTarget] = useState('');
  const [controlData, setControlData] = useState<any>({});

  const fetchMonitorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch comprehensive monitoring data
      const response = await fetch(`/api/admin/comprehensive-monitor?timeframe=${selectedTimeframe}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMonitorData(data);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        throw new Error(data.error || 'Failed to fetch monitoring data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
      console.error('Monitor error:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeControlAction = async () => {
    if (!controlAction || !controlTarget) {
      alert('Please select an action and provide a target');
      return;
    }

    try {
      const response = await fetch('/api/admin/system-control', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: controlAction,
          targetId: controlTarget,
          data: controlData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message || 'Action completed successfully');
        setControlAction('');
        setControlTarget('');
        setControlData({});
        fetchMonitorData(); // Refresh data
      } else {
        throw new Error(result.error || 'Action failed');
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Action failed'}`);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitorData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, autoRefresh]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />;
      case 'product_listed': return <Package className="h-3 w-3 md:h-4 md:w-4 text-green-600" />;
      case 'order_placed': return <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />;
      case 'review_posted': return <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />;
      case 'message_sent': return <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-indigo-600" />;
      default: return <Activity className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />;
    }
  };

  if (loading && !monitorData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
            <span className="text-sm md:text-base">Loading monitor...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !monitorData) {
    return (
      <AdminLayout>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 text-center">
            <AlertTriangle className="h-8 md:h-12 w-8 md:w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg md:text-xl font-bold text-red-800 mb-2">System Error</h2>
            <p className="text-sm md:text-base text-red-700 mb-4">{error}</p>
            <button 
              onClick={fetchMonitorData}
              className="px-4 md:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm md:text-base"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Mobile-First Header */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          {/* Title Section */}
          <div className="flex items-start gap-2 md:gap-4 mb-4">
            <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg flex-shrink-0">
              <Shield className="h-5 md:h-6 lg:h-8 w-5 md:w-6 lg:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Control Center
              </h1>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                Complete platform monitoring
              </p>
              {lastUpdate && (
                <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm mt-1">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Live • {lastUpdate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-2 md:px-3 py-2 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="1h">1h</option>
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
            </select>
            
            <label className="flex items-center gap-1 px-2 md:px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3 h-3 md:w-4 md:h-4 text-purple-600 rounded"
              />
              <span className="text-xs md:text-sm font-medium">Auto</span>
            </label>
            
            <button 
              onClick={fetchMonitorData}
              disabled={loading}
              className="flex items-center justify-center gap-1 px-2 md:px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs md:text-sm rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button 
              onClick={() => setShowControlPanel(!showControlPanel)}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 px-2 md:px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs md:text-sm rounded-lg hover:shadow-lg transition-all"
            >
              <Shield className="h-3 w-3 md:h-4 md:w-4" />
              <span>Control</span>
            </button>
          </div>
        </div>

        {/* System Health - Mobile First */}
        {monitorData?.systemHealth && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className={`p-3 md:p-4 rounded-lg border-2 ${
              monitorData.systemHealth.database.status === 'online' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2 md:gap-3">
                <Database className="h-4 md:h-5 w-4 md:w-5" />
                <div>
                  <div className="text-xs md:text-sm font-bold">Database</div>
                  <div className="text-xs">
                    {monitorData.systemHealth.database.status} • {monitorData.systemHealth.database.responseTime}ms
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-3 md:p-4 rounded-lg border-2 ${
              monitorData.systemHealth.storage.status === 'online' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2 md:gap-3">
                <Package className="h-4 md:h-5 w-4 md:w-5" />
                <div>
                  <div className="text-xs md:text-sm font-bold">Storage</div>
                  <div className="text-xs">
                    {monitorData.systemHealth.storage.status} • {monitorData.systemHealth.storage.usage}
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-3 md:p-4 rounded-lg border-2 ${
              monitorData.systemHealth.api.status === 'online' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2 md:gap-3">
                <Activity className="h-4 md:h-5 w-4 md:w-5" />
                <div>
                  <div className="text-xs md:text-sm font-bold">API</div>
                  <div className="text-xs">
                    {monitorData.systemHealth.api.status} • {monitorData.systemHealth.api.uptime}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid - Mobile Responsive */}
        {monitorData?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 md:p-4 shadow-lg text-white">
              <Users className="h-4 md:h-5 w-4 md:w-5 mb-2 opacity-80" />
              <div className="text-lg md:text-2xl font-bold">{(monitorData.stats.totalUsers / 1000).toFixed(1)}K</div>
              <div className="text-xs opacity-90">Users</div>
              <div className="text-xs mt-1">+{monitorData.stats.newUsersToday}</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 md:p-4 shadow-lg text-white">
              <Package className="h-4 md:h-5 w-4 md:w-5 mb-2 opacity-80" />
              <div className="text-lg md:text-2xl font-bold">{(monitorData.stats.totalProducts / 1000).toFixed(1)}K</div>
              <div className="text-xs opacity-90">Products</div>
              <div className="text-xs mt-1">+{monitorData.stats.newProductsToday}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 md:p-4 shadow-lg text-white">
              <ShoppingBag className="h-4 md:h-5 w-4 md:w-5 mb-2 opacity-80" />
              <div className="text-lg md:text-2xl font-bold">{(monitorData.stats.totalOrders / 1000).toFixed(1)}K</div>
              <div className="text-xs opacity-90">Orders</div>
              <div className="text-xs mt-1">+{monitorData.stats.newOrdersToday}</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 md:p-4 shadow-lg text-white">
              <TrendingUp className="h-4 md:h-5 w-4 md:w-5 mb-2 opacity-80" />
              <div className="text-lg md:text-2xl font-bold">{(monitorData.stats.totalRevenue / 1000000).toFixed(1)}M</div>
              <div className="text-xs opacity-90">Revenue</div>
              <div className="text-xs mt-1">+{(monitorData.stats.revenueToday / 1000).toFixed(0)}K</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3 md:p-4 shadow-lg text-white">
              <AlertTriangle className="h-4 md:h-5 w-4 md:w-5 mb-2 opacity-80" />
              <div className="text-lg md:text-2xl font-bold">{monitorData.stats.pendingOrders}</div>
              <div className="text-xs opacity-90">Pending</div>
              <div className="text-xs mt-1">Attention</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-3 md:p-4 shadow-lg text-white">
              <Star className="h-4 md:h-5 w-4 md:w-5 mb-2 opacity-80" />
              <div className="text-lg md:text-2xl font-bold">{monitorData.stats.averageRating.toFixed(1)}</div>
              <div className="text-xs opacity-90">Rating</div>
              <div className="text-xs mt-1">{(monitorData.stats.totalReviews / 1000).toFixed(1)}K</div>
            </div>
          </div>
        )}

        {/* Main Content - Mobile Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Activities - Full width on mobile */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 lg:p-6 shadow-lg border">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Activity className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
              <h2 className="text-sm md:text-base lg:text-lg font-bold">Live Feed</h2>
              <div className="ml-auto flex items-center gap-1 text-xs text-green-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>

            <div className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
              {monitorData?.recentActivities?.length > 0 ? (
                monitorData.recentActivities.map((activity, index) => (
                  <div key={`${activity.id}-${index}`} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="p-1 md:p-1.5 rounded bg-white dark:bg-gray-600 shadow-sm flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium line-clamp-2">
                        <span className="font-semibold">{activity.user}</span> {activity.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs md:text-sm">No activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-3 md:space-y-4">
            {/* Performance */}
            {monitorData?.performance && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 md:h-5 w-4 md:w-5 text-purple-600" />
                  <h3 className="text-sm md:text-base font-bold">Performance</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Avg Order</span>
                    <span className="font-semibold">KES {monitorData.performance.avgOrderValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Conversion</span>
                    <span className="font-semibold">{monitorData.performance.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Satisfaction</span>
                    <span className="font-semibold">{monitorData.performance.customerSatisfaction.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Locations */}
            {monitorData?.usersByLocation && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 md:h-5 w-4 md:w-5 text-green-600" />
                  <h3 className="text-sm md:text-base font-bold">Locations</h3>
                </div>
                <div className="space-y-2">
                  {monitorData.usersByLocation.slice(0, 5).map((location, index) => (
                    <div key={index} className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600 truncate">{location.location}</span>
                      <span className="font-semibold">{location.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel Modal */}
        {showControlPanel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-bold">Control Panel</h3>
                <button 
                  onClick={() => setShowControlPanel(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Action</label>
                  <select
                    value={controlAction}
                    onChange={(e) => setControlAction(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select action...</option>
                    <option value="suspend_user">Suspend User</option>
                    <option value="activate_user">Activate User</option>
                    <option value="delete_user">Delete User</option>
                    <option value="remove_product">Remove Product</option>
                    <option value="approve_product">Approve Product</option>
                    <option value="cancel_order">Cancel Order</option>
                    <option value="update_order_status">Update Order Status</option>
                    <option value="send_notification">Send Notification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Target ID</label>
                  <input
                    type="text"
                    value={controlTarget}
                    onChange={(e) => setControlTarget(e.target.value)}
                    placeholder="Enter ID..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={executeControlAction}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    Execute
                  </button>
                  <button
                    onClick={() => setShowControlPanel(false)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ComprehensiveMonitor;