import type { Product } from "@/components/ProductCard";

import catBooks from "@/assets/cat-books.jpg";
import catElec from "@/assets/cat-electronics.jpg";
import catFashion from "@/assets/cat-fashion.jpg";
import catFood from "@/assets/cat-food.jpg";
import catRooms from "@/assets/cat-rooms.jpg";
import catStat from "@/assets/cat-stationery.jpg";
import catFurn from "@/assets/cat-furniture.jpg";

import pMac from "@/assets/p-macbook.jpg";
import pAlgo from "@/assets/p-algo.jpg";
import pJacket from "@/assets/p-jacket.jpg";
import pCalc from "@/assets/p-calc.jpg";
import pFridge from "@/assets/p-fridge.jpg";
import pFridge2 from "@/assets/fridge-p2.jpeg";
import pChips from "@/assets/p-chips-chicken.jpg";
import pSneakers from "@/assets/p-sneakers.jpg";
import pBed from "@/assets/p-bedsitter.jpg";
import pWoofer from "@/assets/p-woofer.jpg";

export type ProductWithCategory = Product & { 
  category: string; 
  description?: string;
  seller?: {
    name: string;
    email: string;
    phone: string;
    campus: string;
  };
  reviews?: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
    verified: boolean;
  }[];
  totalReviews?: number;
};

export const categories = [
  { slug: "books", name: "Books", img: catBooks },
  { slug: "electronics", name: "Electronics", img: catElec },
  { slug: "fashion", name: "Fashion", img: catFashion },
  { slug: "food", name: "Food", img: catFood },
  { slug: "hostels", name: "Hostels", img: catRooms },
  { slug: "stationery", name: "Stationery", img: catStat },
  { slug: "furniture", name: "Furniture", img: catFurn },
];

