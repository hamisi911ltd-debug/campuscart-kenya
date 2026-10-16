import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShopProvider } from "@/store/shop";
import InstallPrompt from "@/components/InstallPrompt";
import { initializeCacheManagement } from "@/utils/cacheUtils";
import { lazy, Suspense, useEffect, type ComponentType } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
const CategoryPage = lazyPage(() => import("./pages/CategoryPage"));
const CategoriesPage = lazyPage(() => import("./pages/CategoriesPage"));
const ProductPage = lazyPage(() => import("./pages/ProductPage"));
const CartPage = lazyPage(() => import("./pages/CartPage"));
const FavoritesPage = lazyPage(() => import("./pages/FavoritesPage"));
const SearchPage = lazyPage(() => import("./pages/SearchPage"));
const ProfilePage = lazyPage(() => import("./pages/ProfilePage"));
const OrdersPage = lazyPage(() => import("./pages/OrdersPage"));
const WalletPage = lazyPage(() => import("./pages/WalletPage"));
const AuthPage = lazyPage(() => import("./pages/AuthPage"));
const ForgotPasswordPage = lazyPage(() => import("./pages/auth/ForgotPasswordPage"));
const GoogleCallback = lazyPage(() => import("./pages/auth/GoogleCallback"));
const NotificationsPage = lazyPage(() => import("./pages/NotificationsPage"));
const CheckoutPage = lazyPage(() => import("./pages/CheckoutPage"));
const TempDashboard = lazyPage(() => import("./pages/admin/TempDashboard"));
const ComprehensiveMonitor = lazyPage(() => import("./pages/admin/ComprehensiveMonitor"));
const ActivityMonitor = lazyPage(() => import("./pages/admin/ActivityMonitor"));
const SystemControl = lazyPage(() => import("./pages/admin/SystemControl"));
const DatabaseViewer = lazyPage(() => import("./pages/admin/DatabaseViewer"));
const DirectApiTest = lazyPage(() => import("./pages/admin/DirectApiTest"));

const AdminUsers = lazyPage(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazyPage(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazyPage(() => import("./pages/admin/AdminProductForm"));
const AdminBulkImport = lazyPage(() => import("./pages/admin/AdminBulkImport"));
const AdminPhotoImport = lazyPage(() => import("./pages/admin/AdminPhotoImport"));
const AdminKilimallImport = lazyPage(() => import("./pages/admin/AdminKilimallImport"));
const AdminEnquiries = lazyPage(() => import("./pages/admin/AdminEnquiries"));
const AdminOrders = lazyPage(() => import("./pages/admin/AdminOrders"));
const AdminCoupons = lazyPage(() => import("./pages/admin/AdminCoupons"));
const AdminTeam = lazyPage(() => import("./pages/admin/AdminTeam"));
const AdminLogin = lazyPage(() => import("./pages/admin/AdminLogin"));
const AuthDebug = lazyPage(() => import("./pages/admin/AuthDebug"));
import AdminRoute from "./components/AdminRoute";

// React.lazy with recovery. If a page's code can't be fetched - typically a tab
// that was opened before a deploy, whose old script files no longer exist - the
// click would otherwise do nothing at all. Clear the caches and reload once so
// the browser picks up the current version.
const RELOAD_FLAG = "cm:chunk-reload";
// (A function declaration, so it's available to the page imports above it.)
function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const module = await load();
      sessionStorage.removeItem(RELOAD_FLAG);
      return module;
    } catch (error) {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        try {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        } catch { /* no Cache API - reload anyway */ }
        window.location.reload();
        return new Promise<never>(() => {}); // page is reloading
      }
      throw error;
    }
  });
}
const SettingsPage = lazyPage(() => import("./pages/SettingsPage"));

const TestLuckyCodes = lazyPage(() => import("./pages/TestLuckyCodes"));

const queryClient = new QueryClient();

// Pages other than the homepage load on demand, so opening the site only
// downloads the code the homepage needs (admin screens, checkout, charts etc.
// used to ship in the same file for every visitor).
const PageFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
  </div>
);

