import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Ban, CheckCircle, Mail, Phone } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'pending';
  joinedDate: string;
  totalOrders: number;
  totalSpent: number;
  picture?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    // Simulate fetching users data
    setUsers([
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@students.uon.ac.ke',
        phone: '+254 712 345 678',
        status: 'active',
        joinedDate: '2024-01-15',
        totalOrders: 12,
        totalSpent: 45600,
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@students.uon.ac.ke',
        phone: '+254 723 456 789',
        status: 'active',
        joinedDate: '2024-02-20',
        totalOrders: 8,
        totalSpent: 32400,
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike.j@students.uon.ac.ke',
        status: 'pending',
        joinedDate: '2024-04-28',
        totalOrders: 0,
        totalSpent: 0,
      },
      {
        id: '4',
        name: 'Sarah Williams',
        email: 'sarah.w@students.uon.ac.ke',
        phone: '+254 734 567 890',
        status: 'suspended',
        joinedDate: '2024-03-10',
        totalOrders: 5,
        totalSpent: 18900,
      },
    ]);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">User Management</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage and monitor all platform users</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500/40 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="relative sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500/40 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-lg md:text-xl font-bold text-yellow-600">{users.filter(u => u.status === 'pending').length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Suspended</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{users.filter(u => u.status === 'suspended').length}</p>
            </div>
          </div>
        </div>

        {/* Users Table - Desktop */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">Spent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 font-bold text-sm">
                          {user.picture ? (
                            <img src={user.picture} alt={user.name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-white">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-white">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                      {new Date(user.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-white">
                      {user.totalOrders}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-purple-600">
                      KES {user.totalSpent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.status === 'active' && (
                          <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950 rounded-lg transition-colors" title="Suspend User">
                            <Ban className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                        {user.status === 'suspended' && (
                          <button className="p-1.5 hover:bg-green-100 dark:hover:bg-green-950 rounded-lg transition-colors" title="Activate User">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </button>
                        )}
                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Users Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-white">
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-white">
                    <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    {user.phone}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Joined</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Orders</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{user.totalOrders}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Spent</p>
                  <p className="text-xs font-semibold text-purple-600">KES {(user.totalSpent / 1000).toFixed(1)}K</p>
                </div>
              </div>

              <div className="flex gap-2">
                {user.status === 'active' && (
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg text-xs font-medium">
                    <Ban className="h-3 w-3" />
                    Suspend
                  </button>
                )}
                {user.status === 'suspended' && (
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-lg text-xs font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Activate
                  </button>
                )}
                <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
