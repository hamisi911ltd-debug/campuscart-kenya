# Admin Access Guide

## 🔐 Admin Login Credentials

**Email:** `campusmart.care@gmail.com`  
**Password:** `LUCIAHOKOREISMAMA1`

## 🚀 How to Access Admin Dashboard

### Step 1: Navigate to Admin Login
Go to: `http://localhost:8080/admin/login`

### Step 2: Enter Credentials
- **Email:** campusmart.care@gmail.com
- **Password:** LUCIAHOKOREISMAMA1

### Step 3: Access Dashboard
After successful login, you'll be redirected to the admin dashboard at `/admin`

## 📱 Admin Dashboard Features

Once logged in, you have access to:

1. **Main Dashboard** (`/admin`)
   - Platform statistics
   - Recent activity feed
   - Platform health metrics
   - Quick action cards

2. **User Management** (`/admin/users`)
   - View all users
   - Search and filter users
   - Suspend/activate accounts
   - View user details

3. **Product Management** (`/admin/products`)
   - Review product listings
   - Approve/reject products
   - Search and filter products
   - View product details

4. **Order Management** (`/admin/orders`)
   - Track all orders
   - View order details
   - Filter by status
   - Monitor transactions

## 🔒 Security Features

### Session-Based Authentication
- Admin login creates a secure session
- Session stored in `sessionStorage`
- Automatically expires when browser closes
- Protected routes redirect to login if not authenticated

### Protected Routes
All admin routes are protected:
- `/admin` - Main dashboard
- `/admin/users` - User management
- `/admin/products` - Product management
- `/admin/orders` - Order management

If you try to access any admin route without logging in, you'll be redirected to `/admin/login`

### Logout
To logout:
1. Close the browser tab/window (session expires automatically)
2. Or clear browser session storage

## 🎯 Quick Access

### Direct URL Method:
1. Type in browser: `http://localhost:8080/admin/login`
2. Enter credentials
3. Click "Sign in to Admin Dashboard"

### From Main Site:
1. Go to `http://localhost:8080`
2. Manually navigate to `/admin/login` in the URL bar
3. Enter credentials

## ⚠️ Important Notes

### Google Authentication Removed
- Google Sign-In has been completely removed
- Only email/password authentication is available
- Regular users use the standard sign-up/sign-in flow
- Admin uses the dedicated admin login page

### Admin vs Regular Users
- **Regular Users**: Sign up/sign in at `/auth`
- **Admin**: Login at `/admin/login` with specific credentials
- Admin cannot access through regular user login
- Regular users cannot access admin dashboard

### Security Best Practices

**For Development:**
- Current setup is suitable for development/testing
- Credentials are hardcoded for simplicity

**For Production:**
- Move credentials to environment variables
- Use backend authentication API
- Implement JWT tokens
- Add rate limiting
- Enable HTTPS
- Add 2FA (Two-Factor Authentication)
- Implement audit logging
- Use secure password hashing (bcrypt)

## 🔧 Technical Details

### Admin Login Component
Location: `src/pages/admin/AdminLogin.tsx`

Features:
- Email and password validation
- Show/hide password toggle
- Loading states
- Error handling
- Session management

### Protected Route Component
Location: `src/components/AdminRoute.tsx`

Function:
- Checks if user is authenticated as admin
- Redirects to login if not authenticated
- Wraps all admin pages

### Session Storage
```javascript
// Login sets these values:
sessionStorage.setItem('isAdmin', 'true');
sessionStorage.setItem('adminEmail', email);

// Protected route checks:
const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
```

## 🚨 Troubleshooting

### Can't Access Admin Dashboard
1. Make sure you're using the correct URL: `/admin/login`
2. Verify credentials are entered correctly (case-sensitive)
3. Check browser console for errors
4. Clear browser cache and try again

### Redirected to Login Page
- This means your session expired or you're not authenticated
- Simply login again with the admin credentials

### Login Button Not Working
1. Check that all fields are filled
2. Verify email format is correct
3. Check browser console for errors
4. Refresh the page and try again

## 📝 Credentials Summary

**ADMIN LOGIN**
- URL: `http://localhost:8080/admin/login`
- Email: `campusmart.care@gmail.com`
- Password: `LUCIAHOKOREISMAMA1`

**Remember:** These credentials are only for admin access. Regular users create their own accounts through the standard sign-up process.

## 🎨 Admin Login Page Design

The admin login page features:
- Purple/blue gradient background
- Secure shield icon
- Clean, professional design
- Password visibility toggle
- Loading states
- Error messages
- Back to site link

## ✅ Changes Made

1. ✅ Removed Google Authentication completely
2. ✅ Created dedicated admin login page
3. ✅ Implemented session-based authentication
4. ✅ Protected all admin routes
5. ✅ Set specific admin credentials
6. ✅ Removed admin access from regular user interface
7. ✅ Admin only accessible through `/admin/login`

All admin features are now secure and accessible only through the dedicated admin login page with the specified credentials!
