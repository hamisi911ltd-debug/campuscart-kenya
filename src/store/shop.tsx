import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Product } from "@/components/ProductCard";

type CartItem = { 
  product: Product & { 
    seller?: {
      name: string;
      email: string;
      phone: string;
      campus: string;
    };
  }; 
  qty: number 
};

interface ShopState {
  cart: CartItem[];
  favorites: string[];
  user: { id?: string; name: string; email: string; phone?: string; picture?: string; campus?: string } | null;
  addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  signIn: (name: string, email: string, phone?: string, picture?: string, campus?: string, id?: string) => void;
  signOut: () => void;
  cartCount: number;
  cartTotal: number;
}

const ShopCtx = createContext<ShopState | null>(null);

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => load("cm:cart", []));
  const [favorites, setFavorites] = useState<string[]>(() => load("cm:favs", []));
  const [user, setUser] = useState<ShopState["user"]>(() => load("cm:user", null));

  useEffect(() => localStorage.setItem("cm:cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("cm:favs", JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem("cm:user", JSON.stringify(user)), [user]);

  const addToCart = useCallback((p: Product, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === p.id);
      if (found) return prev.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { product: p, qty }];
    });
    toast.success("Added to cart", { description: p.title });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const has = prev.includes(id);
      toast(has ? "Removed from favorites" : "Saved to favorites");
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const signIn = useCallback((name: string, email: string, phone?: string, picture?: string, campus?: string, id?: string) => {
    setUser({ id, name, email, phone, picture, campus });
    toast.success(`Karibu, ${name}!`);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    toast("Signed out");
  }, []);

  const value = useMemo<ShopState>(
    () => ({
      cart,
      favorites,
      user,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      toggleFavorite,
      isFavorite,
      signIn,
      signOut,
      cartCount: cart.reduce((n, i) => n + i.qty, 0),
      cartTotal: cart.reduce((n, i) => n + i.qty * i.product.price, 0),
    }),
    [cart, favorites, user, addToCart, removeFromCart, setQty, clearCart, toggleFavorite, isFavorite, signIn, signOut]
  );

  return <ShopCtx.Provider value={value}>{children}</ShopCtx.Provider>;
};

export const useShop = () => {
  const ctx = useContext(ShopCtx);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
};
