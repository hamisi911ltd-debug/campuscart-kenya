// Create admin logs table for tracking admin actions
import { isOwner } from "../_lib/ownerAuth";

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await isOwner(request, env))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Create admin logs table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id VARCHAR(36) PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(36),
        admin_session VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create index for performance
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at)
    `).run();

    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action)
    `).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Admin logs table created successfully"
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error creating admin logs table:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to create admin logs table",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}