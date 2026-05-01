import type { Product } from "@/components/ProductCard";

import catBooks from "@/assets/cat-books.jpg";
import catElec from "@/assets/cat-electronics.jpg";
import catFashion from "@/assets/cat-fashion.jpg";
import catFood from "@/assets/cat-food.jpg";
import catRooms from "@/assets/cat-rooms.jpg";
import catStat from "@/assets/cat-stationery.jpg";
import catFurn from "@/assets/cat-furniture.jpg";

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

// Function to transform database product to frontend format
export const transformDatabaseProduct = (dbProduct: any): ProductWithCategory => {
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
    oldPrice: dbProduct.original_price ? parseFloat(dbProduct.original_price) : undefined,
    image: primaryImage,
    campus: dbProduct.location || 'Unknown',
    rating: parseFloat(dbProduct.rating) || 0,
    sold: dbProduct.reviews_count || 0,
    category: dbProduct.category,
    description: dbProduct.description,
    totalReviews: dbProduct.reviews_count || 0,
  };
};

// Function to get all products from database API
export const getProducts = async (): Promise<ProductWithCategory[]> => {
  if (typeof window === "undefined") return [];
  
  try {
    const response = await fetch('/api/products', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (response.ok) {
      const dbProducts = await response.json();
      if (Array.isArray(dbProducts)) {
        return dbProducts.map(transformDatabaseProduct);
      } else {
        console.error('API returned non-array:', dbProducts);
        return [];
      }
    } else {
      console.error('API error:', response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.error('Error fetching products from API:', error);
    return [];
  }
};

// Synchronous version for initial load (returns empty array)
export const getProductsSync = (): ProductWithCategory[] => {
  return [];
};

// Export empty array for advertisement slides
export const getStaticProducts = (): ProductWithCategory[] => {
  return [];
};

// Export products as empty array initially
export const products: ProductWithCategory[] = [];

// Refresh products
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
