export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (request.method === 'POST') {
        const { code, userId } = await request.json();

        if (!code || !userId) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Code and user ID are required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Get lucky code from database
        const luckyCode = await env.DB.prepare(`
          SELECT id, code, points, description, usage_limit, used_count, expires_at, is_active
          FROM lucky_codes 
          WHERE UPPER(code) = UPPER(?) AND is_active = 1
        `).bind(code).first();

        if (!luckyCode) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid lucky code'
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Validate lucky code
        const now = new Date().toISOString();
        
        if (luckyCode.expires_at && luckyCode.expires_at < now) {
          return new Response(JSON.stringify({
            success: false,
            error: 'This lucky code has expired'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        if (luckyCode.usage_limit && luckyCode.used_count >= luckyCode.usage_limit) {
          return new Response(JSON.stringify({
            success: false,
            error: 'This lucky code has reached its usage limit'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Check if user has already redeemed this code
        const existingRedemption = await env.DB.prepare(`
          SELECT id FROM lucky_code_redemptions 
          WHERE user_id = ? AND lucky_code_id = ?
        `).bind(userId, luckyCode.id).first();

        if (existingRedemption) {
          return new Response(JSON.stringify({
            success: false,
            error: 'You have already redeemed this lucky code'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Get or create user wallet
        let wallet = await env.DB.prepare(`
          SELECT id, balance FROM user_wallets WHERE user_id = ?
        `).bind(userId).first();

        if (!wallet) {
          // Create wallet for user
          const walletId = crypto.randomUUID();
          await env.DB.prepare(`
            INSERT INTO user_wallets (id, user_id, balance, total_earned, created_at)
            VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP)
          `).bind(walletId, userId).run();
          
          wallet = { id: walletId, balance: 0 };
        }

        const oldBalance = parseFloat(wallet.balance.toString());
        const newBalance = oldBalance + parseFloat(luckyCode.points.toString());

        // Start transaction
        try {
          // Update wallet balance
          await env.DB.prepare(`
            UPDATE user_wallets 
            SET balance = ?, total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `).bind(newBalance, luckyCode.points, userId).run();

          // Record wallet transaction
          await env.DB.prepare(`
            INSERT INTO wallet_transactions (id, user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after, created_at)
            VALUES (?, ?, 'credit', ?, ?, 'lucky_code', ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            crypto.randomUUID(),
            userId,
            luckyCode.points,
            `Lucky code redeemed: ${luckyCode.code}`,
            luckyCode.id,
            oldBalance,
            newBalance
          ).run();

          // Record redemption
          await env.DB.prepare(`
            INSERT INTO lucky_code_redemptions (id, user_id, lucky_code_id, points_earned, redeemed_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            crypto.randomUUID(),
            userId,
            luckyCode.id,
            luckyCode.points
          ).run();

          // Update lucky code usage count
          await env.DB.prepare(`
            UPDATE lucky_codes 
            SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(luckyCode.id).run();

          return new Response(JSON.stringify({
            success: true,
            points: parseFloat(luckyCode.points.toString()),
            newBalance: newBalance,
            message: `You earned KES ${luckyCode.points} in your wallet!`
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });

        } catch (transactionError) {
          console.error('Transaction error:', transactionError);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to process redemption'
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Lucky code redemption error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};