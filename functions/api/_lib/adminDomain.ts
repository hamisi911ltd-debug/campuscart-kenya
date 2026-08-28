// Admin panel is restricted to its own subdomain. Both domains are accepted
// during the reversion back to campusmart.co.ke as the canonical domain, so
// admin login doesn't lock out until DNS/Cloudflare custom domains are
// fully cut back over — remove the urbanstore.co.ke entry once that's done.
const ALLOWED_ADMIN_HOSTS = new Set([
  "admin.campusmart.co.ke",
  "admin.urbanstore.co.ke",
  "localhost",
]);

export function enforceAdminDomain(request: Request): Response | null {
  const url = new URL(request.url);
  if (!ALLOWED_ADMIN_HOSTS.has(url.hostname)) {
    return new Response(JSON.stringify({
      error: "Admin access is only available at admin.campusmart.co.ke",
    }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
