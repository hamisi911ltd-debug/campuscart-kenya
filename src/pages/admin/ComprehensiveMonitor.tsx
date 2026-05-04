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
      case 'user_registered': return <Users className="h-4 w-4 text-blue-600" />;
      case 'product_listed': return <Package className="h-4 w-4 text-green-600" />;
      case 'order_placed': return <ShoppingBag className="h-4 w-4 text-purple-600" />;
      case 'review_posted': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'message_sent': return <MessageSquare className="h-4 w-4 text-indigo-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !monitorData) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg">Loading comprehensive monitor...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !monitorData) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Monitoring System Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={fetchMonitorData}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🚀 CampusMart Control Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Complete monitoring and control of your marketplace platform
                {lastUpdate && (
                  <span className="ml-2 text-green-600 font-semibold">
                    • Last updated: {lastUpdate}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-refresh</span>
              </label>
              
              <button 
                onClick={fetchMonitorData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button 
                onClick={() => setShowControlPanel(!showControlPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Control Panel
              </button>
            </div>
          </div>

          {/* System Health Status */}
          {monitorData?.systemHealth && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg border-2 ${
                monitorData.systemHealth.database.status === 'online' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6" />
                  <div>
                    <div className="font-bold">Database</div>
                    <div className="text-sm">
                      {monitorData.systemHealth.database.status} • {monitorData.systemHealth.database.responseTime}ms
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                monitorData.systemHealth.storage.status === 'online' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6" />
                  <div>
                    <div className="font-bold">R2 Storage</div>
                    <div className="text-sm">
                      {monitorData.systemHealth.storage.status} • {monitorData.systemHealth.storage.usage}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                monitorData.systemHealth.api.status === 'online' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6" />
                  <div>
                    <div className="font-bold">API Services</div>
                    <div className="text-sm">
                      {monitorData.systemHealth.api.status} • {monitorData.systemHealth.api.uptime} uptime
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel Modal */}
        {showControlPanel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Admin Control Panel</h3>
                <button 
                  onClick={() => setShowControlPanel(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                    placeholder="Enter user ID, product ID, order ID..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {controlAction === 'update_order_status' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">New Status</label>
                    <select
                      value={controlData.status || ''}
                      onChange={(e) => setControlData({ ...controlData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select status...</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                {controlAction === 'send_notification' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={controlData.title || ''}
                        onChange={(e) => setControlData({ ...controlData, title: e.target.value })}
                        placeholder="Notification title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Message</label>
                      <textarea
                        value={controlData.message || ''}
                        onChange={(e) => setControlData({ ...controlData, message: e.target.value })}
                        placeholder="Notification message"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={executeControlAction}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Execute Action
                  </button>
                  <button
                    onClick={() => setShowControlPanel(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        {monitorData?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {monitorData.stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                </div>
              </div>
              <div className="text-xs text-blue-600">
                +{monitorData.stats.newUsersToday} today
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {monitorData.stats.totalProducts.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Products</div>
                </div>
              </div>
              <div className="text-xs text-green-600">
                +{monitorData.stats.newProductsToday} today
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {monitorData.stats.totalOrders.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Orders</div>
                </div>
              </div>
              <div className="text-xs text-purple-600">
                +{monitorData.stats.newOrdersToday} today
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    KES {(monitorData.stats.totalRevenue / 1000).toFixed(1)}K
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Revenue</div>
                </div>
              </div>
              <div className="text-xs text-orange-600">
                +KES {(monitorData.stats.revenueToday / 1000).toFixed(1)}K today
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {monitorData.stats.pendingOrders}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                </div>
              </div>
              <div className="text-xs text-red-600">Needs attention</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Star className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {monitorData.stats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                </div>
              </div>
              <div className="text-xs text-yellow-600">
                {monitorData.stats.totalReviews} reviews
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
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
              {monitorData?.recentActivities?.length > 0 ? (
                monitorData.recentActivities.map((activity, index) => (
                  <div key={`${activity.id}-${index}`} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-600 shadow-sm">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        <span className="font-semibold">{activity.user}</span> {activity.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            {monitorData?.performance && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Performance</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</span>
                    <span className="font-semibold">KES {monitorData.performance.avgOrderValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
                    <span className="font-semibold">{monitorData.performance.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Customer Satisfaction</span>
                    <span className="font-semibold">{monitorData.performance.customerSatisfaction.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className="font-semibold">{monitorData.performance.responseTime}ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* Geographic Distribution */}
            {monitorData?.usersByLocation && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Locations</h3>
                </div>
                
                <div className="space-y-3">
                  {monitorData.usersByLocation.slice(0, 5).map((location, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{location.location}</span>
                      <span className="font-semibold">{location.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ComprehensiveMonitor;