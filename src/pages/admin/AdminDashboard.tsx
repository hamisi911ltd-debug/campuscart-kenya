import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  Package, AlertCircle, Activity, BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Simulate fetching dashboard data
    // In production, replace with actual API calls
    setStats({
      totalUsers: 1247,
      activeUsers: 342,
      totalProducts: 856,
      totalOrders: 2134,
      totalRevenue: 1245600,
      pendingOrders: 23,
    });

    setRecentActivity([
      { id: 1, type: 'order', user: 'John Doe', action: 'placed an order', amount: 'KES 2,500', time: '2 mins ago' },
      { id: 2, type: 'user', user: 'Jane Smith', action: 'registered', time: '15 mins ago' },
      { id: 3, type: 'product', user: 'Mike Johnson', action: 'listed a product', item: 'MacBook Pro', time: '1 hour ago' },
      { id: 4, type: 'order', user: 'Sarah Williams', action: 'completed payment', amount: 'KES 5,200', time: '2 hours ago' },
      { id: 5, type: 'user', user: 'David Brown', action: 'registered', time: '3 hours ago' },
    ]);
  }, []);

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers.toLocaleString(), 
      subtitle: `${stats.activeUsers} active today`,
      icon: Users, 
      color: 'bg-blue-500',
      trend: '+12%'
    },
    { 
      title: 'Total Products', 
      value: stats.totalProducts.toLocaleString(), 
      subtitle: 'Listed on platform',
      icon: Package, 
      color: 'bg-green-500',
      trend: '+8%'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toLocaleString(), 
      subtitle: `${stats.pendingOrders} pending`,
      icon: ShoppingBag, 
      color: 'bg-purple-500',
      trend: '+15%'
    },
    { 
      title: 'Total Revenue', 
      value: `KES ${(stats.totalRevenue / 1000).toFixed(1)}K`, 
      subtitle: 'This month',
      icon: DollarSign, 
      color: 'bg-orange-500',
      trend: '+23%'
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className={`${stat.color} p-2 md:p-2.5 rounded-lg text-white`}>
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <span className="text-green-600 text-xs font-semibold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
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
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 md:gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${
                    activity.type === 'order' ? 'bg-purple-100 dark:bg-purple-950' :
                    activity.type === 'user' ? 'bg-blue-100 dark:bg-blue-950' :
                    'bg-green-100 dark:bg-green-950'
                  }`}>
                    {activity.type === 'order' && <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />}
                    {activity.type === 'user' && <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />}
                    {activity.type === 'product' && <Package className="h-3 w-3 md:h-4 md:w-4 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{activity.user}</span> {activity.action}
                      {activity.item && <span className="font-semibold"> {activity.item}</span>}
                    </p>
                    {activity.amount && (
                      <p className="text-xs md:text-sm font-semibold text-purple-600">{activity.amount}</p>
                    )}
                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">Platform Health</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">User Engagement</span>
                  <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">87%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 md:h-2">
                  <div className="bg-blue-500 h-1.5 md:h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Order Completion</span>
                  <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">92%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 md:h-2">
                  <div className="bg-green-500 h-1.5 md:h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Product Approval</span>
                  <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">78%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 md:h-2">
                  <div className="bg-purple-500 h-1.5 md:h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Customer Satisfaction</span>
                  <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">94%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 md:h-2">
                  <div className="bg-orange-500 h-1.5 md:h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs md:text-sm font-semibold text-orange-900 dark:text-orange-100">Attention Required</h4>
                  <p className="text-[10px] md:text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                    {stats.pendingOrders} orders pending approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
