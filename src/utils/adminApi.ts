import { clearAdminSession } from "@/utils/adminAuth";
// Admin API utility functions with proper authentication

export const adminFetch = async (url: string, options: RequestInit = {}) => {
  // Who is signed in is decided by the SERVER from an HttpOnly session cookie that
  // scripts can't read or forge. This flag (set after a real sign-in) only avoids
  // sending requests when we already know there is no session.
  const signedIn = sessionStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isTeamAdmin') === 'true';
  if (!signedIn) {
    throw new Error('Not authenticated as admin');
  }

  const headers = new Headers(options.headers);
  if (options.method === 'POST' || options.method === 'PUT') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends the session cookie
  });

  if (response.status === 401) {
    // Session ended or never existed: clear what we remember and go to the login page
    clearAdminSession();
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