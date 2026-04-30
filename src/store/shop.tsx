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
  addToCart: (p: Product, qty?: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  setQty: (id: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  signIn: (name: string, email: string, phone?: string, picture?: string, campus?: string, id?: string) => void;
  signOut: () => void;
  cartCount: number;
  cartTotal: number;
  loadUserData: () => Promise<void>;
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

  // Load user data from database when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load cart from database
      const cartResponse = await fetch(`/api/cart?user_id=${user.id}`);
      if (cartResponse.ok) {
        const cartItems = await cartResponse.json();
        const dbCart: CartItem[] = cartItems.map((item: any) => ({
          product: {
            id: item.product_id,
            title: item.title,
            price: item.price,
            image: item.image_url,
            campus: item.location || "",
            seller_id: item.seller_id
          },
          qty: item.quantity
        }));
        setCart(dbCart);
      }

      // Load favorites from database
      const favResponse = await fetch(`/api/favorites?user_id=${user.id}`);
      if (favResponse.ok) {
        const favItems = await favResponse.json();
        const dbFavorites = favItems.map((item: any) => item.product_id);
        setFavorites(dbFavorites);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Keep localStorage data as fallback
    }
  }, [user?.id]);

  const addToCart = useCallback(async (p: Product, qty = 1) => {
    if (user?.id) {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            product_id: p.id,
            quantity: qty
          })
        });

        if (response.ok) {
          await loadUserData(); // Reload from database
          toast.success("Added to cart", { description: p.title });
          return;
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }

    // Fallback to localStorage
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === p.id);
      if (found) return prev.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { product: p, qty }];
    });
    toast.success("Added to cart", { description: p.title });
  }, [user?.id, loadUserData]);

  const removeFromCart = useCallback(async (id: string) => {
    if (user?.id) {
      try {
        const response = await fetch(`/api/cart?user_id=${user.id}&product_id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await loadUserData(); // Reload from database
          return;
        }
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    }

    // Fallback to localStorage
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, [user?.id, loadUserData]);

  const setQty = useCallback(async (id: string, qty: number) => {
    if (user?.id) {
      // For now, remove and re-add with new quantity
      // TODO: Implement PATCH endpoint for updating quantity
      await removeFromCart(id);
      const product = cart.find(item => item.product.id === id)?.product;
      if (product && qty > 0) {
        await addToCart(product, qty);
      }
      return;
    }

    // Fallback to localStorage
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  }, [user?.id, cart, removeFromCart, addToCart]);

  const clearCart = useCallback(async () => {
    if (user?.id) {
      // Clear all cart items for user
      for (const item of cart) {
        await removeFromCart(item.product.id);
      }
      return;
    }

    // Fallback to localStorage
    setCart([]);
  }, [user?.id, cart, removeFromCart]);

  const toggleFavorite = useCallback(async (id: string) => {
    const isCurrentlyFavorite = favorites.includes(id);

    if (user?.id) {
      try {
        if (isCurrentlyFavorite) {
          const response = await fetch(`/api/favorites?user_id=${user.id}&product_id=${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            await loadUserData(); // Reload from database
            toast("Removed from favorites");
            return;
          }
        } else {
          const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              product_id: id
            })
          });
          if (response.ok) {
            await loadUserData(); // Reload from database
            toast("Saved to favorites");
            return;
          }
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }

    // Fallback to localStorage
    setFavorites((prev) => {
      const has = prev.includes(id);
      toast(has ? "Removed from favorites" : "Saved to favorites");
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, [user?.id, favorites, loadUserData]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const signIn = useCallback((name: string, email: string, phone?: string, picture?: string, campus?: string, id?: string) => {
    setUser({ id, name, email, phone, picture, campus });
    toast.success(`Karibu, ${name}!`);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setCart([]); // Clear cart on sign out
    setFavorites([]); // Clear favorites on sign out
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
      loadUserData,
    }),
    [cart, favorites, user, addToCart, removeFromCart, setQty, clearCart, toggleFavorite, isFavorite, signIn, signOut, loadUserData]
  );

  return <ShopCtx.Provider value={value}>{children}</ShopCtx.Provider>;
};

export const useShop = () => {
  const ctx = useContext(ShopCtx);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
};
