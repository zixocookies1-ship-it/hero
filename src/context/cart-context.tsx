"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
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

const EMPTY: CartLine[] = [];

const parseStoredLines = (raw: string | null): CartLine[] => {
  try {
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

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
    return EMPTY;
  }
};

/**
 * useSyncExternalStore requires a referentially stable snapshot, so the parsed
 * result is cached against the exact raw string. Same storage contents must
 * return the same array instance or React would re-render in a loop.
 */
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;
let cachePrimed = false;

const readStoredLines = (): CartLine[] => {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }

  if (cachePrimed && raw === cachedRaw) return cachedLines;

  cachedRaw = raw;
  cachedLines = parseStoredLines(raw);
  cachePrimed = true;
  return cachedLines;
};

/**
 * localStorage is treated as the source of truth and read through
 * useSyncExternalStore, so the first client render already matches storage and no
 * effect is needed to "hydrate" the cart. Every mutation writes straight to
 * storage, which also keeps multiple tabs in sync.
 */
const listeners = new Set<() => void>();

/**
 * The native "storage" event only fires in *other* tabs, so local mutations
 * notify subscribers directly while cross-tab writes still arrive via the event.
 */
const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  const onStorage = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
};

const getSnapshot = (): CartLine[] => readStoredLines();
const getServerSnapshot = (): CartLine[] => EMPTY;

const writeLines = (next: CartLine[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode / quota). Cart stays in memory only.
  }
  // Force the snapshot cache to re-parse the new raw string, then notify.
  cachePrimed = false;
  for (const listener of listeners) listener();
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Server-rendered markup shows an empty cart placeholder; the first client
  // render already reads storage, so `hydrated` is simply "am I on the client".
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const addItem = useCallback((slug: string, quantity = 1) => {
    if (!getProductBySlug(slug)) return;
    const safeQuantity = Math.max(1, Math.floor(quantity));
    writeLines(
      readStoredLines().flatMap((line) => {
        if (line.slug !== slug) return [line];
        return [{ ...line, quantity: Math.min(99, line.quantity + safeQuantity) }];
      })
    );
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    if (!getProductBySlug(slug)) return;
    if (quantity <= 0) {
      writeLines(readStoredLines().filter((line) => line.slug !== slug));
      return;
    }
    const safeQuantity = Math.min(99, Math.floor(quantity));
    const current = readStoredLines();
    if (current.some((line) => line.slug === slug)) {
      writeLines(
        current.map((line) =>
          line.slug === slug ? { ...line, quantity: safeQuantity } : line
        )
      );
      return;
    }
    writeLines([...current, { slug, quantity: safeQuantity }]);
  }, []);

  const removeItem = useCallback((slug: string) => {
    writeLines(readStoredLines().filter((line) => line.slug !== slug));
  }, []);

  const clearCart = useCallback(() => writeLines([]), []);

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