import { useState, useEffect } from "react";
import { Search, Filter, UserCheck, UserX, Mail, Phone, MapPin, Calendar } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGet, adminPut } from "@/utils/adminApi";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
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
      
      const response = await adminGet('/api/admin/users');
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
      const response = await adminPut('/api/admin/users', {
        id: userId,
        is_active: !currentStatus,
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

  // Phone-only signups get a synthetic, never-shown email under the hood
  // (see functions/api/auth/register.ts) so the users.email NOT NULL UNIQUE
  // constraint is satisfied without a live-database migration - don't
  // surface or search against that placeholder here.
  const isRealEmail = (email: string) => !email.endsWith('@phone.campusmart.local');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (isRealEmail(user.email) && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (user.phone_number || '').includes(searchQuery);
    const matchesFilter = filterType === 'all' ||
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
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">User Management</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Manage and monitor user accounts</p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-border/50 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full sm:w-auto pl-9 md:pl-10 pr-8 py-2 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/40 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border/50">
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
              <p className="text-lg md:text-2xl font-bold text-foreground">{users.length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Active Users</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs md:text-sm text-muted-foreground">Inactive</p>
              <p className="text-lg md:text-2xl font-bold text-red-600">{users.filter(u => !u.is_active).length}</p>
            </div>
          </div>
        </div>

        {/* Users - Mobile-First Design */}
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-card rounded-xl md:rounded-2xl shadow-lg border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 md:p-4 text-sm font-semibold">User</th>
                    <th className="text-left p-3 md:p-4 text-sm font-semibold">Contact</th>
                    <th className="text-left p-3 md:p-4 text-sm font-semibold">Status</th>
                    <th className="text-left p-3 md:p-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-border/50 hover:bg-secondary/20">
                      <td className="p-3 md:p-4">
                        <div>
                          <div className="font-semibold text-foreground text-sm">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 md:p-4">
                        <div className="space-y-1">
                          {isRealEmail(user.email) && (
                            <div className="text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          )}
                          {user.phone_number && (
                            <div className="text-xs flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone_number}
                            </div>
                          )}
                          {user.location && (
                            <div className="text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 md:p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 md:p-4">
                        <button 
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            user.is_active 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="h-3 w-3" />
                              <span className="hidden xl:inline">Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3" />
                              <span className="hidden xl:inline">Activate</span>
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-card rounded-lg shadow-sm border border-border/50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">{user.full_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {isRealEmail(user.email) && (
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  )}
                  {user.phone_number && (
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {user.phone_number}
                    </div>
                  )}
                  {user.location && (
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {user.location}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    user.is_active 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {user.is_active ? (
                    <>
                      <UserX className="h-4 w-4" />
                      Deactivate User
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Activate User
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="bg-card rounded-xl md:rounded-2xl p-8 md:p-12 text-center shadow-lg border border-border/50">
            <p className="text-sm md:text-base text-muted-foreground">No users found matching your criteria</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;