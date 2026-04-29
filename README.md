# 🛍️ CampusMart Kenya - Student Marketplace Platform

A modern, full-featured e-commerce platform designed specifically for Kenyan university students. Buy and sell products, track orders, and connect with fellow students on campus.

## ✨ Features

### 🛒 E-Commerce
- Product browsing by category
- Advanced search functionality
- Shopping cart with quantity management
- Favorites/wishlist
- Product reviews and ratings (4.5-4.9★)
- Real-time inventory tracking

### 📱 Progressive Web App (PWA)
- Installable on all devices (iOS, Android, Desktop)
- Works offline with service worker
- Push notifications support
- Fast loading with caching
- Native app experience

### 📍 Location-Based Features
- Live GPS location capture for checkout
- Google Maps integration
- Seller location display on products
- Accurate delivery coordination

### 👤 User Features
- Sign up / Sign in with email
- User profiles with order history
- Order tracking (5 statuses)
- Favorites management
- Settings (notifications, dark mode, language)
- Change password functionality

### 🎨 Modern UI/UX
- Dark mode support
- Responsive design (mobile-first)
- Smooth animations
- Intuitive navigation
- Theme colors: Navy Blue (#1e3a8a) & Green (#7CB342)

### 🔐 Admin Dashboard
- Secure admin login
- User management
- Product management
- Order management
- Advertisement management
- Analytics dashboard

### 💬 Communication
- WhatsApp integration for orders
- Direct seller contact
- Order notifications
- Email notifications

### ⭐ Reviews & Ratings
- Customer reviews with star ratings
- Verified purchase badges
- Rating distribution charts
- Write review functionality

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Maps**: Google Maps API
- **PWA**: Service Worker + Web Manifest

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/campuscart-kenya.git
cd campuscart-kenya

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

### Cloudflare Pages (Recommended)

1. Push code to GitHub
2. Connect repository to Cloudflare Pages
3. Configure build settings:
   - Build command: `npm run build`
   - Build output: `dist`
4. Deploy!

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed instructions.

## 🔑 Admin Access

- **URL**: `/admin/login`
- **Credentials**: Set via environment variables (see `.env.example`)
- **Setup**: Copy `.env.example` to `.env.local` and set `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`

## 📱 PWA Installation

### iOS (iPhone/iPad)
1. Open in Safari
2. Tap Share (⎙)
3. Tap "Add to Home Screen"
4. Tap "Add"

### Android
1. Open in Chrome
2. Tap install prompt or menu → "Install app"
3. Confirm installation

### Desktop
1. Open in Chrome/Edge
2. Click install icon (⊕) in address bar
3. Click "Install"

## 📞 Contact & Support

- **Email**: campusmart.care@gmail.com
- **WhatsApp**: 0108254465 (254108254465 international)
- **Admin**: campusmart.care@gmail.com

## 📄 License

This project is proprietary software. All rights reserved.

---

**Made with ❤️ for Kenyan Students**

🎓 CampusMart - Your Campus Marketplace
