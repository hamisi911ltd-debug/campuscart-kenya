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
import pChips from "@/assets/p-chips.jpg";
import pSneakers from "@/assets/p-sneakers.jpg";
import pBed from "@/assets/p-bedsitter.jpg";

export type ProductWithCategory = Product & { category: string; description?: string };

export const categories = [
  { slug: "books", name: "Books", img: catBooks },
  { slug: "electronics", name: "Electronics", img: catElec },
  { slug: "fashion", name: "Fashion", img: catFashion },
  { slug: "food", name: "Food", img: catFood },
  { slug: "hostels", name: "Hostels", img: catRooms },
  { slug: "stationery", name: "Stationery", img: catStat },
  { slug: "furniture", name: "Furniture", img: catFurn },
];

export const products: ProductWithCategory[] = [
  { id: "1", title: 'MacBook Pro 13" — 2nd hand, perfect for coding', price: 45000, oldPrice: 60000, image: pMac, campus: "UoN Main", badge: "HOT", rating: 4.9, sold: 12, category: "electronics", description: "Lightly used MacBook Pro 13\" with charger. Great battery, perfect for CS students. Inspection welcome on campus." },
  { id: "2", title: "Introduction to Algorithms (CLRS) — 4th Ed", price: 2500, oldPrice: 5000, image: pAlgo, campus: "JKUAT", badge: "SALE", rating: 4.8, sold: 47, category: "books", description: "Classic CLRS textbook in great condition. Minimal highlights. Pickup at JKUAT Juja or boda delivery." },
  { id: "3", title: "Casio fx-991ES Plus Scientific Calculator", price: 1800, image: pCalc, campus: "Kenyatta U.", badge: "NEW", rating: 4.7, sold: 89, category: "stationery", description: "Brand new sealed Casio fx-991ES Plus. KUCCPS approved for engineering exams." },
  { id: "4", title: "Nike Air Force 1 — Size 42, lightly used", price: 4500, oldPrice: 8000, image: pSneakers, campus: "Strathmore", badge: "SALE", rating: 4.6, sold: 23, category: "fashion", description: "Authentic AF1 size 42, original box, cleaned and ready to wear." },
  { id: "5", title: "Warm Winter Jacket — perfect for Limuru cold", price: 1200, oldPrice: 2500, image: pJacket, campus: "Daystar", badge: "SALE", rating: 4.5, sold: 8, category: "fashion", description: "Mitumba grade 1 winter jacket. Warm, clean, size M-L." },
  { id: "6", title: "Mini Fridge — ideal for hostel room", price: 8500, image: pFridge, campus: "UoN Main", badge: "NEW", rating: 4.9, sold: 3, category: "electronics", description: "Compact mini fridge, low power, perfect for hostel rooms. 1-year warranty." },
  { id: "7", title: "Chips Mayai Combo — delivered hot to your door", price: 250, image: pChips, campus: "JKUAT Juja", badge: "FREE", rating: 4.8, sold: 156, category: "food", description: "Hot chips mayai + soda. Free delivery within 30 minutes inside campus." },
  { id: "8", title: "Bedsitter near Main Campus, WiFi included", price: 7500, image: pBed, campus: "Kikuyu", badge: "HOT", rating: 4.7, sold: 0, category: "hostels", description: "Self-contained bedsitter, free WiFi & water. 10 min walk to UoN Kikuyu campus. Monthly rent." },
];

export const findProduct = (id: string) => products.find((p) => p.id === id);
export const productsByCategory = (slug: string) =>
  products.filter((p) => p.category === slug);
