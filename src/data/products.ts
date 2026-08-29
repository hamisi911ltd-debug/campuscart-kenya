import type { Product } from "@/components/ProductCard";

// Category illustrations: free-license stock photos from pexels.com (no
// attribution required for commercial use), shown as a fallback wherever a
// category has no real product photo yet — see getCategoryImages() below,
// which prefers an actual in-stock item's photo over these when one exists.
import catPhones from "@/assets/cat-phones.jpg";
import catElec from "@/assets/cat-electronics.jpg";
import catComputing from "@/assets/cat-computing.jpg";
import catAppliances from "@/assets/cat-appliances.jpg";
import catFashion from "@/assets/cat-fashion.jpg";
import catHome from "@/assets/cat-home.jpg";
import catBeauty from "@/assets/cat-beauty.jpg";
import catBaby from "@/assets/cat-baby.jpg";
import catGaming from "@/assets/cat-gaming.jpg";
import catWatches from "@/assets/cat-watches.jpg";

export type ProductWithCategory = Product & { 
  category: string; 
  description?: string;
  images?: string[];
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

// Matches the top-level categories shared by Jumia Kenya and Kilimall Kenya
// (Phones, Electronics/TVs, Computing, Appliances, Fashion, Home & Kitchen,
// Health & Beauty, Baby/Kids, Gaming, Watches & Jewellery) rather than the
// earlier campus-marketplace-specific set (Food, Property, Books,
// Stationery). Automotive was dropped per request.
export const categories = [
  { slug: "phones", name: "Phones & Accessories", img: catPhones },
  { slug: "electronics", name: "Electronics", img: catElec },
  { slug: "computing", name: "Computing", img: catComputing },
  { slug: "appliances", name: "Appliances", img: catAppliances },
  { slug: "fashion", name: "Fashion", img: catFashion },
  { slug: "home", name: "Home & Kitchen", img: catHome },
  { slug: "beauty", name: "Health & Beauty", img: catBeauty },
  { slug: "baby", name: "Baby & Kids", img: catBaby },
  { slug: "gaming", name: "Gaming", img: catGaming },
  { slug: "watches", name: "Watches & Jewellery", img: catWatches },
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
    images,
    totalReviews: dbProduct.reviews_count || 0,
  };
};

export interface GetProductsParams {
  category?: string;
  sort?: "newest" | "trending" | "price_low" | "price_high" | "rating";
  search?: string;
  limit?: number;
  offset?: number;
}

// Function to get products from the database API. Filtering/sorting is done
// server-side (via query params) rather than fetching everything and
// filtering client-side, both for performance and because the API's default
// limit (50) would otherwise silently hide products past the first page.
export const getProducts = async (params: GetProductsParams = {}): Promise<ProductWithCategory[]> => {
  if (typeof window === "undefined") return [];

  try {
    const query = new URLSearchParams();
    if (params.category) query.set("category", params.category);
    if (params.sort) query.set("sort", params.sort);
    if (params.search) query.set("search", params.search);
    query.set("limit", String(params.limit ?? 50));
    if (params.offset) query.set("offset", String(params.offset));

    const response = await fetch(`/api/products?${query.toString()}`, {
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

// Export empty array for static products (no longer used)
export const getStaticProducts = (): ProductWithCategory[] => {
  return [];
};

// Export products as empty array initially
export const products: ProductWithCategory[] = [];

// Refresh products
export const refreshProducts = () => {
  return getProductsSync();
};

// Fetches a single product directly by id (GET /api/products/:id) instead of
// pulling the whole catalog and searching client-side — the previous
// implementation meant a product ranked past the default page size couldn't
// be found at all, so any direct/shared link to it would 404.
export const findProduct = async (id: string): Promise<ProductWithCategory | undefined> => {
  if (typeof window === "undefined" || !id) return undefined;

  try {
    const response = await fetch(`/api/products/${id}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) return undefined;
    const dbProduct = await response.json();
    if (!dbProduct || dbProduct.error) return undefined;
    return transformDatabaseProduct(dbProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return undefined;
  }
};

export const DEFAULT_PAGE_SIZE = 24;

export interface PagedResult {
  items: ProductWithCategory[];
  hasMore: boolean;
}

// Fetches one page at a time (rather than a large flat list) so a listing
// can show "Next"/"Previous" instead of one long scrolling grid. Requests
// pageSize+1 items and trims the extra one — if it came back, there's a
// next page — since the API doesn't return a total count to compare against.
export const getProductsPage = async (
  params: Omit<GetProductsParams, "limit" | "offset">,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PagedResult> => {
  const offset = (page - 1) * pageSize;
  const items = await getProducts({ ...params, limit: pageSize + 1, offset });
  return { items: items.slice(0, pageSize), hasMore: items.length > pageSize };
};

export const productsByCategory = async (
  slug: string,
  sort: GetProductsParams["sort"] | undefined,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PagedResult> => {
  return getProductsPage({ category: slug, sort }, page, pageSize);
};

// Real photo of an actual in-stock item per category (the newest product in
// that category), for use in place of the generic stock-photo illustrations
// in `categories[].img`. A category with no products yet has no entry here —
// callers should fall back to the static illustration in that case.
export const getCategoryImages = async (): Promise<Record<string, string>> => {
  const all = await getProducts({ limit: 1000 });
  const images: Record<string, string> = {};
  for (const p of all) {
    if (!images[p.category] && p.image && p.image !== "/placeholder.svg") {
      images[p.category] = p.image;
    }
  }
  return images;
};
