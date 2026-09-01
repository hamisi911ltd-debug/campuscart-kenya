import { Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // More flexible domain checking - allow admin access on mobile and development
  const hostname = window.location.hostname;
  const isAdminDomain = hostname === "admin.campusmart.co.ke" ||
                        hostname === "admin.urbanstore.co.ke" || // legacy domain from the brief Urban Store rebrand, remove once fully reverted
                        hostname === "localhost" ||
                        hostname === "127.0.0.1" ||
                        hostname.includes("campusmart-kenya.pages.dev") ||
                        hostname.includes("admin.urbanstore") ||
                        hostname.includes("admin.campusmart") ||
                        // Allow mobile browsers and development environments
                        hostname.includes("192.168.") ||
                        hostname.includes("10.0.") ||
                        hostname.includes("172.");

  // Only redirect to admin subdomain from main production domain
  useEffect(() => {
    const isMainProductionDomain = hostname === "urbanstore.co.ke" ||
                                  hostname === "www.urbanstore.co.ke" ||
                                  hostname === "campusmart.co.ke" ||
                                  hostname === "www.campusmart.co.ke";

    if (isMainProductionDomain && !window.location.pathname.startsWith('/admin')) {
      setIsRedirecting(true);
      // Redirect to admin subdomain
      window.location.href = `https://admin.campusmart.co.ke${window.location.pathname}${window.location.search}`;
    }
  }, [hostname]);

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Redirecting to admin portal...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated as admin (check both session and cookie)
  const hasSessionAuth = sessionStorage.getItem('isAdmin') === 'true';
  const hasCookieAuth = document.cookie.includes('admin_session=true');
  const isAdmin = hasSessionAuth || hasCookieAuth;
  
  if (!isAdmin) {
    // Redirect to admin login if not authenticated
    return <Navigate to="/admin/login" replace />;
  }

  // For development and mobile access, allow admin access even if not on exact admin domain
  const isDevelopment = hostname === "localhost" || 
                       hostname === "127.0.0.1" || 
                       hostname.includes("campusmart-kenya.pages.dev") ||
                       hostname.includes("192.168.") ||
                       hostname.includes("10.0.") ||
                       hostname.includes("172.");

  // Block access only if on main production domain without proper subdomain
  if (!isAdminDomain && !isDevelopment && (hostname === "urbanstore.co.ke" || hostname === "www.urbanstore.co.ke" || hostname === "campusmart.co.ke" || hostname === "www.campusmart.co.ke")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⛔ Access Denied</h1>
          <p className="text-gray-700 mb-4">
            Admin access is only available at <strong>admin.campusmart.co.ke</strong>
          </p>
          <a
            href="https://admin.campusmart.co.ke/admin/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Admin Portal
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
