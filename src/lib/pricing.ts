import { getProductBySlug, products, type Product } from "@/lib/products";
import { comboIdFromCartSlug, isComboCartSlug, type Combo } from "@/lib/combos";

export type CartInputLine = { slug: string; quantity: number; kind?: "product" | "combo" };

export type PricedLine = {
  slug: string;
  name: string;
  image: string;
  quantity: number;
  weight: string;
  pack: string;
  mrp: number;
  unitPrice: number;
  lineTotal: number;
  /** "combo" for a bundle line, absent for a catalogue product. */
  kind?: "product" | "combo";
  /** Combo object id when this line is a bundle. */
  comboId?: string;
};

export type Pricing = {
  lines: PricedLine[];
  itemCount: number;
  mrpTotal: number;
  /** Discount already applied to MRP by the catalogue (mrpTotal - subtotal). */
  productDiscount: number;
  subtotal: number;
  couponDiscount: number;
  /** Normalised code that produced `couponDiscount`, or null. */
  couponCode: string | null;
  deliveryFee: number;
  shippingFree: boolean;
  total: number;
  /** Same total expressed in paise, which is what Razorpay expects. */
  totalInPaise: number;
};

export class PricingError extends Error {
  constructor(
    message: string,
    readonly code:
      | "empty_cart"
      | "unknown_product"
      | "invalid_quantity"
      | "out_of_stock"
  ) {
    super(message);
    this.name = "PricingError";
  }
}

export const MAX_QUANTITY_PER_LINE = 20;

const toPaise = (rupees: number): number => Math.round(rupees * 100);

/**
 * Delivery rules come from one centrally configured source. The live flow reads
 * the MongoDB `shippingconfigurations` document through loadShippingPolicy()
 * (lib/cms.ts) and hands the result in as `policy`; this env-based function is
 * the fallback that keeps tests and an unseeded database working. The amount is
 * never hard-coded per request, and never taken from the browser.
 */
export function getShippingPolicy(env: NodeJS.ProcessEnv = process.env) {
  const fee = Number(env.SHIPPING_FEE_INR ?? "49");
  const thresholdRaw = env.FREE_SHIPPING_THRESHOLD_INR;

  return {
    feeInr: Number.isFinite(fee) && fee >= 0 ? fee : 49,
    // No threshold configured means shipping is always charged.
    freeAboveInr:
      thresholdRaw === undefined || thresholdRaw === ""
        ? null
        : Number.isFinite(Number(thresholdRaw))
          ? Number(thresholdRaw)
          : null,
  };
}

/**
 * Turns a browser-supplied cart into a priced order using only catalogue values
 * looked up on the server. Any price, discount or shipping figure supplied by
 * the client is ignored entirely.
 *
 * `combos` is the full (active + inactive) combo list from the database; a
 * combo line is looked up there and rejected when missing or unpublished, the
 * same way an unknown product slug rejects. `policy` overrides the env-derived
 * shipping rule when the caller has loaded the live configuration.
 */
export function priceCart(
  input: CartInputLine[],
  env: NodeJS.ProcessEnv = process.env,
  catalogue: readonly Product[] = products,
  combos: readonly Combo[] = [],
  policy?: { feeInr: number; freeAboveInr: number | null }
): Pricing {
  const usable = input.filter((line) => line && typeof line.slug === "string");

  if (usable.length === 0) {
    throw new PricingError("Your cart is empty.", "empty_cart");
  }

  const lines: PricedLine[] = usable.map((line) => {
    const isComboLine = line.kind === "combo" || isComboCartSlug(line.slug);

    if (isComboLine) {
      const comboId = comboIdFromCartSlug(line.slug);
      const combo: Combo | undefined = combos.find((entry) => entry.id === comboId);
      if (!combo || !combo.isActive) {
        throw new PricingError(
          `A combo in your cart is no longer available: ${line.slug}.`,
          "unknown_product"
        );
      }

      const quantity = Number(line.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
        throw new PricingError(`Invalid quantity for ${combo.name}.`, "invalid_quantity");
      }

      const comboCount = combo.items.length;
      return {
        slug: line.slug,
        name: combo.name,
        image: combo.image,
        quantity,
        weight: comboCount > 0 ? `${comboCount} items` : "combo",
        pack: "1 set",
        mrp: combo.mrpInr,
        unitPrice: combo.priceInr,
        lineTotal: combo.priceInr * quantity,
        kind: "combo",
        comboId: combo.id,
      };
    }

    const product: Product | undefined = getProductBySlug(line.slug, catalogue);
    if (!product) {
      throw new PricingError(
        `A product in your cart is no longer available: ${line.slug}.`,
        "unknown_product"
      );
    }

    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new PricingError(
        `Invalid quantity for ${product.name}.`,
        "invalid_quantity"
      );
    }

    if (!product.inStock) {
      throw new PricingError(`${product.name} is out of stock.`, "out_of_stock");
    }

    return {
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      quantity,
      weight: product.weight,
      pack: product.pack,
      mrp: product.mrp,
      unitPrice: product.sellingPrice,
      lineTotal: product.sellingPrice * quantity,
    };
  });

  const mrpTotal = lines.reduce((sum, line) => sum + line.mrp * line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  // Coupons are resolved against the database before pricing is finalised, then
  // folded in with applyCoupon(). A bare cart therefore never has a discount.
  const couponDiscount = 0;
  const couponCode = null;

  const activePolicy = policy ?? getShippingPolicy(env);
  const shippingFree =
    activePolicy.freeAboveInr !== null && subtotal >= activePolicy.freeAboveInr;
  const deliveryFee = shippingFree ? 0 : activePolicy.feeInr;

  const total = Math.max(0, subtotal - couponDiscount + deliveryFee);

  return {
    lines,
    itemCount,
    mrpTotal,
    productDiscount: mrpTotal - subtotal,
    subtotal,
    couponDiscount,
    couponCode,
    deliveryFee,
    shippingFree,
    total,
    totalInPaise: toPaise(total),
  };
}

/**
 * Folds an already-resolved coupon discount into a priced cart.
 *
 * The discount is clamped to the subtotal here as well as in evaluateCoupon(),
 * because this is the function that produces the number that gets charged. The
 * free-shipping threshold deliberately still reads the pre-discount subtotal, so
 * a coupon cannot tip an order under the threshold and remove the delivery fee
 * that the shopper did not earn.
 */
export function applyCoupon(
  pricing: Pricing,
  discountInr: number,
  code: string | null
): Pricing {
  const requested = Number(discountInr);
  const safe = Number.isFinite(requested) ? requested : 0;
  const couponDiscount = Math.max(0, Math.min(Math.round(safe), Math.floor(pricing.subtotal)));

  if (couponDiscount === 0) return pricing;

  const total = Math.max(0, pricing.subtotal - couponDiscount + pricing.deliveryFee);

  return {
    ...pricing,
    couponDiscount,
    couponCode: code && code.trim() ? code.trim().toUpperCase() : null,
    total,
    totalInPaise: toPaise(total),
  };
}

export const catalogueSlugs = products.map((product) => product.slug);