import { useState, useEffect } from "react";
import { 
  Shield, Users, Package, ShoppingBag, MessageSquare, Star,
  Ban, CheckCircle, Trash2, Eye, EyeOff, Send, AlertTriangle,
  Settings, Database, Server, Activity, RefreshCw
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface SystemStatus {
  database: {
    status: string;
    lastBackup: string;
    totalTables: number;
    totalRecords: { total: number };
  };
  storage: {
    status: string;
  };
  performance: {
    responseTime: string;
    uptime: string;
    activeConnections: number;
  };
}

interface ControlAction {
  id: string;
  name: string;
  description: string;
}

const SystemControl = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [availableActions, setAvailableActions] = useState<ControlAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Control forms
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [actionData, setActionData] = useState<any>({});
  const [showActionForm, setShowActionForm] = useState(false);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/system-control', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSystemStatus(data.systemStatus);
        setAvailableActions(data.availableActions || []);
      } else {
        throw new Error(data.error || 'Failed to fetch system data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system data');
      console.error('System control error:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!selectedAction || !targetId) {
      alert('Please select an action and provide a target ID');
      return;
    }

    try {
      setActionLoading(selectedAction);

      const response = await fetch('/api/admin/system-control', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          action: selectedAction,
          targetId,
          targetType: getTargetType(selectedAction),
          data: actionData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message || 'Action completed successfully');
        setTargetId('');
        setActionData({});
        setShowActionForm(false);
      } else {
        throw new Error(result.error || 'Action failed');
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Action failed'}`);
      console.error('Action error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getTargetType = (action: string) => {
    if (action.includes('user')) return 'user';
    if (action.includes('product')) return 'product';
    if (action.includes('order')) return 'order';
    if (action.includes('review')) return 'review';
    return 'system';
  };

  const getActionIcon = (actionId: string) => {
    switch (actionId) {
      case 'suspend_user': return <Ban className="h-5 w-5 text-red-600" />;
      case 'activate_user': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'delete_user': return <Trash2 className="h-5 w-5 text-red-800" />;
      case 'remove_product': return <EyeOff className="h-5 w-5 text-orange-600" />;
      case 'approve_product': return <Eye className="h-5 w-5 text-green-600" />;
      case 'cancel_order': return <Ban className="h-5 w-5 text-red-600" />;
      case 'update_order_status': return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case 'delete_review': return <Trash2 className="h-5 w-5 text-red-600" />;
      case 'feature_product': return <Star className="h-5 w-5 text-yellow-600" />;
      case 'send_notification': return <Send className="h-5 w-5 text-purple-600" />;
      case 'bulk_action': return <Settings className="h-5 w-5 text-gray-600" />;
      default: return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  const renderActionForm = () => {
    if (!selectedAction) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-semibold mb-3">Action Parameters</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Target ID</label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter user ID, product ID, order ID, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {selectedAction === 'update_order_status' && (
            <div>
              <label className="block text-sm font-medium mb-1">New Status</label>
              <select
                value={actionData.status || ''}
                onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {selectedAction === 'send_notification' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={actionData.title || ''}
                  onChange={(e) => setActionData({ ...actionData, title: e.target.value })}
                  placeholder="Notification title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={actionData.message || ''}
                  onChange={(e) => setActionData({ ...actionData, message: e.target.value })}
                  placeholder="Notification message"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </>
          )}

          {selectedAction === 'bulk_action' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Bulk Action Type</label>
                <select
                  value={actionData.bulkAction || ''}
                  onChange={(e) => setActionData({ ...actionData, bulkAction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select bulk action</option>
                  <option value="suspend_users">Suspend Users</option>
                  <option value="remove_products">Remove Products</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target IDs (comma-separated)</label>
                <textarea
                  value={actionData.targets?.join(', ') || ''}
                  onChange={(e) => setActionData({ 
                    ...actionData, 
                    targets: e.target.value.split(',').map(id => id.trim()).filter(id => id) 
                  })}
                  placeholder="id1, id2, id3..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={executeAction}
            disabled={actionLoading === selectedAction}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading === selectedAction ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              getActionIcon(selectedAction)
            )}
            Execute Action
          </button>
          <button
            onClick={() => setShowActionForm(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg">Loading system control...</span>
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
                🛡️ System Control Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administrative controls and system management
              </p>
            </div>
            
            <button 
              onClick={fetchSystemData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">Error: {error}</div>
              <button 
                onClick={fetchSystemData}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Status */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <Database className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Status</h2>
              </div>

              {systemStatus && (
                <div className="space-y-4">
                  {/* Database Status */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-green-800 dark:text-green-200">Database Online</span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <div>Tables: {systemStatus.database.totalTables}</div>
                      <div>Records: {systemStatus.database.totalRecords?.total?.toLocaleString()}</div>
                      <div>Last Backup: {new Date(systemStatus.database.lastBackup).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Storage Status */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">Storage Connected</span>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      R2 Storage: {systemStatus.storage.status}
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-purple-800 dark:text-purple-200">Performance</span>
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                      <div>Response Time: {systemStatus.performance.responseTime}</div>
                      <div>Uptime: {systemStatus.performance.uptime}</div>
                      <div>Connections: {systemStatus.performance.activeConnections}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-red-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Administrative Actions</h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Action</label>
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setShowActionForm(!!e.target.value);
                    setTargetId('');
                    setActionData({});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Choose an action...</option>
                  {availableActions.map((action) => (
                    <option key={action.id} value={action.id}>
                      {action.name} - {action.description}
                    </option>
                  ))}
                </select>
              </div>

              {showActionForm && renderActionForm()}

              {/* Quick Actions Grid */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableActions.slice(0, 6).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        setSelectedAction(action.id);
                        setShowActionForm(true);
                      }}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {getActionIcon(action.id)}
                        <span className="font-medium text-sm">{action.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Warning</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Administrative actions can have significant impact on the platform. 
                      Always verify target IDs and action parameters before execution. 
                      Some actions cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemControl;