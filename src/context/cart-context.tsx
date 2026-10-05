"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { getProductBySlug } from "@/lib/products";
import {
  addLine,
  clearLines,
  detailedLines as detailLines,
  itemCount as countLines,
  parseStoredLines,
  quantityOfLine,
  removeLine,
  savings as totalSavings,
  setLineQuantity,
  subtotal as sumLines,
  type CartDetail,
  type CartLine,
} from "@/lib/cart";

export type { CartLine } from "@/lib/cart";
export { MAX_QUANTITY } from "@/lib/cart";

export type AddResult =
  | { ok: true; quantity: number }
  | { ok: false; error: string };

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  savings: number;
  addItem: (slug: string, quantity?: number) => AddResult;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  quantityOf: (slug: string) => number;
  detailedLines: CartDetail[];
};

/**
 * localStorage is the single source of truth for this project's guest cart. The
 * one provider in the app root layout makes header, product cards, cart page,
 * checkout and buy-now all read the same state.
 */
const STORAGE_KEY = "cart";
const CartContext = createContext<CartContextValue | null>(null);

const EMPTY: CartLine[] = [];

/**
 * useSyncExternalStore requires a referentially stable snapshot, so the parsed
 * result is cached against the exact raw string. Identical storage contents must
 * return the same array instance or React re-renders in a loop.
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

const listeners = new Set<() => void>();

/**
 * The native "storage" event only fires in *other* tabs, so local mutations
 * notify subscribers directly while cross-tab writes arrive via the event.
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
// The server cannot read localStorage; it renders the empty-cart placeholder and
// the first client render picks up the real cart.
const getServerSnapshot = (): CartLine[] => EMPTY;

const writeLines = (next: CartLine[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode / quota): the cart stays in memory only.
  }
  // Invalidate the snapshot cache, then notify so every consumer re-reads.
  cachePrimed = false;
  for (const listener of listeners) listener();
};

/**
 * Every mutation funnels through here. The reducer receives the lines currently
 * persisted, which is the storage equivalent of a functional state update: two
 * clicks in one tick cannot both act on a stale snapshot.
 */
const mutate = (reduce: (current: CartLine[]) => CartLine[]): CartLine[] => {
  const next = reduce(readStoredLines());
  writeLines(next);
  return next;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Server markup shows the empty-cart placeholder; the first client render
  // already reads storage, so "hydrated" is simply "am I on the client".
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const addItem = useCallback((slug: string, quantity = 1): AddResult => {
    if (typeof slug !== "string" || !getProductBySlug(slug)) {
      console.error("addItem called with an unknown slug", { slug });
      return { ok: false, error: "That product is no longer available." };
    }

    const next = mutate((current) => addLine(current, slug, quantity));

    return {
      ok: true,
      quantity: quantityOfLine(next, slug),
    };
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    mutate((current) => setLineQuantity(current, slug, quantity));
  }, []);

  const removeItem = useCallback((slug: string) => {
    mutate((current) => removeLine(current, slug));
  }, []);

  const clearCart = useCallback(() => {
    writeLines(clearLines());
  }, []);

  const detailed = useMemo(() => detailLines(lines), [lines]);
  const count = useMemo(() => countLines(lines), [lines]);

  // Declared at the top level, not inside useMemo: a hook nested in a memo
  // factory is skipped whenever the deps are unchanged, which breaks hook order.
  const quantityOf = useCallback(
    (slug: string) => quantityOfLine(lines, slug),
    [lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      itemCount: count,
      subtotal: sumLines(detailed),
      savings: totalSavings(detailed),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      quantityOf,
      detailedLines: detailed,
    }),
    [
      lines,
      hydrated,
      count,
      detailed,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      quantityOf,
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