# CampusMart Admin Panel Guide

## Overview

The CampusMart Admin Panel is a comprehensive dashboard for monitoring and managing all platform activities. It provides real-time insights into users, products, orders, and overall platform health.

## Accessing the Admin Panel

### URL
Navigate to: `http://localhost:8080/admin` (development) or `https://yourdomain.com/admin` (production)

### Authentication
Currently, the admin panel is accessible without authentication. For production, you should implement admin authentication:

1. Add an `isAdmin` field to the user model
2. Create an admin middleware to protect routes
3. Redirect non-admin users to the home page

## Admin Dashboard Features

### 1. Main Dashboard (`/admin`)

**Overview Statistics:**
- **Total Users**: Number of registered users with active user count
- **Total Products**: Listed products on the platform
- **Total Orders**: All orders with pending count
- **Total Revenue**: Monthly revenue tracking

**Recent Activity Feed:**
- Real-time user registrations
- New product listings
- Order placements and completions
- Payment confirmations

**Platform Health Metrics:**
- User Engagement Rate
- Order Completion Rate
- Product Approval Rate
- Customer Satisfaction Score

**Quick Actions:**
- Direct links to user management
- Product moderation
- Order tracking

### 2. User Management (`/admin/users`)

**Features:**
- **Search**: Find users by name or email
- **Filter**: View users by status (Active, Pending, Suspended)
- **User Details**:
  - Profile information
  - Contact details (email, phone)
  - Registration date
  - Total orders and spending
  - Account status

**Actions:**
- Suspend active users
- Activate suspended users
- View detailed user profiles
- Monitor user activity

**Statistics:**
- Total users count
- Active users
- Pending verifications
- Suspended accounts

### 3. Product Management (`/admin/products`)

**Features:**
- **Search**: Find products by title or seller
- **Filter**: View by status (Approved, Pending, Rejected)
- **Product Cards Display**:
  - Product image
  - Title and seller
  - Price and category
  - Status badge
  - View count
  - Listing date

**Actions:**
- Approve pending products
- Reject inappropriate listings
- Review rejected products
- View product details

**Statistics:**
- Total products
- Approved listings
- Pending reviews
- Rejected items

### 4. Order Management (`/admin/orders`)

**Features:**
- **Search**: Find orders by ID or customer name
- **Filter**: View by status (Pending, Processing, Shipped, Delivered, Cancelled)
- **Order Table**:
  - Order ID
  - Customer name
  - Item count
  - Total amount
  - Payment method
  - Status with icon
  - Order date

**Actions:**
- View order details
- Update order status
- Track shipments
- Process refunds

**Statistics:**
- Total orders
- Pending orders
- Processing orders
- Shipped orders
- Delivered orders

## Implementation Details

### Data Structure

**Dashboard Stats:**
```typescript
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}
```

**User Model:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'pending';
  joinedDate: string;
  totalOrders: number;
  totalSpent: number;
  picture?: string;
}
```

**Product Model:**
```typescript
interface Product {
  id: string;
  title: string;
  seller: string;
  category: string;
  price: number;
  status: 'approved' | 'pending' | 'rejected';
  listedDate: string;
  views: number;
  image?: string;
}
```

**Order Model:**
```typescript
interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  paymentMethod: string;
}
```

## Connecting to Real Data

Currently, the admin panel uses mock data. To connect to real data:

### 1. Create API Endpoints

```typescript
// Example API structure
GET /api/admin/stats - Dashboard statistics
GET /api/admin/users - List all users
GET /api/admin/products - List all products
GET /api/admin/orders - List all orders
PUT /api/admin/users/:id/status - Update user status
PUT /api/admin/products/:id/status - Update product status
PUT /api/admin/orders/:id/status - Update order status
```

### 2. Replace Mock Data with API Calls

```typescript
// Example: Fetching users
useEffect(() => {
  fetch('/api/admin/users')
    .then(res => res.json())
    .then(data => setUsers(data))
    .catch(error => console.error('Error fetching users:', error));
}, []);
```

### 3. Implement Real-time Updates

Use WebSockets or polling for real-time activity feed:

```typescript
// Example: WebSocket connection
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080/admin/activity');
  
  ws.onmessage = (event) => {
    const activity = JSON.parse(event.data);
    setRecentActivity(prev => [activity, ...prev].slice(0, 10));
  };

  return () => ws.close();
}, []);
```

## Security Considerations

### 1. Authentication & Authorization

```typescript
// Add admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Protect admin routes
app.use('/api/admin/*', requireAdmin);
```

### 2. Role-Based Access Control

```typescript
// Define admin roles
enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support'
}

// Check permissions
const canModerateProducts = (user) => {
  return [AdminRole.SUPER_ADMIN, AdminRole.MODERATOR].includes(user.role);
};
```

### 3. Audit Logging

Log all admin actions for accountability:

```typescript
const logAdminAction = async (adminId, action, target, details) => {
  await db.adminLogs.create({
    adminId,
    action, // 'suspend_user', 'approve_product', etc.
    target, // user_id, product_id, etc.
    details,
    timestamp: new Date()
  });
};
```

## Customization

### Adding New Metrics

1. Update the `DashboardStats` interface
2. Fetch the new data in `useEffect`
3. Add a new stat card to the grid

### Adding New Admin Pages

1. Create a new component in `src/pages/admin/`
2. Add the route in `src/App.tsx`
3. Add a link in the dashboard quick actions

### Styling

The admin panel uses the same theme system as the main app:
- Tailwind CSS for styling
- CSS variables for theming
- Responsive design with mobile-first approach

## Best Practices

1. **Always validate admin permissions** before performing actions
2. **Log all administrative actions** for audit trails
3. **Use confirmation dialogs** for destructive actions
4. **Implement rate limiting** on admin endpoints
5. **Regular backups** of admin activity logs
6. **Monitor admin access patterns** for suspicious activity

## Future Enhancements

- [ ] Real-time notifications for admin actions
- [ ] Advanced analytics and reporting
- [ ] Bulk actions for users/products
- [ ] Export data to CSV/Excel
- [ ] Email notifications for critical events
- [ ] Admin activity dashboard
- [ ] Automated moderation rules
- [ ] Integration with payment gateway for refunds
- [ ] Customer support ticket system
- [ ] Platform settings management

## Support

For issues or questions about the admin panel:
1. Check the console for error messages
2. Verify API endpoints are working
3. Ensure proper authentication is in place
4. Review the audit logs for admin actions

## Production Checklist

Before deploying the admin panel to production:

- [ ] Implement proper authentication
- [ ] Add role-based access control
- [ ] Set up audit logging
- [ ] Configure rate limiting
- [ ] Add HTTPS enforcement
- [ ] Implement CSRF protection
- [ ] Set up monitoring and alerts
- [ ] Test all admin actions
- [ ] Document admin procedures
- [ ] Train admin users
