"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProductBySlug, type Product } from "@/lib/products";

export type CartLine = {
  slug: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  savings: number;
  addItem: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  detailedLines: Array<{ product: Product; quantity: number; lineTotal: number }>;
};

const STORAGE_KEY = "cart";
const CartContext = createContext<CartContextValue | null>(null);

const readStoredLines = (): CartLine[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry): CartLine[] => {
      if (!entry || typeof entry !== "object") return [];
      const slug = (entry as Record<string, unknown>).slug;
      const quantity = Number((entry as Record<string, unknown>).quantity);
      if (typeof slug !== "string" || !Number.isFinite(quantity)) return [];
      if (!getProductBySlug(slug)) return [];
      const safeQuantity = Math.min(99, Math.max(1, Math.floor(quantity)));
      return [{ slug, quantity: safeQuantity }];
    });
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readStoredLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage unavailable (private mode / quota). Cart stays in memory.
    }
  }, [lines, hydrated]);

  useEffect(() => {
    const onStorage = () => setLines(readStoredLines());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback((slug: string, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    setLines((current) => {
      const existing = current.find((line) => line.slug === slug);
      if (existing) {
        return current.map((line) =>
          line.slug === slug
            ? { ...line, quantity: Math.min(99, line.quantity + safeQuantity) }
            : line
        );
      }
      return [...current, { slug, quantity: Math.min(99, safeQuantity) }];
    });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((current) => {
      if (quantity <= 0) return current.filter((line) => line.slug !== slug);
      const safeQuantity = Math.min(99, Math.floor(quantity));
      if (!current.some((line) => line.slug === slug)) {
        return [...current, { slug, quantity: safeQuantity }];
      }
      return current.map((line) =>
        line.slug === slug ? { ...line, quantity: safeQuantity } : line
      );
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setLines((current) => current.filter((line) => line.slug !== slug));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const detailedLines = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = getProductBySlug(line.slug);
        if (!product) return [];
        return [
          {
            product,
            quantity: line.quantity,
            lineTotal: product.sellingPrice * line.quantity,
          },
        ];
      }),
    [lines]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  );

  const subtotal = useMemo(
    () => detailedLines.reduce((sum, line) => sum + line.lineTotal, 0),
    [detailedLines]
  );

  const savings = useMemo(
    () =>
      detailedLines.reduce(
        (sum, line) =>
          sum + (line.product.mrp - line.product.sellingPrice) * line.quantity,
        0
      ),
    [detailedLines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      itemCount,
      subtotal,
      savings,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      detailedLines,
    }),
    [
      lines,
      hydrated,
      itemCount,
      subtotal,
      savings,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      detailedLines,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return context;
}