// Debug Lucky Codes - Check what's in database

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env } = context;

  try {
    // Check if tables exist
    const tables = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='lucky_codes'
    `).all();

    // Get all lucky codes
    const allCodes = await env.DB.prepare(`
      SELECT * FROM lucky_codes ORDER BY created_at DESC
    `).all();

    // Get count
    const count = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM lucky_codes
    `).first();

    return new Response(JSON.stringify({
      success: true,
      tablesExist: tables.results.length > 0,
      totalCodes: count?.total || 0,
      codes: allCodes.results || [],
      debug: {
        timestamp: new Date().toISOString(),
        query: "SELECT * FROM lucky_codes ORDER BY created_at DESC"
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}