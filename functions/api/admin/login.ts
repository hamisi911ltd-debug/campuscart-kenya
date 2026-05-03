// Cloudflare Pages Function for Admin Login

interface Env {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

// Enforce admin subdomain access only
function enforceAdminDomain(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.hostname !== "admin.campusmart.co.ke" && url.hostname !== "localhost") {
    return new Response(JSON.stringify({ 
      error: "Admin access is only available at admin.campusmart.co.ke" 
    }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  // Check domain restriction
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // TEMPORARY: Hardcoded credentials (will fix with env vars later)
    const TEMP_ADMIN_EMAIL = "campusmart.care@gmail.com";
    const TEMP_ADMIN_PASSWORD = "LUCYISOKORE@2026";

    // Validate email
    if (email.toLowerCase() !== TEMP_ADMIN_EMAIL.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate password
    if (password !== TEMP_ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Set secure admin session cookie
    const response = new Response(JSON.stringify({ 
      success: true, 
      message: "Login successful" 
    }), {
      headers: { "Content-Type": "application/json" }
    });

    // Set HTTP-only secure cookie
    response.headers.set("Set-Cookie", 
      "admin_session=true; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400"
    );

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Login failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestDelete(context: { request: Request }) {
  // Logout - clear the admin session cookie
  const response = new Response(JSON.stringify({ 
    success: true, 
    message: "Logged out successfully" 
  }), {
    headers: { "Content-Type": "application/json" }
  });

  response.headers.set("Set-Cookie", 
    "admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
  );

  return response;
}