// Test endpoint to check environment variables
export async function onRequestGet(context: { env: any }) {
  const { env } = context;
  
  return new Response(JSON.stringify({
    hasAdminEmail: !!env.ADMIN_EMAIL,
    hasAdminPassword: !!env.ADMIN_PASSWORD,
    adminEmailLength: env.ADMIN_EMAIL ? env.ADMIN_EMAIL.length : 0,
    adminPasswordLength: env.ADMIN_PASSWORD ? env.ADMIN_PASSWORD.length : 0,
    // Don't expose actual values for security
  }), {
    headers: { "Content-Type": "application/json" }
  });
}