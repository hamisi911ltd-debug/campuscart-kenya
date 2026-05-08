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
        const { code, orderTotal } = await request.json();

        if (!code) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Coupon code is required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Get coupon from database
        const coupon = await env.DB.prepare(`
          SELECT id, code, type, value, description, min_order_amount as minOrderAmount,
                 max_discount as maxDiscount, usage_limit as usageLimit, used_count as usedCount,
                 expires_at as expiresAt, is_active as active, created_at as createdAt
          FROM coupons 
          WHERE UPPER(code) = UPPER(?) AND is_active = 1
        `).bind(code).first();

        if (!coupon) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid coupon code'
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Validate coupon
        const now = new Date().toISOString();
        
        if (coupon.expiresAt && coupon.expiresAt < now) {
          return new Response(JSON.stringify({
            success: false,
            error: 'This coupon has expired'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return new Response(JSON.stringify({
            success: false,
            error: 'This coupon has reached its usage limit'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
          return new Response(JSON.stringify({
            success: false,
            error: `Minimum order amount is KES ${coupon.minOrderAmount.toLocaleString()}`
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'percentage') {
          discount = (orderTotal * coupon.value) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = Math.min(coupon.value, orderTotal);
        }

        return new Response(JSON.stringify({
          success: true,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            description: coupon.description,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscount: coupon.maxDiscount,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            expiresAt: coupon.expiresAt,
            active: coupon.active
          },
          discount
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
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
      console.error('Coupon validation error:', error);
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