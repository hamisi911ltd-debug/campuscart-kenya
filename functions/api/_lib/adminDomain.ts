// Admin panel is restricted to its own subdomain. Both the new and legacy
// domain are accepted during the campusmart.co.ke -> urbanstore.co.ke
// migration so admin login doesn't lock out until DNS/Cloudflare custom
// domains are fully cut over — remove the legacy entry once that's done.
const ALLOWED_ADMIN_HOSTS = new Set([
  "admin.urbanstore.co.ke",
  "admin.campusmart.co.ke",
  "localhost",
]);

export function enforceAdminDomain(request: Request): Response | null {
  const url = new URL(request.url);
  if (!ALLOWED_ADMIN_HOSTS.has(url.hostname)) {
    return new Response(JSON.stringify({
      error: "Admin access is only available at admin.urbanstore.co.ke",
    }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
