// Advertisement Management API

interface Env {
  DB: D1Database;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.includes("admin_session=true");
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Fetch advertisements from database
    const result = await env.DB.prepare(`
      SELECT * FROM advertisements 
      ORDER BY display_order ASC, created_at DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      advertisements: result.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch advertisements" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { action, advertisement, advertisements } = body;

    if (action === 'create') {
      // Create new advertisement
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO advertisements (id, title, description, image_url, link_url, is_active, display_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        id,
        advertisement.title,
        advertisement.description || '',
        advertisement.imageUrl,
        advertisement.link || null,
        advertisement.active ? 1 : 0,
        advertisement.order || 0
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Advertisement created successfully',
        id
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } else if (action === 'update') {
      // Update existing advertisement
      await env.DB.prepare(`
        UPDATE advertisements 
        SET title = ?, description = ?, image_url = ?, link_url = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        advertisement.title,
        advertisement.description || '',
        advertisement.imageUrl,
        advertisement.link || null,
        advertisement.active ? 1 : 0,
        advertisement.order || 0,
        advertisement.id
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Advertisement updated successfully'
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } else if (action === 'delete') {
      // Delete advertisement
      await env.DB.prepare(`
        DELETE FROM advertisements WHERE id = ?
      `).bind(advertisement.id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Advertisement deleted successfully'
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } else if (advertisements) {
      // Bulk update (for localStorage sync)
      // This is a fallback for development - in production, use individual operations
      return new Response(JSON.stringify({
        success: true,
        message: 'Advertisements synced (development mode)'
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error managing advertisements:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to manage advertisements" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPut(context: { env: Env; request: Request }) {
  return onRequestPost(context);
}

export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Advertisement ID required' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await env.DB.prepare(`
      DELETE FROM advertisements WHERE id = ?
    `).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Advertisement deleted successfully'
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error deleting advertisement:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to delete advertisement" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}