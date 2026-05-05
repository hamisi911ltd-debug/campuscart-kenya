export function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  const authHeader = request.headers.get("Authorization") || "";
  const sessionHeader = request.headers.get("X-Admin-Session") || "";

  return (
    cookie.includes("admin_session=true") ||
    authHeader === "Bearer admin_session_true" ||
    sessionHeader === "true"
  );
}