// Static products (default data)
const staticProducts: ProductWithCategory[] = [
  { 
    id: "1", 
    title: 'MacBook Pro 13" — 2nd hand, perfect for coding', 
    price: 45000, 
    oldPrice: 60000, 
    image: pMac, 
    campus: "UoN Main", 
    badge: "HOT", 
    rating: 4.9, 
    sold: 12,
    totalReviews: 12,
    category: "electronics", 
    description: "Lightly used MacBook Pro 13\" with charger. Great battery, perfect for CS students. Inspection welcome on campus.",
    seller: {
      name: "John Kamau",
      email: "john.kamau@student.uon.ac.ke",
      phone: "0712345678",
      campus: "UoN Main"
    },
    reviews: [
      { id: "r1", userName: "Alice M.", rating: 5, comment: "Perfect condition! Battery lasts 6+ hours. Seller was very helpful.", date: "2026-04-20", verified: true },
      { id: "r2", userName: "Brian K.", rating: 5, comment: "Great deal for a MacBook. Works perfectly for my programming classes.", date: "2026-04-18", verified: true },
      { id: "r3", userName: "Carol N.", rating: 4, comment: "Good laptop but has minor scratches. Still worth the price!", date: "2026-04-15", verified: true }
    ]
  },
  { 
    id: "2", 
    title: "Introduction to Algorithms (CLRS) — 4th Ed", 
    price: 2500, 
    oldPrice: 5000, 
    image: pAlgo, 
    campus: "JKUAT", 
    badge: "SALE", 
    rating: 4.8, 
    sold: 47,
    totalReviews: 47,
    category: "books", 
    description: "Classic CLRS textbook in great condition. Minimal highlights. Pickup at JKUAT Juja or boda delivery.",
    seller: {
      name: "Mary Wanjiru",
      email: "mary.w@jkuat.ac.ke",
      phone: "0723456789",
      campus: "JKUAT"
    },
    reviews: [
      { id: "r4", userName: "David O.", rating: 5, comment: "Book is in excellent condition. Saved me so much money!", date: "2026-04-22", verified: true },
      { id: "r5", userName: "Emma W.", rating: 5, comment: "Fast delivery to my hostel. Book looks almost new.", date: "2026-04-19", verified: true },
      { id: "r6", userName: "Frank M.", rating: 4, comment: "Good book, some highlights but doesn't bother me.", date: "2026-04-16", verified: true }
    ]
  },
  { 
    id: "3", 
    title: "Casio fx-991ES Plus Scientific Calculator", 
    price: 1800, 
    image: pCalc, 
    campus: "Kenyatta U.", 
    badge: "NEW", 
    rating: 4.7, 
    sold: 89,
    totalReviews: 89,
    category: "stationery", 
    description: "Brand new sealed Casio fx-991ES Plus. KUCCPS approved for engineering exams.",
    seller: {
      name: "Peter Omondi",
      email: "p.omondi@ku.ac.ke",
      phone: "0734567890",
      campus: "Kenyatta U."
    },
    reviews: [
      { id: "r7", userName: "Grace A.", rating: 5, comment: "Brand new and sealed! Cheaper than bookshop.", date: "2026-04-23", verified: true },
      { id: "r8", userName: "Henry K.", rating: 5, comment: "Perfect for my engineering exams. Fast delivery!", date: "2026-04-21", verified: true },
      { id: "r9", userName: "Ivy N.", rating: 4, comment: "Good calculator, works well. Slightly cheaper elsewhere but still good.", date: "2026-04-17", verified: true }
    ]
  },
  { 
    id: "4", 
    title: "Nike Air Force 1 — Size 42, lightly used", 
    price: 4500, 
    oldPrice: 8000, 
    image: pSneakers, 
    campus: "Strathmore", 
    badge: "SALE", 
    rating: 4.6, 
    sold: 23,
    totalReviews: 23,
    category: "fashion", 
    description: "Authentic AF1 size 42, original box, cleaned and ready to wear.",
    seller: {
      name: "David Mwangi",
      email: "dmwangi@strathmore.edu",
      phone: "0745678901",
      campus: "Strathmore"
    },
    reviews: [
      { id: "r10", userName: "John D.", rating: 5, comment: "Authentic AF1! Fits perfectly. Great condition.", date: "2026-04-24", verified: true },
      { id: "r11", userName: "Kate M.", rating: 4, comment: "Nice shoes, minor creasing but expected for used. Good deal!", date: "2026-04-20", verified: true },
      { id: "r12", userName: "Leo P.", rating: 5, comment: "Seller was honest about condition. Very happy with purchase!", date: "2026-04-18", verified: true }
    ]
  },
  { 
    id: "5", 
    title: "Warm Winter Jacket — perfect for Limuru cold", 
    price: 1200, 
    oldPrice: 2500, 
    image: pJacket, 
    campus: "Daystar", 
    badge: "SALE", 
    rating: 4.5, 
    sold: 8,
    totalReviews: 8,
    category: "fashion", 
    description: "Mitumba grade 1 winter jacket. Warm, clean, size M-L.",
    seller: {
      name: "Grace Akinyi",
      email: "grace.a@daystar.ac.ke",
      phone: "0756789012",
      campus: "Daystar"
    },
    reviews: [
      { id: "r13", userName: "Mary K.", rating: 5, comment: "So warm! Perfect for Limuru weather. Clean and smells fresh.", date: "2026-04-22", verified: true },
      { id: "r14", userName: "Nick O.", rating: 4, comment: "Good jacket, fits well. Slight wear but still great value.", date: "2026-04-19", verified: true },
      { id: "r15", userName: "Olive W.", rating: 4, comment: "Keeps me warm during morning classes. Happy with it!", date: "2026-04-16", verified: true }
    ]
  },
  { 
    id: "6", 
    title: "Mini Fridge — ideal for hostel room", 
    price: 8500, 
    image: pFridge2, 
    campus: "UoN Main", 
    badge: "NEW", 
    rating: 4.9, 
    sold: 3,
    totalReviews: 3,
    category: "electronics", 
    description: "Compact mini fridge, low power, perfect for hostel rooms. 1-year warranty.",
    seller: {
      name: "James Otieno",
      email: "j.otieno@student.uon.ac.ke",
      phone: "0767890123",
      campus: "UoN Main"
    },
    reviews: [
      { id: "r16", userName: "Paul M.", rating: 5, comment: "Perfect size for my hostel room! Quiet and efficient.", date: "2026-04-25", verified: true },
      { id: "r17", userName: "Queen N.", rating: 5, comment: "Keeps drinks cold all day. Low power consumption. Love it!", date: "2026-04-23", verified: true },
      { id: "r18", userName: "Robert K.", rating: 4, comment: "Good fridge, works well. Delivery was quick.", date: "2026-04-21", verified: true }
    ]
  },
  { 
    id: "7", 
    title: "Chips & Chicken Combo — delivered hot to your door", 
    price: 350, 
    image: pChips, 
    campus: "JKUAT Juja", 
    badge: "FREE", 
    rating: 4.8, 
    sold: 156,
    totalReviews: 156,
    category: "food", 
    description: "Hot chips & chicken + soda. Free delivery within 30 minutes inside campus.",
    seller: {
      name: "Sarah Njeri",
      email: "sarah.njeri@jkuat.ac.ke",
      phone: "0778901234",
      campus: "JKUAT Juja"
    },
    reviews: [
      { id: "r19", userName: "Sam W.", rating: 5, comment: "Always hot and fresh! Best chips on campus.", date: "2026-04-26", verified: true },
      { id: "r20", userName: "Tina M.", rating: 5, comment: "Delivered in 20 minutes. Chicken is well seasoned!", date: "2026-04-25", verified: true },
      { id: "r21", userName: "Victor O.", rating: 4, comment: "Good portion size. Sometimes takes longer during peak hours.", date: "2026-04-24", verified: true }
    ]
  },
  { 
    id: "8", 
    title: "Bedsitter near Main Campus, WiFi included", 
    price: 7500, 
    image: pBed, 
    campus: "Kikuyu", 
    badge: "HOT", 
    rating: 4.7, 
    sold: 0,
    totalReviews: 5,
    category: "hostels", 
    description: "Self-contained bedsitter, free WiFi & water. 10 min walk to UoN Kikuyu campus. Monthly rent.",
    seller: {
      name: "Michael Kariuki",
      email: "m.kariuki@gmail.com",
      phone: "0789012345",
      campus: "Kikuyu"
    },
    reviews: [
      { id: "r22", userName: "Ann K.", rating: 5, comment: "Clean room, fast WiFi, great landlord. Highly recommend!", date: "2026-04-20", verified: true },
      { id: "r23", userName: "Ben M.", rating: 5, comment: "Perfect location near campus. Water never runs out.", date: "2026-04-15", verified: true },
      { id: "r24", userName: "Cynthia N.", rating: 4, comment: "Good room, WiFi is reliable. Slightly noisy on weekends.", date: "2026-04-10", verified: true }
    ]
  },
  { 
    id: "9", 
    title: "Bluetooth Woofer — powerful bass for parties", 
    price: 6500, 
    image: pWoofer, 
    campus: "Strathmore", 
    badge: "HOT", 
    rating: 4.8, 
    sold: 15,
    totalReviews: 15,
    category: "electronics", 
    description: "Portable Bluetooth woofer with deep bass. Perfect for hostel parties and events.",
    seller: {
      name: "Brian Kipchoge",
      email: "b.kipchoge@strathmore.edu",
      phone: "0790123456",
      campus: "Strathmore"
    },
    reviews: [
      { id: "r25", userName: "Dan K.", rating: 5, comment: "Amazing bass! Battery lasts 8+ hours. Party beast!", date: "2026-04-27", verified: true },
      { id: "r26", userName: "Eve W.", rating: 5, comment: "Loud and clear sound. Bluetooth connects instantly.", date: "2026-04-24", verified: true },
      { id: "r27", userName: "Fred M.", rating: 4, comment: "Great woofer for the price. Slightly heavy but worth it.", date: "2026-04-22", verified: true }
    ]
  },
];

