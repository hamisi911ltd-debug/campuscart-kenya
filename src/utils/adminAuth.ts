// Admin Authentication Utilities

export const setAdminSession = () => {
  // Set session storage
  sessionStorage.setItem('isAdmin', 'true');
  sessionStorage.setItem('adminEmail', 'campusmart.care@gmail.com');
  
  // Set cookie with proper attributes
  const expires = new Date();
  expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
  
  // Set cookie for current domain and all subdomains
  const domain = window.location.hostname.includes('urbanstore.co.ke')
    ? '.urbanstore.co.ke'
    : window.location.hostname.includes('campusmart.co.ke') // legacy domain, remove once migration is complete
    ? '.campusmart.co.ke'
    : window.location.hostname;

  document.cookie = `admin_session=true; expires=${expires.toUTCString()}; path=/; domain=${domain}; SameSite=None; Secure`;
};

export const clearAdminSession = () => {
  // Clear session storage
  sessionStorage.removeItem('isAdmin');
  sessionStorage.removeItem('adminEmail');
  
  // Clear cookie
  const domain = window.location.hostname.includes('urbanstore.co.ke')
    ? '.urbanstore.co.ke'
    : window.location.hostname.includes('campusmart.co.ke') // legacy domain, remove once migration is complete
    ? '.campusmart.co.ke'
    : window.location.hostname;

  document.cookie = `admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; SameSite=None; Secure`;
};

export const isAdminAuthenticated = (): boolean => {
  return sessionStorage.getItem('isAdmin') === 'true';
};

export const getAdminFetchOptions = (): RequestInit => {
  return {
    credentials: 'include',
    headers: {
      'Cache-Control': 'no-cache',
      'X-Admin-Session': sessionStorage.getItem('isAdmin') || 'false',
    }
  };
};

export const adminFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const adminOptions = getAdminFetchOptions();
  
  return fetch(url, {
    ...adminOptions,
    ...options,
    headers: {
      ...adminOptions.headers,
      ...options.headers,
    }
  });
};