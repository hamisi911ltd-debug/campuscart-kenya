// Database Viewer API - Direct D1 database access for admin

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
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const tableName = url.searchParams.get('table');

    if (action === 'tables') {
      // Get all tables with row counts
      const tablesResult = await env.DB.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();

      const tables = [];
      for (const table of tablesResult.results || []) {
        try {
          const countResult = await env.DB.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).first();
          tables.push({
            name: table.name,
            count: countResult?.count || 0
          });
        } catch (error) {
          tables.push({
            name: table.name,
            count: 0
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        tables
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (action === 'view' && tableName) {
      // Validate table name exists
      const tableCheck = await env.DB.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = ?
      `).bind(tableName).first();

      if (!tableCheck) {
        return new Response(JSON.stringify({ error: 'Table not found' }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get table data (limit to 500 rows for performance)
      const result = await env.DB.prepare(`SELECT * FROM "${tableName}" LIMIT 500`).all();
      
      const columns = result.results?.length ? Object.keys(result.results[0]) : [];
      
      return new Response(JSON.stringify({
        success: true,
        columns,
        rows: result.results || []
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Database viewer error:", error);
    return new Response(JSON.stringify({ 
      error: "Database operation failed",
      details: error.message 
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
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'No query provided' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Basic security checks - prevent dangerous operations
    const upperQuery = query.toUpperCase().trim();
    const dangerousOperations = [
      'DROP DATABASE',
      'DROP SCHEMA', 
      'TRUNCATE',
      'DELETE FROM users',
      'DELETE FROM products',
      'DELETE FROM orders'
    ];

    for (const dangerous of dangerousOperations) {
      if (upperQuery.includes(dangerous)) {
        return new Response(JSON.stringify({ 
          error: `Operation "${dangerous}" is not allowed for security reasons` 
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Execute the query
    const result = await env.DB.prepare(query).all();
    
    const columns = result.results?.length ? Object.keys(result.results[0]) : [];
    
    return new Response(JSON.stringify({
      success: true,
      columns,
      rows: result.results || [],
      rowCount: result.results?.length || 0
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Query execution error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Query execution failed"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}