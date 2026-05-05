// Admin API utility functions with proper authentication

export const adminFetch = async (url: string, options: RequestInit = {}) => {
  // Get authentication from sessionStorage and cookies
  const hasSessionAuth = sessionStorage.getItem('isAdmin') === 'true';
  const hasCookieAuth = document.cookie.includes('admin_session=true');
  
  if (!hasSessionAuth && !hasCookieAuth) {
    throw new Error('Not authenticated as admin');
  }

  // Prepare headers with authentication
  const headers = new Headers(options.headers);
  
  // Add custom header for session-based auth (fallback for mobile)
  if (hasSessionAuth) {
    headers.set('X-Admin-Session', 'true');
  }
  
  // Add Authorization header as additional fallback
  if (hasSessionAuth || hasCookieAuth) {
    headers.set('Authorization', 'Bearer admin_session_true');
  }
  
  // Ensure Content-Type for JSON requests
  if (options.method === 'POST' || options.method === 'PUT') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });

  if (response.status === 401) {
    // Clear invalid session and redirect to login
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminEmail');
    document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/admin/login';
    throw new Error('Authentication expired');
  }

  return response;
};

// Helper for GET requests
export const adminGet = async (url: string) => {
  return adminFetch(url, { method: 'GET' });
};

// Helper for POST requests
export const adminPost = async (url: string, data: any) => {
  return adminFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Helper for PUT requests
export const adminPut = async (url: string, data: any) => {
  return adminFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Helper for DELETE requests
export const adminDelete = async (url: string) => {
  return adminFetch(url, { method: 'DELETE' });
};