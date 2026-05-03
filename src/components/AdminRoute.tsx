import { Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Check if we're on the admin subdomain
  const isAdminDomain = window.location.hostname === "admin.campusmart.co.ke" || 
                        window.location.hostname === "localhost" ||
                        window.location.hostname === "127.0.0.1";
  
  // Redirect to admin subdomain if accessing from main domain
  useEffect(() => {
    const hostname = window.location.hostname;
    const isMainDomain = hostname === "campusmart.co.ke" || 
                        hostname === "www.campusmart.co.ke" ||
                        hostname.includes("campusmart-kenya.pages.dev");
    
    if (isMainDomain) {
      setIsRedirecting(true);
      // Redirect to admin subdomain
      window.location.href = `https://admin.campusmart.co.ke${window.location.pathname}${window.location.search}`;
    }
  }, []);

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

  // Block access if not on admin domain (except localhost for development)
  if (!isAdminDomain) {
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
