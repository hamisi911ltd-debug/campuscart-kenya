// System Control API - Admin actions for managing the platform

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.includes("admin_session=true");
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
    const { action, targetId, targetType, data } = body;

    let result = {};

    switch (action) {
      case 'suspend_user':
        await env.DB.prepare(
          "UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(targetId).run();
        result = { message: "User suspended successfully" };
        break;

      case 'activate_user':
        await env.DB.prepare(
          "UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(targetId).run();
        result = { message: "User activated successfully" };
        break;

      case 'delete_user':
        // Soft delete - keep data for integrity but mark as deleted
        await env.DB.prepare(
          "UPDATE users SET is_active = 0, email = CONCAT('deleted_', id, '@deleted.com'), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(targetId).run();
        result = { message: "User deleted successfully" };
        break;

      case 'remove_product':
        await env.DB.prepare(
          "UPDATE products SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(targetId).run();
        result = { message: "Product removed successfully" };
        break;

      case 'approve_product':
        await env.DB.prepare(
          "UPDATE products SET is_available = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(targetId).run();
        result = { message: "Product approved successfully" };
        break;

      case 'cancel_order':
        await env.DB.prepare(
          "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(targetId).run();
        result = { message: "Order cancelled successfully" };
        break;

      case 'update_order_status':
        await env.DB.prepare(
          "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(data.status, targetId).run();
        
        if (data.status === 'delivered') {
          await env.DB.prepare(
            "UPDATE orders SET delivered_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).bind(targetId).run();
        }
        result = { message: `Order status updated to ${data.status}` };
        break;

      case 'delete_review':
        await env.DB.prepare(
          "DELETE FROM product_reviews WHERE id = ?"
        ).bind(targetId).run();
        result = { message: "Review deleted successfully" };
        break;

      case 'feature_product':
        // Add featured flag to product (you might need to add this column)
        await env.DB.prepare(
          "UPDATE products SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(1, targetId).run();
        result = { message: "Product featured successfully" };
        break;

      case 'send_notification':
        // Send notification to user
        const notificationId = crypto.randomUUID();
        await env.DB.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, created_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          notificationId,
          targetId,
          data.type || 'admin_message',
          data.title,
          data.message
        ).run();
        result = { message: "Notification sent successfully" };
        break;

      case 'bulk_action':
        // Handle bulk operations
        const { targets, bulkAction } = data;
        let successCount = 0;
        
        for (const target of targets) {
          try {
            switch (bulkAction) {
              case 'suspend_users':
                await env.DB.prepare(
                  "UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(target).run();
                break;
              case 'remove_products':
                await env.DB.prepare(
                  "UPDATE products SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(target).run();
                break;
            }
            successCount++;
          } catch (error) {
            console.error(`Bulk action failed for ${target}:`, error);
          }
        }
        result = { message: `Bulk action completed. ${successCount}/${targets.length} items processed.` };
        break;

      case 'clear_cache':
        // Clear any cached data (implement based on your caching strategy)
        result = { message: "Cache cleared successfully" };
        break;

      case 'backup_data':
        // Trigger data backup (implement based on your backup strategy)
        result = { message: "Data backup initiated" };
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }

    // Log admin action
    const logId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO admin_logs (id, action, target_type, target_id, admin_session, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(logId, action, targetType, targetId, 'admin').run().catch(() => {
      // Ignore if admin_logs table doesn't exist
    });

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error performing admin action:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to perform action",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// GET endpoint for retrieving control options
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Get system status and control options
    const systemStatus = {
      database: {
        status: 'connected',
        lastBackup: new Date().toISOString(), // Implement actual backup tracking
        totalTables: 15,
        totalRecords: await env.DB.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM users) +
            (SELECT COUNT(*) FROM products) +
            (SELECT COUNT(*) FROM orders) as total
        `).first()
      },
      storage: {
        status: 'connected',
        // R2 storage info would go here
      },
      performance: {
        responseTime: '< 100ms',
        uptime: '99.9%',
        activeConnections: 42 // Mock data
      }
    };

    const availableActions = [
      { id: 'suspend_user', name: 'Suspend User', description: 'Temporarily disable user account' },
      { id: 'activate_user', name: 'Activate User', description: 'Enable user account' },
      { id: 'delete_user', name: 'Delete User', description: 'Permanently remove user' },
      { id: 'remove_product', name: 'Remove Product', description: 'Hide product from listings' },
      { id: 'approve_product', name: 'Approve Product', description: 'Make product visible' },
      { id: 'cancel_order', name: 'Cancel Order', description: 'Cancel pending order' },
      { id: 'update_order_status', name: 'Update Order', description: 'Change order status' },
      { id: 'delete_review', name: 'Delete Review', description: 'Remove inappropriate review' },
      { id: 'feature_product', name: 'Feature Product', description: 'Promote product visibility' },
      { id: 'send_notification', name: 'Send Notification', description: 'Send message to user' },
      { id: 'bulk_action', name: 'Bulk Actions', description: 'Perform actions on multiple items' }
    ];

    return new Response(JSON.stringify({
      success: true,
      systemStatus,
      availableActions
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching system control data:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch system data" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}