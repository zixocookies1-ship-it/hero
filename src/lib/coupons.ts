/**
 * Coupon rules.
 *
 * This module is deliberately pure: no Prisma, no request, no environment. The
 * rules are the part that decides whether money comes off, so they are kept
 * separate from where the coupon row is fetched and are unit-tested offline.
 *
 * The browser never decides a discount. It asks the server what a code is worth,
 * and the server runs exactly this code again when the order is actually created,
 * so a tampered client cannot lower a total.
 */

/** The fields of a stored Coupon row this module needs. */
export type CouponRecord = {
  code: string;
  discountType: string;
  discountValue: number;
  minimumOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
};

export type CouponRejection =
  | "empty_code"
  | "not_found"
  | "inactive"
  | "expired"
  | "usage_limit_reached"
  | "minimum_order"
  | "invalid_discount";

export type CouponResult =
  | {
      ok: true;
      /** Normalised, upper-cased code. What gets stored on the order. */
      code: string;
      discountInr: number;
      /** Short human label, e.g. "10% off". */
      description: string;
    }
  | { ok: false; code: string; reason: CouponRejection; message: string };

/** Codes are matched case-insensitively and ignore surrounding whitespace. */
export function normaliseCouponCode(code: unknown): string {
  if (typeof code !== "string") return "";
  return code.trim().toUpperCase();
}

const RUPEE = (value: number): string => `₹${value}`;

/** Short label for the shopper, e.g. "10% off" or "₹50 off". */
export function describeCoupon(coupon: CouponRecord): string {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}% off`;
  }
  return `${RUPEE(coupon.discountValue)} off`;
}

/**
 * Works out what a coupon is worth against a given subtotal.
 *
 * `coupon` is null when no row matched the code. Every rejection carries a reason
 * and a sentence the shopper can act on, rather than a generic "invalid coupon".
 */
export function evaluateCoupon(
  coupon: CouponRecord | null,
  rawCode: string,
  subtotalInr: number,
  now: Date = new Date()
): CouponResult {
  const code = normaliseCouponCode(rawCode);

  if (!code) {
    return { ok: false, code, reason: "empty_code", message: "Enter a coupon code." };
  }

  if (!coupon) {
    return {
      ok: false,
      code,
      reason: "not_found",
      message: "We could not find that coupon code. Check it and try again.",
    };
  }

  // The stored code is authoritative for what gets written to the order, so a
  // lowercase row still normalises rather than failing the lookup result.
  const canonical = normaliseCouponCode(coupon.code) || code;

  if (!coupon.active) {
    return {
      ok: false,
      code: canonical,
      reason: "inactive",
      message: "That coupon is no longer active.",
    };
  }

  if (coupon.expiresAt !== null && coupon.expiresAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      code: canonical,
      reason: "expired",
      message: "That coupon has expired.",
    };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return {
      ok: false,
      code: canonical,
      reason: "usage_limit_reached",
      message: "That coupon has already been used its full number of times.",
    };
  }

  if (coupon.minimumOrderAmount !== null && subtotalInr < coupon.minimumOrderAmount) {
    return {
      ok: false,
      code: canonical,
      reason: "minimum_order",
      message: `That coupon needs a minimum order of ${RUPEE(coupon.minimumOrderAmount)}.`,
    };
  }

  const value = Number(coupon.discountValue);

  if (!Number.isFinite(value) || value <= 0) {
    return {
      ok: false,
      code: canonical,
      reason: "invalid_discount",
      message: "That coupon is not set up correctly. Please contact us.",
    };
  }

  let discountInr: number;

  if (coupon.discountType === "percentage") {
    if (value > 100) {
      return {
        ok: false,
        code: canonical,
        reason: "invalid_discount",
        message: "That coupon is not set up correctly. Please contact us.",
      };
    }
    discountInr = Math.round((subtotalInr * value) / 100);
  } else if (coupon.discountType === "fixed") {
    discountInr = Math.round(value);
  } else {
    return {
      ok: false,
      code: canonical,
      reason: "invalid_discount",
      message: "That coupon is not set up correctly. Please contact us.",
    };
  }

  // Never discount past zero: a fixed coupon larger than the cart must not turn
  // into store credit, and shipping must not become payable by the customer.
  discountInr = Math.max(0, Math.min(discountInr, Math.floor(subtotalInr)));

  return { ok: true, code: canonical, discountInr, description: describeCoupon(coupon) };
}
