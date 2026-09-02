// Lucky Codes Management API (surfaced to the admin as "Coupons")
import { hasPermission } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await hasPermission(request, env, "coupons"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Fetch lucky codes from database
    const result = await env.DB.prepare(`
      SELECT id, code, points, description, usage_limit as usageLimit, used_count as usedCount,
             expires_at as expiresAt, is_active as active, created_at as createdAt
      FROM lucky_codes 
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      luckyCodes: result.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching lucky codes:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch lucky codes" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await hasPermission(request, env, "coupons"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { action, luckyCode } = body;

    if (action === 'create') {
      // Create new lucky code
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO lucky_codes (id, code, points, description, usage_limit, expires_at, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        id,
        luckyCode.code.toUpperCase(),
        luckyCode.points,
        luckyCode.description,
        luckyCode.usageLimit || null,
        luckyCode.expiresAt || null,
        luckyCode.active ? 1 : 0
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Lucky code created successfully',
        id
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } else if (action === 'update') {
      // Update existing lucky code
      await env.DB.prepare(`
        UPDATE lucky_codes 
        SET code = ?, points = ?, description = ?, usage_limit = ?, 
            expires_at = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        luckyCode.code.toUpperCase(),
        luckyCode.points,
        luckyCode.description,
        luckyCode.usageLimit || null,
        luckyCode.expiresAt || null,
        luckyCode.active ? 1 : 0,
        luckyCode.id
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Lucky code updated successfully'
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } else if (action === 'delete') {
      // Delete lucky code
      await env.DB.prepare(`
        DELETE FROM lucky_codes WHERE id = ?
      `).bind(luckyCode.id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Lucky code deleted successfully'
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error managing lucky codes:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to manage lucky codes" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}