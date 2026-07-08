import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { trackAddToCart, trackRemoveFromCart } from "@wse/core/lib/analytics/track";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  variantLabel?: string;
  selectedAttributes?: Record<string, string>;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  netPrice: number;
  discount: number;
  /** Product VAT % snapshot for checkout breakdowns. */
  vatPercent?: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalNetPrice: number;
  /** False until localStorage has been read on the client. */
  _hasHydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  replaceItems: (items: CartItem[]) => void;
  clearCart: () => void;
}

const calculateTotals = (items: CartItem[]) => {
  return {
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    totalPrice: items.reduce((total, item) => total + item.price * item.quantity, 0),
    totalNetPrice: items.reduce((total, item) => total + item.netPrice * item.quantity, 0),
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      totalNetPrice: 0,
      _hasHydrated: false,

      addItem: (newItem: CartItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item: CartItem) => item.id === newItem.id);

        let newItems: CartItem[];
        let quantityAdded = newItem.quantity;
        if (existingItem) {
          const newQuantity = existingItem.quantity + newItem.quantity;
          const clampedQuantity = Number.isFinite(newItem.stock)
            ? Math.min(newQuantity, newItem.stock)
            : newQuantity;
          quantityAdded = Math.max(0, clampedQuantity - existingItem.quantity);
          newItems = currentItems.map((item: CartItem) =>
            item.id === newItem.id
              ? { ...item, quantity: clampedQuantity }
              : item
          );
        } else {
          newItems = [...currentItems, newItem];
        }

        set({ items: newItems, ...calculateTotals(newItems) });
        if (quantityAdded > 0) {
          const line = newItems.find((item) => item.id === newItem.id);
          if (line) trackAddToCart(line, quantityAdded);
        }
      },

      removeItem: (lineId: string) => {
        const removed = get().items.find((item: CartItem) => item.id === lineId);
        const newItems = get().items.filter((item: CartItem) => item.id !== lineId);
        set({ items: newItems, ...calculateTotals(newItems) });
        if (removed) trackRemoveFromCart(removed);
      },

      updateQuantity: (lineId: string, quantity: number) => {
        const items = get().items;
        const item = items.find((i: CartItem) => i.id === lineId);
        if (!item) return;

        const maxQuantity = Number.isFinite(item.stock) ? item.stock : quantity;
        const newQuantity = Math.max(1, Math.min(quantity, maxQuantity));
        const newItems = items.map((i: CartItem) =>
          i.id === lineId ? { ...i, quantity: newQuantity } : i
        );

        set({ items: newItems, ...calculateTotals(newItems) });
      },

      replaceItems: (items: CartItem[]) => {
        set({ items, ...calculateTotals(items) });
      },

      clearCart: () =>
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalNetPrice: 0,
        }),
    }),
    {
      name: "krausz-cart-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
        totalNetPrice: state.totalNetPrice,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Cart storage rehydration failed:", error);
        }
        useCartStore.setState({ _hasHydrated: true });
      },
    }
  )
);
