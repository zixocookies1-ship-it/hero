import { getProductBySlug, products, type Product } from "@/lib/products";

/**
 * Every lookup in this module takes an optional `catalogue` and falls back to
 * the shipped list when it is absent. The client passes the catalogue the root
 * layout loaded from the database; tests and any caller that has not loaded one
 * keep working against the shipped list, unchanged.
 */
export type Catalogue = readonly Product[];

/**
 * A cart line is stored as { slug, quantity } and nothing else.
 *
 * `slug` is the stable product identifier and the only identity used. Name,
 * image, price, weight and pack are deliberately NOT persisted: they are derived
 * from the catalogue at render time, so a stale price can never be shown to a
 * customer and can never reach the payment API. The server reprices the cart from
 * the catalogue again before creating a Razorpay order.
 *
 * This catalogue has one pack size per flavour (500g / Pack of 1), so there is no
 * variant axis today. If one is added, a variant needs its own slug rather than
 * being folded into display text, otherwise two sizes of one flavour would merge
 * into a single cart line.
 */
export type CartLine = {
  slug: string;
  quantity: number;
};

export const MAX_QUANTITY = 99;

export type CartDetail = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

/** Clamps to a whole number in [1, MAX_QUANTITY]. NaN and Infinity fall back to 1. */
export const clampQuantity = (value: unknown, fallback = 1): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(parsed)));
};

/**
 * The whole persisted cart: the lines plus any applied coupon code.
 *
 * Both live under one storage key so they are written in a single operation. Two
 * keys could desync if only one write succeeded, leaving a coupon applied to a
 * cart that no longer qualifies for it.
 */
export type StoredCartState = {
  lines: CartLine[];
  coupon: string | null;
};

const parseLineArray = (
  parsed: unknown,
  catalogue: Catalogue = products
): CartLine[] => {
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const lines: CartLine[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;

    const record = entry as Record<string, unknown>;
    const slug = record.slug;
    const quantity = Number(record.quantity);

    if (typeof slug !== "string" || !slug) continue;
    if (!Number.isFinite(quantity)) continue;
    if (!getProductBySlug(slug, catalogue)) continue;
    if (seen.has(slug)) continue;

    seen.add(slug);
    lines.push({ slug, quantity: clampQuantity(quantity) });
  }

  return lines;
};

/**
 * Parses persisted state defensively, supporting both the current object shape
 * and the original bare array of lines, so a cart saved before this change still
 * loads. Malformed entries are dropped rather than trusted, duplicates collapse
 * to the first occurrence, and slugs that no longer exist in the catalogue are
 * discarded so a deleted product cannot poison the cart.
 */
export const parseStoredState = (
  raw: string | null,
  catalogue: Catalogue = products
): StoredCartState => {
  if (!raw) return { lines: [], coupon: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { lines: [], coupon: null };
  }

  // Legacy shape: a bare array of lines, which carried no coupon.
  if (Array.isArray(parsed)) {
    return { lines: parseLineArray(parsed, catalogue), coupon: null };
  }

  if (!parsed || typeof parsed !== "object") {
    return { lines: [], coupon: null };
  }

  const record = parsed as Record<string, unknown>;
  const coupon =
    typeof record.coupon === "string" && record.coupon.trim() !== ""
      ? record.coupon.trim().toUpperCase()
      : null;

  return { lines: parseLineArray(record.lines, catalogue), coupon };
};

/**
 * Parses persisted lines defensively. Malformed entries are dropped rather than
 * trusted, duplicates collapse to the first occurrence, and slugs that no longer
 * exist in the catalogue are discarded so a deleted product cannot poison the cart.
 */
export const parseStoredLines = (
  raw: string | null,
  catalogue: Catalogue = products
): CartLine[] => parseStoredState(raw, catalogue).lines;

/**
 * Adds `quantity` to the line for `slug`, appending it when absent.
 *
 * This is the reducer form: the next array is derived purely from `lines`, so
 * repeated calls inside one tick cannot read a stale snapshot.
 */
export const addLine = (
  lines: CartLine[],
  slug: string,
  quantity = 1,
  catalogue: Catalogue = products
): CartLine[] => {
  if (!getProductBySlug(slug, catalogue)) return lines;

  const step = clampQuantity(quantity);
  const existing = lines.find((line) => line.slug === slug);

  if (!existing) return [...lines, { slug, quantity: step }];

  return lines.map((line) =>
    line.slug === slug ? { ...line, quantity: clampQuantity(line.quantity + step) } : line
  );
};

/**
 * Sets an absolute quantity. Zero, a negative value, NaN or Infinity removes the
 * line instead of storing an unusable row.
 */
export const setLineQuantity = (
  lines: CartLine[],
  slug: string,
  quantity: number,
  catalogue: Catalogue = products
): CartLine[] => {
  if (!getProductBySlug(slug, catalogue)) return lines;

  const requested = Number(quantity);
  if (!Number.isFinite(requested) || requested <= 0) {
    return lines.filter((line) => line.slug !== slug);
  }

  const safeQuantity = clampQuantity(requested);
  const exists = lines.some((line) => line.slug === slug);

  if (!exists) return [...lines, { slug, quantity: safeQuantity }];

  return lines.map((line) =>
    line.slug === slug ? { ...line, quantity: safeQuantity } : line
  );
};

export const removeLine = (lines: CartLine[], slug: string): CartLine[] =>
  lines.filter((line) => line.slug !== slug);

export const clearLines = (): CartLine[] => [];

export const quantityOfLine = (lines: CartLine[], slug: string): number =>
  lines.find((line) => line.slug === slug)?.quantity ?? 0;

/** Joins each line to its catalogue product. Unknown slugs are dropped. */
export const detailedLines = (
  lines: CartLine[],
  catalogue: Catalogue = products
): CartDetail[] =>
  lines.flatMap((line) => {
    const product = getProductBySlug(line.slug, catalogue);
    if (!product) return [];
    return [{ product, quantity: line.quantity, lineTotal: product.sellingPrice * line.quantity }];
  });

export const itemCount = (lines: CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.quantity, 0);

export const subtotal = (details: CartDetail[]): number =>
  details.reduce((sum, detail) => sum + detail.lineTotal, 0);

export const savings = (details: CartDetail[]): number =>
  details.reduce(
    (sum, detail) =>
      sum + (detail.product.mrp - detail.product.sellingPrice) * detail.quantity,
    0
  );

/** Product ids in cart order, for the server to reprice. */
export const cartPayload = (lines: CartLine[]) =>
  lines.map((line) => ({ slug: line.slug, quantity: line.quantity }));