// Function to transform database product to frontend format
const transformDatabaseProduct = (dbProduct: any): ProductWithCategory => {
  // Parse images JSON string safely
  let images: string[] = [];
  try {
    if (typeof dbProduct.images === 'string') {
      images = JSON.parse(dbProduct.images);
    } else if (Array.isArray(dbProduct.images)) {
      images = dbProduct.images;
    }
  } catch (error) {
    console.error('Error parsing product images:', error);
    images = [];
  }

  // Use image_url as primary image, fallback to first image in array
  const primaryImage = dbProduct.image_url || images[0] || '/placeholder.svg';

  return {
    id: dbProduct.id,
    title: dbProduct.title,
    price: parseFloat(dbProduct.price),
    image: primaryImage, // Map image_url to image field
    campus: dbProduct.location || 'Unknown',
    rating: parseFloat(dbProduct.rating) || 0,
    sold: 0, // Not tracked in database yet
    category: dbProduct.category,
    description: dbProduct.description,
    totalReviews: dbProduct.reviews_count || 0,
  };
};

// Function to get all products including custom ones from database API
export const getProducts = async (): Promise<ProductWithCategory[]> => {
  if (typeof window === "undefined") return staticProducts;
  
  // ALWAYS fetch from D1 database via API (both production and development)
  try {
    const response = await fetch('/api/products', {
      headers: {
        'Cache-Control': 'no-cache',  // Always get fresh data
      },
    });
    if (response.ok) {
      const dbProducts = await response.json();
      // Ensure dbProducts is an array
      if (Array.isArray(dbProducts)) {
        // Transform database products to frontend format
        const transformedProducts = dbProducts.map(transformDatabaseProduct);
        // Combine with static products
        return [...transformedProducts, ...staticProducts];
      } else {
        console.error('API returned non-array:', dbProducts);
        return staticProducts;
      }
    } else {
      console.error('API error:', response.status, response.statusText);
      return staticProducts;
    }
  } catch (error) {
    console.error('Error fetching products from API:', error);
    return staticProducts;
  }
};

// Synchronous version for initial load (returns static products immediately)
export const getProductsSync = (): ProductWithCategory[] => {
  if (typeof window === "undefined") return staticProducts;
  
  try {
    const custom = localStorage.getItem("campusmart_products");
    if (!custom) return staticProducts;
    
    const parsedCustom = JSON.parse(custom) as ProductWithCategory[];
    return [...parsedCustom, ...staticProducts];
  } catch (e) {
    console.error("Error loading custom products:", e);
    return staticProducts;
  }
};

// Export static products for advertisement slides (never changes)
export const getStaticProducts = (): ProductWithCategory[] => {
  return staticProducts;
};

// Export products as a getter function instead of constant
export const products = getProductsSync();

// Refresh products - call this after adding new products
export const refreshProducts = () => {
  return getProductsSync();
};

export const findProduct = async (id: string) => {
  const allProducts = await getProducts();
  return allProducts.find((p) => p.id === id);
};

export const productsByCategory = async (slug: string) => {
  const allProducts = await getProducts();
  return allProducts.filter((p) => p.category === slug);
};
