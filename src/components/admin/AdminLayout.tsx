import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, Package, ShoppingBag, Gift, Sparkles,
  LogOut, Menu, X, Bell, Search, ChevronDown, Shield,
  Activity, Settings, BarChart3, Database
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { clearAdminSession } from "@/utils/adminAuth";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminEmail = sessionStorage.getItem('adminEmail') || 'Admin';

  const handleLogout = () => {
    // Clear admin session
    clearAdminSession();
    
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/admin',
      description: 'Overview & Analytics'
    },
    { 
      icon: Activity, 
      label: 'Activity Monitor', 
      path: '/admin/activity',
      description: 'Live Activity Feed'
    },
    { 
      icon: Settings, 
      label: 'System Control', 
      path: '/admin/control',
      description: 'Admin Actions'
    },
    { 
      icon: Database, 
      label: 'Database Viewer', 
      path: '/admin/database',
      description: 'Direct DB Access'
    },
    { 
      icon: Users, 
      label: 'Users', 
      path: '/admin/users',
      description: 'Manage Users'
    },
    { 
      icon: Package, 
      label: 'Products', 
      path: '/admin/products',
      description: 'Product Listings'
    },
    { 
      icon: ShoppingBag, 
      label: 'Orders', 
      path: '/admin/orders',
      description: 'Order Management'
    },
    { 
      icon: Gift, 
      label: 'Coupons', 
      path: '/admin/coupons',
      description: 'Discount Codes'
    },
    { 
      icon: Sparkles, 
      label: 'Lucky Codes', 
      path: '/admin/lucky-codes',
      description: 'Wallet Points'
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-First Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3">
          {/* Left Section - Mobile Optimized */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="h-4 w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <div className="flex items-center gap-1 md:gap-2">
              <Logo />
              <div className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Shield className="h-3 w-3 md:h-4 md:w-4 text-white" />
                <span className="text-xs md:text-xs font-bold text-white">ADMIN</span>
              </div>
            </div>
          </div>

          {/* Right Section - Mobile Optimized */}
          <div className="flex items-center gap-1 md:gap-3">
            <button className="hidden md:flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
              <Bell className="h-4 w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 md:top-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="hidden md:flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">Admin</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{adminEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                title="Logout"
              >
                <LogOut className="h-4 w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
              </button>
            </div>
            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:block fixed left-0 top-12 md:top-16 bottom-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-16 md:w-20'
        }`}
      >
        <nav className="p-2 md:p-4 space-y-1 md:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl transition-all ${
                  active
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`h-4 w-4 md:h-5 md:w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs md:text-sm font-semibold truncate ${active ? 'text-white' : ''}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs truncate ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.description}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-xs md:text-sm font-semibold">Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Menu - Fully Responsive */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="fixed left-0 top-12 md:top-16 bottom-0 w-72 sm:w-80 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-3 md:p-4 space-y-1 md:space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 md:px-4 py-3 md:py-4 rounded-lg md:rounded-xl transition-all ${
                      active
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-semibold">{item.label}</p>
                      <p className={`text-xs md:text-sm ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="mb-3 px-3 md:px-4">
                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Admin</p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{adminEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 md:px-4 py-3 md:py-4 rounded-lg md:rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-sm md:text-base font-semibold">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        <div className="p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
