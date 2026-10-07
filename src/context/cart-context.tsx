"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { getProductBySlug, type Product } from "@/lib/products";
import {
  addComboLine,
  addLine,
  cartEntries,
  clearLines,
  detailedLines as detailLines,
  itemCount as countLines,
  parseStoredState,
  quantityOfLine,
  removeLine,
  setComboLineQuantity,
  setLineQuantity,
  type CartDetail,
  type CartEntry,
  type CartLine,
  type StoredCartState,
} from "@/lib/cart";
import { comboCartSlug, comboIdFromCartSlug, isComboCartSlug, type Combo } from "@/lib/combos";

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
  addComboItem: (comboId: string, quantity?: number) => AddResult;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  quantityOf: (slug: string) => number;
  detailedLines: CartDetail[];
  /** Every cart row — catalogue products and combos — for cart/checkout views. */
  entries: CartEntry[];
  /** Coupon the shopper has applied, persisted so it survives navigation. */
  couponCode: string | null;
  setCouponCode: (code: string | null) => void;
};

/**
 * localStorage is the single source of truth for this project's guest cart. The
 * one provider in the app root layout makes header, product cards, cart page,
 * checkout and buy-now all read the same state.
 *
 * The provider is handed the catalogue the root layout loaded from the
 * database. Slugs are validated and lines are priced against it, so a product
 * the admin added becomes purchasable and one they removed stops validating —
 * without the client ever reaching for the shipped list on its own.
 */
const STORAGE_KEY = "cart";
const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_LINES: CartLine[] = [];
const EMPTY_STATE: StoredCartState = { lines: EMPTY_LINES, coupon: null };

/**
 * useSyncExternalStore requires a referentially stable snapshot, so the parsed
 * result is cached against the exact raw string. Identical storage contents must
 * return the same array instance or React re-renders in a loop. The whole state
 * is cached rather than just the lines, so lines and coupon always come from one
 * consistent parse of the same write.
 *
 * The catalogue is part of the cache key: the same cart parsed against a
 * catalogue the admin just changed must not return the previous parse.
 */
let cachedRaw: string | null = null;
let cachedCatalogue: readonly Product[] | null = null;
let cachedState: StoredCartState = EMPTY_STATE;
let cachePrimed = false;

const readStoredState = (catalogue: readonly Product[]): StoredCartState => {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_STATE;
  }

  if (
    cachePrimed &&
    raw === cachedRaw &&
    catalogue === cachedCatalogue
  ) {
    return cachedState;
  }

  cachedRaw = raw;
  cachedCatalogue = catalogue;
  cachedState = parseStoredState(raw, catalogue);
  cachePrimed = true;
  return cachedState;
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

// The server cannot read localStorage; it renders the empty-cart placeholder and
// the first client render picks up the real cart.
const getServerSnapshot = (): CartLine[] => EMPTY_LINES;
const getServerCouponSnapshot = (): string | null => null;

/**
 * Lines and coupon are written as one object under one key in a single setItem.
 * Two keys could desync if only one write succeeds, leaving a coupon applied to a
 * cart that no longer qualifies for it. The coupon rides along as a plain string,
 * which is referentially stable for useSyncExternalStore.
 */
