// Cloudflare Pages Function for Admin Login

interface Env {
  ADMIN_PASSWORD?: string;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new Response(JSON.stringify({ error: "Password is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get admin password from environment variable or use default
    const adminPassword = env.ADMIN_PASSWORD || "admin123"; // Change this!

    if (password === adminPassword) {
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
    } else {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

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