const App = () => {
  // Initialize cache management on app start
  useEffect(() => {
    initializeCacheManagement();

    const warm = () => {
      if (window.location.pathname.startsWith("/admin")) {
        // Admin screens: load them all in the background so the sidebar never waits.
        import("./pages/admin/AdminProducts");
        import("./pages/admin/AdminOrders");
        import("./pages/admin/AdminEnquiries");
        import("./pages/admin/AdminUsers");
        import("./pages/admin/AdminCoupons");
        import("./pages/admin/AdminTeam");
        import("./pages/admin/AdminKilimallImport");
        import("./pages/admin/AdminBulkImport");
        import("./pages/admin/AdminPhotoImport");
        import("./pages/admin/AdminProductForm");
        import("./pages/admin/TempDashboard");
        import("./pages/admin/ActivityMonitor");
        import("./pages/admin/SystemControl");
        import("./pages/admin/DatabaseViewer");
        return;
      }
      import("./pages/ProductPage");
      import("./pages/CategoryPage");
      import("./pages/CartPage");
      import("./pages/SearchPage");
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(warm, { timeout: window.location.pathname.startsWith("/admin") ? 800 : 4000 });
    else setTimeout(warm, 2500);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="mobile-container no-horizontal-scroll">
        <Toaster />
        <Sonner />
        <InstallPrompt />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ShopProvider>
            <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/google-callback" element={<GoogleCallback />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              {/* Permission-scoped pages: open to the main admin AND any
                  team member who's been granted that specific area (see
                  Admin -> Team). */}
              <Route path="/admin/users" element={<AdminRoute requirePermission="users"><AdminUsers /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute requirePermission="products"><AdminProducts /></AdminRoute>} />
              <Route path="/admin/products/new" element={<AdminRoute requirePermission="products"><AdminProductForm /></AdminRoute>} />
              <Route path="/admin/products/edit/:id" element={<AdminRoute requirePermission="products"><AdminProductForm /></AdminRoute>} />
              <Route path="/admin/products/bulk-import" element={<AdminRoute requirePermission="products"><AdminBulkImport /></AdminRoute>} />
              <Route path="/admin/products/import-photos" element={<AdminRoute requirePermission="products"><AdminPhotoImport /></AdminRoute>} />
              <Route path="/admin/enquiries" element={<AdminRoute requirePermission="products"><AdminEnquiries /></AdminRoute>} />
              <Route path="/admin/products/import-kilimall" element={<AdminRoute requirePermission="products"><AdminKilimallImport /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute requirePermission="orders"><AdminOrders /></AdminRoute>} />
              <Route path="/admin/coupons" element={<AdminRoute requirePermission="coupons"><AdminCoupons /></AdminRoute>} />
              {/* Owner-only pages: no permission a team member can hold opens these. */}
              <Route path="/admin" element={<AdminRoute ownerOnly><ComprehensiveMonitor /></AdminRoute>} />
              <Route path="/admin/activity" element={<AdminRoute ownerOnly><ActivityMonitor /></AdminRoute>} />
              <Route path="/admin/control" element={<AdminRoute ownerOnly><SystemControl /></AdminRoute>} />
              <Route path="/admin/database" element={<AdminRoute ownerOnly><DatabaseViewer /></AdminRoute>} />
              <Route path="/admin/team" element={<AdminRoute ownerOnly><AdminTeam /></AdminRoute>} />
              <Route path="/admin/test" element={<AdminRoute ownerOnly><DirectApiTest /></AdminRoute>} />
              <Route path="/admin/debug" element={<AdminRoute ownerOnly><AuthDebug /></AdminRoute>} />
              <Route path="/admin/diagnostic" element={<AdminRoute ownerOnly><TempDashboard /></AdminRoute>} />
              <Route path="/admin/test-lucky-codes" element={<AdminRoute ownerOnly><TestLuckyCodes /></AdminRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </ShopProvider>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
