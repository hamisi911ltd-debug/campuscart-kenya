# Quick Order Tracking Guide

## 🛒 How to Place an Order

### Step 1: Browse & Select
1. Browse products on homepage
2. Click on a product you want
3. Price card turns **RED** (indicates selection)
4. Select quantity using +/- buttons

### Step 2: Checkout
1. Click **"Checkout"** button (green, primary action)
   - OR click "Add to cart" to add more items first
2. Review your cart items
3. Click "Checkout with M-PESA"

### Step 3: Payment Details
1. Enter your delivery address
   - Example: "Hostel Block A, Room 205"
2. Enter your M-PESA phone number
   - Example: "0712345678"
3. Click **"Pay with M-PESA"**

### Step 4: Confirmation
1. ✅ Order number generated (e.g., CM12345678)
2. 📱 WhatsApp opens automatically with order details
3. 💬 Message sent to admin
4. 🎉 Success screen appears

### Step 5: Track Your Order
1. Click **"Track Order"** button
   - OR go to Profile → My Orders
2. View your order status
3. Click order to see full details

---

## 📍 How to Track Orders

### Access Order Tracking:
**Option 1**: From success screen → Click "Track Order"
**Option 2**: Profile → My Orders
**Option 3**: Direct URL: `/orders`

### Order List View:
```
┌─────────────────────────────────────┐
│ Order #CM12345678          🟡 Pending│
│ Apr 29, 2026                         │
│                                      │
│ MacBook Pro 13" × 1                  │
│ Casio Calculator × 2                 │
│                                      │
│ Total: KES 48,600                    │
└─────────────────────────────────────┘
```

### Order Details View:
```
┌─────────────────────────────────────┐
│ ← Back to all orders                │
│                                      │
│ Order #CM12345678      🟡 Pending   │
│ Placed on Apr 29, 2026, 2:30 PM     │
│                                      │
│ ORDER TIMELINE:                      │
│ ● Pending         ← Current          │
│ ○ Processing                         │
│ ○ Shipped                            │
│ ○ Delivered                          │
│                                      │
│ ORDER ITEMS:                         │
│ MacBook Pro 13"                      │
│ Qty: 1 × KES 45,000                  │
│ Seller: John Kamau                   │
│ 📱 0712345678                        │
│ 📍 UoN Main                          │
│                                      │
│ DELIVERY INFO:                       │
│ 📍 Hostel Block A, Room 205         │
│ 👤 Customer Name                     │
│ 📱 0712345678                        │
│ ✉️ customer@email.com                │
└─────────────────────────────────────┘
```

---

## 🎨 Order Status Colors

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| 🟡 Pending | ⏰ | Yellow | Order received, awaiting processing |
| 🔵 Processing | 📦 | Blue | Order being prepared by seller |
| 🟣 Shipped | 🚚 | Purple | Order out for delivery |
| 🟢 Delivered | ✅ | Green | Order completed successfully |
| 🔴 Cancelled | ❌ | Red | Order cancelled |

---

## 📱 What Admin Receives (WhatsApp)

```
🛒 *New Order - #CM12345678*

👤 *Customer Details:*
Name: John Doe
Email: john@student.ac.ke
Phone: 0712345678
Delivery: Hostel Block A, Room 205

📦 *Order Items:*

1. MacBook Pro 13" — 2nd hand, perfect for coding
   Price: KES 45,000 × 1 = KES 45,000
   Category: electronics
   Campus: UoN Main
   Seller: John Kamau
   Seller Phone: 0712345678
   Seller Email: john.kamau@student.uon.ac.ke

2. Casio fx-991ES Plus Scientific Calculator
   Price: KES 1,800 × 2 = KES 3,600
   Category: stationery
   Campus: Kenyatta U.
   Seller: Peter Omondi
   Seller Phone: 0734567890
   Seller Email: p.omondi@ku.ac.ke

💰 *Order Summary:*
Subtotal: KES 48,600
Delivery: KES 100
*Total: KES 48,700*

Please process this order. Thank you!
```

---

## 🔄 Order Processing Flow

### For Customers:
1. Place order → Get order number
2. Track order status in real-time
3. Contact seller if needed (info provided)
4. Receive delivery

### For Admin:
1. Receive WhatsApp notification
2. Contact sellers to prepare items
3. Coordinate delivery
4. Update order status (manually for now)

### For Sellers:
1. Admin contacts you about order
2. Prepare item for delivery
3. Coordinate with admin
4. Item picked up for delivery

---

## 💡 Tips

### For Best Experience:
- ✅ Sign in before shopping
- ✅ Add phone number to profile
- ✅ Provide clear delivery address
- ✅ Keep M-PESA phone ready
- ✅ Check order status regularly

### Delivery Address Examples:
- ✅ "Hostel Block A, Room 205, UoN Main Campus"
- ✅ "Jomo Kenyatta Hall, Room 3B, JKUAT"
- ✅ "Near Gate C, Strathmore University"
- ❌ "Hostel" (too vague)
- ❌ "Room 205" (missing block/campus)

### Phone Number Format:
- ✅ 0712345678
- ✅ 0722345678
- ✅ 0733345678
- ❌ 254712345678 (remove country code)
- ❌ +254712345678 (remove +)

---

## 🆘 Troubleshooting

### Can't see my orders?
- Make sure you're signed in
- Check you're using the same email
- Go to Profile → My Orders

### Order not showing?
- Refresh the page
- Check localStorage is enabled
- Try signing out and back in

### WhatsApp didn't open?
- Check pop-up blocker settings
- Allow pop-ups for the site
- Try clicking "Track Order" instead

### Wrong order status?
- Status updates are manual (admin updates)
- Contact admin via WhatsApp for updates
- Check back later for status changes

---

## 📞 Need Help?

**Admin Contact:**
- WhatsApp: 0108254465
- Email: campusmart.care@gmail.com

**For Order Issues:**
- Track your order first
- Note your order number
- Contact admin with order number
- Provide clear description of issue

---

## 🎯 Quick Links

- **Home**: `/`
- **My Orders**: `/orders`
- **Profile**: `/profile`
- **Cart**: `/cart`
- **Checkout**: `/checkout`

---

*Last Updated: April 29, 2026*
*Version: 1.0*
