import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      sessionStorage: {
        isAdmin: sessionStorage.getItem('isAdmin'),
        adminEmail: sessionStorage.getItem('adminEmail'),
      },
      cookies: document.cookie,
      hasAdminCookie: document.cookie.includes('admin_session=true'),
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  }, []);

  const testApiCall = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'X-Admin-Session': 'true',
          'Authorization': 'Bearer admin_session_true',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      alert(`API Test Result: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      alert(`API Test Error: ${error}`);
    }
  };

  const setCookie = () => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
    document.cookie = `admin_session=true; expires=${expires.toUTCString()}; path=/; SameSite=None; Secure`;
    window.location.reload();
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">🔍 Authentication Debug</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={testApiCall}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test API Call
          </button>
          
          <button
            onClick={setCookie}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Set Admin Cookie
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Refresh Page
          </button>
          
          <button
            onClick={() => {
              sessionStorage.setItem('isAdmin', 'true');
              sessionStorage.setItem('adminEmail', 'campusmart.care@gmail.com');
              window.location.reload();
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Set Session Storage
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuthDebug;