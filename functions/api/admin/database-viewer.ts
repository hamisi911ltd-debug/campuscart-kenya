// Database Viewer API - Direct D1 database access for admin
import { isOwner } from "../_lib/ownerAuth";


interface Env {
  DB: D1Database;
}

// Never show password hashes, tokens or secrets - not even to a signed-in admin.
const SENSITIVE_COLUMN = /pass(word)?|hash|token|secret|salt|session/i;
function maskSensitive(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) out[key] = SENSITIVE_COLUMN.test(key) && value != null ? "••••••••" : value;
    return out;
  });
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await isOwner(request, env))) {
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
        rows: maskSensitive((result.results || []) as Record<string, unknown>[])
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

  if (!(await isOwner(request, env))) {
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

    // READ-ONLY. A block-list of "dangerous" words can always be dodged (UPDATE users SET ...,
    // DROP TABLE ..., stacked statements), so instead only a single SELECT (or table_info) is
    // accepted at all. Changing data is done through the proper admin screens, not raw SQL.
    const trimmed = query.trim().replace(/;+\s*$/, '');
    const readOnly = /^(select\b|pragma\s+table_info\b|explain\s+select\b)/i.test(trimmed);
    const writes = /\b(insert|update|delete|drop|alter|create|replace|attach|detach|vacuum|reindex|truncate)\b/i.test(trimmed);
    if (!readOnly || writes || trimmed.includes(';')) {
      return new Response(JSON.stringify({ error: 'Only a single read-only SELECT query is allowed here.' }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Execute the query
    const result = await env.DB.prepare(trimmed).all();
    
    const columns = result.results?.length ? Object.keys(result.results[0]) : [];
    
    return new Response(JSON.stringify({
      success: true,
      columns,
      rows: maskSensitive((result.results || []) as Record<string, unknown>[]),
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