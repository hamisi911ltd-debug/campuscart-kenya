# CampusMart Admin - Quick Start Guide

## 🔐 Admin Login

**URL**: `http://localhost:8080/admin/login`

**Credentials**:
- Email: `campusmart.care@gmail.com`
- Password: `LUCIAHOKOREISMAMA1`

---

## 📋 Admin Menu Overview

### 1. Dashboard (`/admin`)
- Platform statistics at a glance
- Recent activity feed
- Quick metrics: users, products, orders, revenue

### 2. Users (`/admin/users`)
- View all registered users
- See user details: name, email, phone, campus
- Monitor registration dates

### 3. Products (`/admin/products`)
- View all product listings
- See seller information
- Track product performance

### 4. Orders (`/admin/orders`)
- Monitor all customer orders
- Track order status
- View customer and product details

### 5. Advertisements (`/admin/advertisements`) ⭐ NEW
- Create homepage slide ads
- Edit/delete existing ads
- Control ad visibility
- Reorder ad display

---

## 🎯 How to Create an Advertisement

1. **Login** to admin panel
2. Click **"Advertisements"** in sidebar
3. Click **"New Ad"** button
4. Fill in the form:
   - **Title**: Main headline (e.g., "MacBook Pro Sale")
   - **Description**: Subtitle text (e.g., "Get 15% off today")
   - **Image URL**: Path to image (e.g., `/src/assets/p-macbook.jpg`)
   - **Link** (optional): Where to navigate when clicked (e.g., `/product/1`)
   - **Active**: Check to show on homepage
5. Click **"Create Advertisement"**

### Image URL Examples
```
/src/assets/p-macbook.jpg
/src/assets/p-fridge.jpg
/src/assets/p-sneakers.jpg
```

### Link Examples
```
/product/1          → Link to specific product
/category/electronics → Link to category
/search             → Link to search page
https://example.com → External link
```

---

## 🔄 Managing Advertisements

### Edit an Ad
- Click the **blue edit button** (pencil icon)
- Modify fields
- Click "Update Advertisement"

### Delete an Ad
- Click the **red delete button** (trash icon)
- Confirm deletion

### Toggle Active/Inactive
- Click the **eye icon** to show/hide ad on homepage
- Active ads appear in green
- Inactive ads appear in gray

### Reorder Ads
- Use **up/down arrows** to change display order
- Ads display in order on homepage carousel

---

## 📱 WhatsApp Orders

When customers place orders via WhatsApp, you'll receive messages at:
**0108254465**

### Order Message Format
```
🛒 New Order Request

👤 Customer Details:
Name: [Customer Name]
Email: [Customer Email]
Phone: [Customer Phone]

📦 Product Details:
Product: [Product Name]
Price: KES [Amount]
Quantity: [Number]
Total: KES [Total Amount]
Category: [Category]
Campus: [Campus]

👨‍💼 Seller/Poster Details:
Name: [Seller Name]
Email: [Seller Email]
Phone: [Seller Phone]
Campus: [Seller Campus]

Please confirm this order. Thank you!
```

---

## 💡 Tips & Best Practices

### For Advertisements
- Use high-quality images (aspect ratio 16:9 works best)
- Keep titles short and catchy (under 30 characters)
- Make descriptions clear and actionable
- Test links before activating ads
- Limit active ads to 5-10 for best performance
- Reorder ads to feature most important ones first

### For Product Management
- Ensure all products have seller information
- Monitor product performance regularly
- Remove inactive or sold products

### For Order Management
- Respond to WhatsApp orders promptly
- Verify customer and seller details
- Coordinate delivery between buyer and seller

---

## 🎨 Advertisement Design Tips

### Good Advertisement Examples

**Example 1: Product Sale**
- Title: "MacBook Pro 13" Sale"
- Description: "Perfect for Coding • Save KES 15K"
- Image: Product photo
- Link: `/product/1`

**Example 2: Category Promotion**
- Title: "Electronics Week"
- Description: "Up to 30% off all gadgets"
- Image: Category banner
- Link: `/category/electronics`

**Example 3: Service Announcement**
- Title: "Free Campus Delivery"
- Description: "Order now • Delivered in 1 hour"
- Image: Delivery graphic
- Link: `/search`

---

## 🔧 Troubleshooting

### Ad Not Showing on Homepage
- Check if ad is marked as "Active"
- Verify image URL is correct
- Refresh homepage to see changes

### Image Not Loading
- Ensure image path is correct
- Use images from `/src/assets/` folder
- Check image file exists

### Link Not Working
- Verify link format (starts with `/` for internal links)
- Test link by clicking ad on homepage

---

## 📊 Statistics Overview

The admin dashboard shows:
- **Total Users**: Number of registered users
- **Total Products**: Number of listed products
- **Total Orders**: Number of orders placed
- **Total Revenue**: Sum of all order values
- **Recent Activity**: Latest platform actions

---

## 🚀 Quick Actions

### Daily Tasks
1. Check new orders on WhatsApp
2. Review new user registrations
3. Monitor product listings
4. Update advertisements as needed

### Weekly Tasks
1. Analyze order trends
2. Update featured advertisements
3. Review user feedback
4. Clean up inactive products

### Monthly Tasks
1. Generate revenue reports
2. Plan promotional campaigns
3. Update platform policies
4. Review seller performance

---

## 📞 Support

**Admin Contact**
- Email: campusmart.care@gmail.com
- WhatsApp: 0108254465

**For Technical Issues**
- Check browser console for errors
- Clear browser cache and reload
- Ensure you're logged in as admin

---

## 🎯 Success Metrics

Track these KPIs:
- Number of active users
- Products listed per day
- Orders completed per week
- Average order value
- Advertisement click-through rate

---

*Quick Start Guide v1.0*
*Last Updated: April 29, 2026*
