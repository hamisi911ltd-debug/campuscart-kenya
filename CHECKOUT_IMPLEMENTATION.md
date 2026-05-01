# Checkout Implementation Guide

## Overview
Complete checkout system with WhatsApp notifications and automatic delivery fee calculation.

## Features Implemented

### 1. Checkout API (`functions/api/checkout.ts`)
- **Endpoint**: `POST /api/checkout`
- **Functionality**:
  - Calculates delivery fees based on order subtotal
  - Creates order in database
  - Creates order items
  - Generates WhatsApp message for admin
  - Returns WhatsApp link to open chat with admin

### 2. Checkout Page (`src/pages/CheckoutPage.tsx`)
- **Route**: `/checkout`
- **Features**:
  - Displays cart items with images
  - Shows price breakdown (subtotal, delivery fee, total)
  - Collects delivery address and phone number
  - Optional notes field
  - Opens WhatsApp to admin after successful order

### 3. Delivery Fee Structure
| Order Subtotal | Delivery Fee |
|---------------|--------------|
| KES 0–100     | KES 40       |
| KES 101–200   | KES 70       |
| KES 201–400   | KES 90       |
| KES 400+      | KES 100      |

### 4. WhatsApp Integration
- **Admin Number**: +254759159881
- **Message Format**:
  ```
  🛒 NEW ORDER - CampusMart
  
  📋 Order ID: [uuid]
  📱 Buyer Phone: [phone]
  📍 Address: [address]
  
  📦 Items:
  1. [product] x[qty] @ KES [price]
  
  💰 Subtotal: KES [amount]
  🚚 Delivery Fee: KES [fee]
  💵 Total: KES [total]
  
  📝 Notes: [optional notes]
  
  ⏰ [timestamp]
  ```

## Database Changes

### Migration Required
Run the migration to add `delivery_fee` column:
```bash
./run-migration.sh migrations/add_delivery_fee_to_orders.sql
```

### Schema Update
- Added `delivery_fee DECIMAL(10, 2) DEFAULT 0` to `orders` table

## Testing Checklist

- [ ] Add items to cart
- [ ] Navigate to `/checkout`
- [ ] Fill in delivery details
- [ ] Submit order
- [ ] Verify order created in database
- [ ] Verify WhatsApp link opens correctly
- [ ] Verify delivery fee calculation
- [ ] Test with different order amounts

## Next Steps

1. **Deploy to Cloudflare Pages**
   ```bash
   git add .
   git commit -m "Add checkout functionality with WhatsApp notifications"
   git push origin main
   ```

2. **Run Migration**
   - Execute `add_delivery_fee_to_orders.sql` on production database

3. **Test End-to-End**
   - Place a test order
   - Verify WhatsApp message received
   - Check order in database

## Files Modified/Created

### Created
- `functions/api/checkout.ts` - Checkout API endpoint
- `src/pages/CheckoutPage.tsx` - Checkout UI
- `migrations/add_delivery_fee_to_orders.sql` - Database migration

### Modified
- `DATABASE_SCHEMA.sql` - Added delivery_fee column
- `src/App.tsx` - Already had checkout route

## Notes

- Cart data is loaded from Zustand store
- User must be logged in to checkout
- WhatsApp opens in new tab after successful order
- Order status defaults to 'pending'
- Admin receives notification via WhatsApp