const writeState = (next: StoredCartState) => {
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
 * clicks in one tick cannot both act on a stale snapshot. The existing coupon is
 * carried through untouched, so editing a quantity never silently drops a discount
 * that is still valid.
 */
const mutate = (
  catalogue: readonly Product[],
  reduce: (current: CartLine[]) => CartLine[]
): CartLine[] => {
  const current = readStoredState(catalogue);
  const nextLines = reduce(current.lines);
  writeState({ lines: nextLines, coupon: current.coupon });
  return nextLines;
};

const writeCoupon = (catalogue: readonly Product[], code: string | null) => {
  writeState({ lines: readStoredState(catalogue).lines, coupon: code });
};

export function CartProvider({
  children,
  catalogue,
  combos = [],
}: {
  children: React.ReactNode;
  catalogue: readonly Product[];
  /** Every combo (active + inactive) so cart lines price safely against it. */
  combos?: readonly Combo[];
}) {
  const readState = useCallback(
    () => readStoredState(catalogue),
    [catalogue]
  );
  const getSnapshot = useCallback(() => readState().lines, [readState]);
  const getCouponSnapshot = useCallback(() => readState().coupon, [readState]);

  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Server markup shows the empty-cart placeholder; the first client render
  // already reads storage, so "hydrated" is simply "am I on the client".
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const addItem = useCallback(
    (slug: string, quantity = 1): AddResult => {
      if (typeof slug !== "string" || isComboCartSlug(slug)) {
        console.error("addItem called with an unknown slug", { slug });
        return { ok: false, error: "That product is no longer available." };
      }
      if (!getProductBySlug(slug, catalogue)) {
        console.error("addItem called with an unknown slug", { slug });
        return { ok: false, error: "That product is no longer available." };
      }

      const next = mutate(catalogue, (current) =>
        addLine(current, slug, quantity, catalogue)
      );

      return {
        ok: true,
        quantity: quantityOfLine(next, slug),
      };
    },
    [catalogue]
  );

  const addComboItem = useCallback(
    (comboId: string, quantity = 1): AddResult => {
      const combo = combos.find((entry) => entry.id === comboId);
      if (!combo) {
        console.error("addComboItem called with an unknown combo", { comboId });
        return { ok: false, error: "That combo is no longer available." };
      }

      const next = mutate(catalogue, (current) =>
        addComboLine(current, combo, quantity, combos)
      );

      return {
        ok: true,
        quantity: quantityOfLine(next, comboCartSlug(comboId)),
      };
    },
    [combos, catalogue]
  );

  const setQuantity = useCallback(
    (slug: string, quantity: number) => {
      mutate(catalogue, (current) => {
        if (isComboCartSlug(slug)) {
          const comboId = comboIdFromCartSlug(slug);
          if (comboId) return setComboLineQuantity(current, comboId, quantity, combos);
        }
        return setLineQuantity(current, slug, quantity, catalogue);
      });
    },
    [catalogue, combos]
  );

  const removeItem = useCallback(
    (slug: string) => {
      mutate(catalogue, (current) => removeLine(current, slug));
    },
    [catalogue]
  );

  const clearCart = useCallback(() => {
    // One write clears both: an emptied cart cannot satisfy a minimum-order rule,
    // so the coupon must not outlive the lines it was applied to.
    writeState({ lines: clearLines(), coupon: null });
  }, []);

  const couponCode = useSyncExternalStore(
    subscribe,
    getCouponSnapshot,
    getServerCouponSnapshot
  );

  const setCouponCode = useCallback(
    (code: string | null) => {
      writeCoupon(
        catalogue,
        typeof code === "string" && code.trim() !== "" ? code.trim().toUpperCase() : null
      );
    },
    [catalogue]
  );

  const detailed = useMemo(
    () => detailLines(lines, catalogue),
    [lines, catalogue]
  );
  const entries = useMemo(
    () => cartEntries(lines, catalogue, combos),
    [lines, catalogue, combos]
  );
  const count = useMemo(() => countLines(lines), [lines]);

  // Derived totals read every entry so a combo contributes its own price, not
  // just its catalogue value. Both reducers are local to avoid re-allocating.
  const totals = useMemo(() => {
    let subtotalValue = 0;
    let savingsValue = 0;
    for (const entry of entries) {
      const mrp = entry.kind === "combo" ? entry.combo.mrpInr : entry.product.mrp;
      const unit = entry.kind === "combo" ? entry.combo.priceInr : entry.product.sellingPrice;
      subtotalValue += entry.lineTotal;
      savingsValue += (mrp - unit) * entry.quantity;
    }
    return { subtotalValue, savingsValue };
  }, [entries]);

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
      subtotal: totals.subtotalValue,
      savings: totals.savingsValue,
      addItem,
      addComboItem,
      setQuantity,
      removeItem,
      clearCart,
      quantityOf,
      detailedLines: detailed,
      entries,
      couponCode,
      setCouponCode,
    }),
    [
      lines,
      hydrated,
      count,
      totals,
      detailed,
      entries,
      addItem,
      addComboItem,
      setQuantity,
      removeItem,
      clearCart,
      quantityOf,
      couponCode,
      setCouponCode,
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
