import { useState, useEffect } from "react";
import { Search, Filter, UserCheck, UserX, Mail, Phone, MapPin, Calendar, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  location?: string;
  is_seller: boolean;
  seller_rating: number;
  seller_reviews_count: number;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  total_products?: number;
  total_sales?: number;
  total_revenue?: number;
  average_rating?: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          is_active: !currentStatus,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }
      
      // Update user in local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));
      
      alert(data.message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      alert(`Error: ${errorMessage}`);
      console.error('Error updating user:', err);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'sellers' && user.is_seller) ||
                         (filterType === 'buyers' && !user.is_seller) ||
                         (filterType === 'active' && user.is_active) ||
                         (filterType === 'inactive' && !user.is_active);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading users...</div>
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
              onClick={fetchUsers}
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor user accounts</p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Users</option>
                <option value="sellers">Sellers</option>
                <option value="buyers">Buyers</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sellers</p>
              <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.is_seller).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.is_active).length}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-semibold">User</th>
                  <th className="text-left p-4 font-semibold">Contact</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Stats</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-border/50 hover:bg-secondary/20">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-foreground">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone_number && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone_number}
                          </div>
                        )}
                        {user.location && (
                          <div className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {user.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.is_seller 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200'
                      }`}>
                        {user.is_seller ? 'Seller' : 'Buyer'}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.is_seller && (
                        <div className="space-y-1">
                          <div className="text-sm flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {user.total_products || 0} products
                          </div>
                          <div className="text-sm">
                            KES {(user.total_revenue || 0).toLocaleString()} revenue
                          </div>
                          {user.average_rating > 0 && (
                            <div className="text-sm">
                              ⭐ {user.average_rating.toFixed(1)} rating
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          user.is_active 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="bg-card rounded-2xl p-12 text-center shadow-lg border border-border/50">
            <p className="text-muted-foreground">No users found matching your criteria</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;