// Admin Authentication Utilities
//
// Two separate identities can be logged in here:
// - The main admin (owner): unchanged from before - a single hardcoded
//   password (AdminLogin.tsx) sets the `admin_session` cookie + sessionStorage
//   flags below. Full access everywhere, every permission.
// - A team member (an account created in Admin -> Team, with whichever
//   permission areas the owner granted them - "products", "orders",
//   "users", "coupons"): logs in via /api/admin/team-login, which sets a
//   `product_admin_session` cookie that only permission-checked API
//   endpoints look at. Recorded here as `teamAdmin*` sessionStorage flags
//   purely so the frontend knows what to show/hide - the real access
//   control happens server-side via hasPermission() in
//   functions/api/_lib/teamAuth.ts.
export type PermissionArea = "products" | "orders" | "users" | "coupons";

export const setAdminSession = () => {
  // Set session storage
  sessionStorage.setItem('isAdmin', 'true');
  sessionStorage.setItem('adminEmail', 'campusmart.care@gmail.com');

  // Set cookie with proper attributes
  const expires = new Date();
  expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000)); // 24 hours

  // Set cookie for current domain and all subdomains
  const domain = window.location.hostname.includes('campusmart.co.ke')
    ? '.campusmart.co.ke'
    : window.location.hostname.includes('urbanstore.co.ke') // legacy domain from the brief Urban Store rebrand
    ? '.urbanstore.co.ke'
    : window.location.hostname;

  document.cookie = `admin_session=true; expires=${expires.toUTCString()}; path=/; domain=${domain}; SameSite=None; Secure`;
};

// Called after a successful POST to /api/admin/team-login (which itself
// sets the product_admin_session cookie via Set-Cookie) - this just records
// who's logged in and what they can do, for the UI (nav filtering, header
// display, route guards).
export const setTeamAdminSession = (admin: { email: string; full_name?: string | null; permissions: string[] }) => {
  sessionStorage.setItem('isTeamAdmin', 'true');
  sessionStorage.setItem('teamAdminEmail', admin.email);
  sessionStorage.setItem('teamAdminName', admin.full_name || admin.email);
  sessionStorage.setItem('teamAdminPermissions', JSON.stringify(admin.permissions || []));
};

export const clearAdminSession = () => {
  // Clear owner session storage
  sessionStorage.removeItem('isAdmin');
  sessionStorage.removeItem('adminEmail');

  // Clear team session storage
  sessionStorage.removeItem('isTeamAdmin');
  sessionStorage.removeItem('teamAdminEmail');
  sessionStorage.removeItem('teamAdminName');
  sessionStorage.removeItem('teamAdminPermissions');

  // Clear cookies
  const domain = window.location.hostname.includes('campusmart.co.ke')
    ? '.campusmart.co.ke'
    : window.location.hostname.includes('urbanstore.co.ke') // legacy domain from the brief Urban Store rebrand
    ? '.urbanstore.co.ke'
    : window.location.hostname;

  document.cookie = `admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; SameSite=None; Secure`;
  document.cookie = `product_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure`;
};

export const isAdminAuthenticated = (): boolean => {
  return sessionStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isTeamAdmin') === 'true';
};

// True only for the main admin (owner) - use to gate owner-only UI (Team
// management, Orders, Users, Coupons, System Control, etc. unless the
// team member holds that specific permission - see hasTeamPermission).
// The real enforcement for API calls always happens server-side.
export const isOwnerAdmin = (): boolean => {
  return sessionStorage.getItem('isAdmin') === 'true';
};

export const isTeamAdmin = (): boolean => {
  return sessionStorage.getItem('isTeamAdmin') === 'true';
};

export const getTeamPermissions = (): PermissionArea[] => {
  try {
    return JSON.parse(sessionStorage.getItem('teamAdminPermissions') || '[]');
  } catch {
    return [];
  }
};

// Owner can do everything; a team member needs the specific area granted.
export const canAccess = (area: PermissionArea): boolean => {
  if (isOwnerAdmin()) return true;
  return getTeamPermissions().includes(area);
};

export const getAdminDisplayName = (): string => {
  if (isOwnerAdmin()) return sessionStorage.getItem('adminEmail') || 'Admin';
  return sessionStorage.getItem('teamAdminName') || sessionStorage.getItem('teamAdminEmail') || 'Team member';
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
