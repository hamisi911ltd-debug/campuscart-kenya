import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShopProvider } from "@/store/shop";
import InstallPrompt from "@/components/InstallPrompt";
import { initializeCacheManagement } from "@/utils/cacheUtils";
import { useEffect } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CategoryPage from "./pages/CategoryPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import FavoritesPage from "./pages/FavoritesPage";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import WalletPage from "./pages/WalletPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import GoogleCallback from "./pages/auth/GoogleCallback";
import NotificationsPage from "./pages/NotificationsPage";
import CheckoutPage from "./pages/CheckoutPage";
import TempDashboard from "./pages/admin/TempDashboard";
import ComprehensiveMonitor from "./pages/admin/ComprehensiveMonitor";
import ActivityMonitor from "./pages/admin/ActivityMonitor";
import SystemControl from "./pages/admin/SystemControl";
import DatabaseViewer from "./pages/admin/DatabaseViewer";
import DirectApiTest from "./pages/admin/DirectApiTest";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminBulkImport from "./pages/admin/AdminBulkImport";
import AdminPhotoImport from "./pages/admin/AdminPhotoImport";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminLogin from "./pages/admin/AdminLogin";
import AuthDebug from "./pages/admin/AuthDebug";
import AdminRoute from "./components/AdminRoute";
import SettingsPage from "./pages/SettingsPage";

import TestLuckyCodes from "./pages/TestLuckyCodes";

const queryClient = new QueryClient();

const App = () => {
  // Initialize cache management on app start
  useEffect(() => {
    initializeCacheManagement();
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
          </ShopProvider>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
