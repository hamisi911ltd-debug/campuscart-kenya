import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShopProvider } from "@/store/shop";
import InstallPrompt from "@/components/InstallPrompt";
import { OfferNotifications } from "@/components/OfferNotifications";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import FavoritesPage from "./pages/FavoritesPage";
import SearchPage from "./pages/SearchPage";
import SellPage from "./pages/SellPage";
import MyListingsPage from "./pages/MyListingsPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import AuthPage from "./pages/AuthPage";
import GoogleCallback from "./pages/auth/GoogleCallback";
import NotificationsPage from "./pages/NotificationsPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminDashboardNew from "./pages/admin/AdminDashboardNew";
import RealDashboard from "./pages/admin/RealDashboard";
import LiveDashboard2025 from "./pages/admin/LiveDashboard2025";
import TempDashboard from "./pages/admin/TempDashboard";
import ComprehensiveMonitor from "./pages/admin/ComprehensiveMonitor";
import ActivityMonitor from "./pages/admin/ActivityMonitor";
import SystemControl from "./pages/admin/SystemControl";
import DatabaseViewer from "./pages/admin/DatabaseViewer";
import DirectApiTest from "./pages/admin/DirectApiTest";
import AdSenseStatus from "./pages/AdSenseStatus";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAdvertisements from "./pages/admin/AdminAdvertisements";
import AdminLogin from "./pages/admin/AdminLogin";
import ApiTestPage from "./pages/admin/ApiTestPage";
import AdminRoute from "./components/AdminRoute";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ShopProvider>
          <OfferNotifications />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/google-callback" element={<GoogleCallback />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/adsense-status" element={<AdSenseStatus />} />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><ComprehensiveMonitor /></AdminRoute>} />
            <Route path="/admin/activity" element={<AdminRoute><ActivityMonitor /></AdminRoute>} />
            <Route path="/admin/control" element={<AdminRoute><SystemControl /></AdminRoute>} />
            <Route path="/admin/database" element={<AdminRoute><DatabaseViewer /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/advertisements" element={<AdminRoute><AdminAdvertisements /></AdminRoute>} />
            <Route path="/admin/test" element={<AdminRoute><DirectApiTest /></AdminRoute>} />
            <Route path="/admin/diagnostic" element={<AdminRoute><TempDashboard /></AdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ShopProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
