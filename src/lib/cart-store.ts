import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  name: string;
  slug: string;
  price_inr: number;
  image?: string;
  quantity: number;
};

export function cartKey(i: { productId: string; variantId?: string | null }) {
  return `${i.productId}::${i.variantId ?? ""}`;
}

type CartState = {
  items: CartItem[];
  couponCode: string | null;
  setCoupon: (code: string | null) => void;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      setCoupon: (code) => set({ couponCode: code ? code.trim().toUpperCase() : null }),
      add: (item, qty = 1) =>
        set((s) => {
          const k = cartKey(item);
          const existing = s.items.find((i) => cartKey(i) === k);
          if (existing) {
            return {
              items: s.items.map((i) =>
                cartKey(i) === k ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => cartKey(i) !== key) })),
      setQty: (key, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (cartKey(i) === key ? { ...i, quantity: Math.max(1, qty) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [], couponCode: null }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.quantity * i.price_inr, 0),
    }),
    { name: "sakhi-suta-cart" },
  ),
);
