// Admin Authentication Utilities
//
// Two separate identities can be logged in here:
// - The main admin (owner): signs in with the ADMIN_PASSWORD secret, checked on the
//   server (/api/admin/login), which sets an HttpOnly session cookie. The
//   sessionStorage flags below only remember "signed in" for the UI. Full access.
// - A team member (an account created in Admin -> Team, with whichever
//   permission areas the owner granted them - "products", "orders",
//   "users", "coupons"): logs in via /api/admin/team-login, which sets a
//   `product_admin_session` cookie that only permission-checked API
//   endpoints look at. Recorded here as `teamAdmin*` sessionStorage flags
//   purely so the frontend knows what to show/hide - the real access
//   control happens server-side via hasPermission() in
//   functions/api/_lib/teamAuth.ts.
export type PermissionArea = "products" | "orders" | "users" | "coupons";

// The previous login system stored a site-wide cookie named admin_session (value "true").
// It must go: browsers send it alongside the real session cookie.
export const clearLegacyAdminCookie = () => {
  try {
    document.cookie = 'admin_session=; Path=/; Domain=.campusmart.co.ke; Max-Age=0; Secure; SameSite=None';
    document.cookie = 'admin_session=; Path=/; Max-Age=0';
  } catch { /* ignore */ }
};

export const setAdminSession = () => {
  clearLegacyAdminCookie();
  // Set session storage
  sessionStorage.setItem('isAdmin', 'true');
  sessionStorage.setItem('adminEmail', 'campusmart.care@gmail.com');

  // (No cookie is written here any more. The real session cookie is set by the
  // server at login: HttpOnly, so no script - ours or anyone's - can read or forge it.)
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

  // End the session on the server (it also clears the HttpOnly cookie)
  fetch('/api/admin/login', { method: 'DELETE', credentials: 'include' }).catch(() => {});
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



// For pages that call admin APIs directly: sends the session cookie and signs
// you out if the server says the session is gone. (Who you are is always
// decided by the server from the HttpOnly cookie, never by anything here.)
export const adminFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Cache-Control': 'no-cache', ...(options.headers || {}) },
  });
  if (response.status === 401) {
    clearAdminSession();
    window.location.href = '/admin/login';
  }
  return response;
};
