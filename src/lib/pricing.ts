import { getProductBySlug, products, type Product } from "@/lib/products";

export type CartInputLine = { slug: string; quantity: number };

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
};

export type Pricing = {
  lines: PricedLine[];
  itemCount: number;
  mrpTotal: number;
  /** Discount already applied to MRP by the catalogue (mrpTotal - subtotal). */
  productDiscount: number;
  subtotal: number;
  couponDiscount: number;
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
 * Delivery rules come from the environment so the amount charged always matches
 * one centrally configured value. Never hard-coded per request, and never taken
 * from the browser.
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
 */
export function priceCart(
  input: CartInputLine[],
  env: NodeJS.ProcessEnv = process.env
): Pricing {
  const usable = input.filter((line) => line && typeof line.slug === "string");

  if (usable.length === 0) {
    throw new PricingError("Your cart is empty.", "empty_cart");
  }

  const lines: PricedLine[] = usable.map((line) => {
    const product: Product | undefined = getProductBySlug(line.slug);
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

  // Coupons are not enabled yet, so there is never a coupon discount. The field
  // exists so the server total and the stored order stay correct when it lands.
  const couponDiscount = 0;

  const policy = getShippingPolicy(env);
  const shippingFree = policy.freeAboveInr !== null && subtotal >= policy.freeAboveInr;
  const deliveryFee = shippingFree ? 0 : policy.feeInr;

  const total = Math.max(0, subtotal - couponDiscount + deliveryFee);

  return {
    lines,
    itemCount,
    mrpTotal,
    productDiscount: mrpTotal - subtotal,
    subtotal,
    couponDiscount,
    deliveryFee,
    shippingFree,
    total,
    totalInPaise: toPaise(total),
  };
}

export const catalogueSlugs = products.map((product) => product.slug);