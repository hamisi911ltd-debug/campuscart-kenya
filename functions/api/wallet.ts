// User Wallet API

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'User ID is required'
    }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // First, ensure tables exist
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        balance REAL DEFAULT 0.00,
        total_earned REAL DEFAULT 0.00,
        total_spent REAL DEFAULT 0.00,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Get or create user wallet
    let wallet = await env.DB.prepare(`
      SELECT id, balance, total_earned, total_spent FROM user_wallets WHERE user_id = ?
    `).bind(userId).first();

    if (!wallet) {
      // Create wallet for user
      const walletId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO user_wallets (id, user_id, balance, total_earned, total_spent, created_at)
        VALUES (?, ?, 0, 0, 0, CURRENT_TIMESTAMP)
      `).bind(walletId, userId).run();
      
      wallet = { id: walletId, balance: 0, total_earned: 0, total_spent: 0 };
    }

    return new Response(JSON.stringify({
      success: true,
      balance: parseFloat(wallet.balance.toString()),
      totalEarned: parseFloat(wallet.total_earned.toString()),
      totalSpent: parseFloat(wallet.total_spent.toString())
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Wallet API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get wallet data',
      details: error.message
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