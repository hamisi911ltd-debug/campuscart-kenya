import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShopProvider } from "@/store/shop";
import InstallPrompt from "@/components/InstallPrompt";
import { initializeCacheManagement } from "@/utils/cacheUtils";
import { lazy, Suspense, useEffect } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const GoogleCallback = lazy(() => import("./pages/auth/GoogleCallback"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const TempDashboard = lazy(() => import("./pages/admin/TempDashboard"));
const ComprehensiveMonitor = lazy(() => import("./pages/admin/ComprehensiveMonitor"));
const ActivityMonitor = lazy(() => import("./pages/admin/ActivityMonitor"));
const SystemControl = lazy(() => import("./pages/admin/SystemControl"));
const DatabaseViewer = lazy(() => import("./pages/admin/DatabaseViewer"));
const DirectApiTest = lazy(() => import("./pages/admin/DirectApiTest"));

const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminBulkImport = lazy(() => import("./pages/admin/AdminBulkImport"));
const AdminPhotoImport = lazy(() => import("./pages/admin/AdminPhotoImport"));
const AdminKilimallImport = lazy(() => import("./pages/admin/AdminKilimallImport"));
const AdminEnquiries = lazy(() => import("./pages/admin/AdminEnquiries"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AuthDebug = lazy(() => import("./pages/admin/AuthDebug"));
import AdminRoute from "./components/AdminRoute";
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const TestLuckyCodes = lazy(() => import("./pages/TestLuckyCodes"));

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
      import("./pages/ProductPage");
      import("./pages/CategoryPage");
      import("./pages/CartPage");
      import("./pages/SearchPage");
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(warm, { timeout: 4000 });
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
