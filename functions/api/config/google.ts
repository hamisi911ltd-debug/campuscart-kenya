// Cloudflare Pages Function - Public Google OAuth Config
export async function onRequestGet({ env }: any) {
  return Response.json({
    clientId: env.GOOGLE_CLIENT_ID || "456038926351-rq60a0dmrh2e5m85leqcfhg6ndoce8h8.apps.googleusercontent.com",
  });
}
