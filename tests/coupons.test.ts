/**
 * Offline cover for the coupon rules and for folding a resolved discount into a
 * priced cart.
 *
 * These are deliberately pure: no Prisma, no HTTP. The rules are the part that
 * decides whether money comes off, so they are exercised here rather than behind
 * a request, and the same functions run again in create-order before the total is
 * charged. Run with: npx tsx --test tests/coupons.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  describeCoupon,
  evaluateCoupon,
  normaliseCouponCode,
  type CouponRecord,
  type CouponResult,
} from "../src/lib/coupons";
import { applyCoupon, priceCart } from "../src/lib/pricing";
import { products } from "../src/lib/products";

const baseCoupon = (overrides: Partial<CouponRecord> = {}): CouponRecord => ({
  code: "SAVE10",
  discountType: "percentage",
  discountValue: 10,
  minimumOrderAmount: null,
  usageLimit: null,
  usedCount: 0,
  expiresAt: null,
  active: true,
  ...overrides,
});

const acceptance = (result: CouponResult) => {
  assert.equal(
    result.ok,
    true,
    `expected an acceptance, got: ${JSON.stringify(result)}`
  );
  if (!result.ok) throw new Error("unreachable");
  return result;
};

const rejection = (result: CouponResult) => {
  assert.equal(
    result.ok,
    false,
    `expected a rejection, got: ${JSON.stringify(result)}`
  );
  if (result.ok) throw new Error("unreachable");
  return result;
};

const NOW = new Date("2026-01-15T10:00:00.000Z");

const cartEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  SHIPPING_FEE_INR: "49",
  FREE_SHIPPING_THRESHOLD_INR: "1000",
};

const oneLineCart = () => [{ slug: products[0].slug, quantity: 1 }];

// 1. Code normalisation.
test("codes are trimmed and upper-cased so casing never blocks a match", () => {
  assert.equal(normaliseCouponCode("  save10 "), "SAVE10");
  assert.equal(normaliseCouponCode("SAVE10"), "SAVE10");
  assert.equal(normaliseCouponCode(undefined), "");
  assert.equal(normaliseCouponCode(42), "");
  assert.equal(normaliseCouponCode({}), "");
});

// 2. Every rejection path, in the order they are checked.
test("an empty code is rejected before anything is looked up", () => {
  assert.equal(rejection(evaluateCoupon(baseCoupon(), "", 500)).reason, "empty_code");
  assert.equal(rejection(evaluateCoupon(baseCoupon(), "   ", 500)).reason, "empty_code");
  assert.equal(rejection(evaluateCoupon(null, "", 500)).reason, "empty_code");
});

test("an unknown code says so instead of failing silently", () => {
  const result = rejection(evaluateCoupon(null, "nope", 500));

  assert.equal(result.reason, "not_found");
  assert.equal(result.code, "NOPE", "the typed code is normalised even on a miss");
  assert.match(result.message, /coupon/i);
});

test("a deactivated coupon cannot be used", () => {
  const result = rejection(
    evaluateCoupon(baseCoupon({ active: false }), "save10", 500, NOW)
  );

  assert.equal(result.reason, "inactive");
  assert.equal(result.code, "SAVE10");
});

test("an expired coupon is refused, including at the exact expiry instant", () => {
  const expired = rejection(
    evaluateCoupon(
      baseCoupon({ expiresAt: new Date("2026-01-14T00:00:00.000Z") }),
      "SAVE10",
      500,
      NOW
    )
  );
  assert.equal(expired.reason, "expired");

  // An expiry of exactly "now" is past: offers end at the stated moment, not
  // one tick after it.
  assert.equal(
    rejection(evaluateCoupon(baseCoupon({ expiresAt: NOW }), "SAVE10", 500, NOW)).reason,
    "expired"
  );

  acceptance(
    evaluateCoupon(
      baseCoupon({ expiresAt: new Date("2026-01-16T00:00:00.000Z") }),
      "SAVE10",
      500,
      NOW
    )
  );
});

test("a fully consumed coupon cannot be used again", () => {
  assert.equal(
    rejection(
      evaluateCoupon(baseCoupon({ usageLimit: 5, usedCount: 5 }), "SAVE10", 500, NOW)
    ).reason,
    "usage_limit_reached"
  );

  // One left: the same rules now let it through.
  const available = acceptance(
    evaluateCoupon(baseCoupon({ usageLimit: 5, usedCount: 4 }), "SAVE10", 500, NOW)
  );
  assert.equal(available.discountInr, 50);
});

test("a cart below the minimum does not earn the discount", () => {
  const result = rejection(
    evaluateCoupon(
      baseCoupon({ minimumOrderAmount: 1000 }),
      "SAVE10",
      999,
      NOW
    )
  );

  assert.equal(result.reason, "minimum_order");
  assert.match(result.message, /1000/, "the shopper is told the figure to reach");

  const qualifies = acceptance(
    evaluateCoupon(baseCoupon({ minimumOrderAmount: 1000 }), "SAVE10", 1000, NOW)
  );
  assert.equal(qualifies.discountInr, 100, "the boundary itself qualifies");
});

// 3. The maths.
test("percentage coupons are calculated against the subtotal", () => {
  assert.equal(
    acceptance(
      evaluateCoupon(baseCoupon({ discountValue: 10 }), "SAVE10", 999, NOW)
    ).discountInr,
    100,
    "99.9 rounds to the nearest rupee"
  );

  assert.equal(
    acceptance(
      evaluateCoupon(
        baseCoupon({ discountType: "percentage", discountValue: 25 }),
        "SAVE10",
        200,
        NOW
      )
    ).discountInr,
    50
  );

  assert.equal(
    acceptance(
      evaluateCoupon(
        baseCoupon({ discountType: "percentage", discountValue: 100 }),
        "SAVE10",
        750,
        NOW
      )
    ).discountInr,
    750,
    "a full discount still stops at the subtotal"
  );
});

test("fixed coupons are a flat rupee amount", () => {
  const result = acceptance(
    evaluateCoupon(
      baseCoupon({ discountType: "fixed", discountValue: 150 }),
      "FLAT",
      500,
      NOW
    )
  );

  assert.equal(result.discountInr, 150);
  assert.equal(result.description, "₹150 off");
});

test("a fixed coupon larger than the cart cannot become store credit", () => {
  const result = acceptance(
    evaluateCoupon(
      baseCoupon({ discountType: "fixed", discountValue: 5000 }),
      "BIG",
      400,
      NOW
    )
  );

  assert.equal(result.discountInr, 400, "the discount stops at the subtotal");
  assert.ok(result.discountInr <= 400, "a total never goes below zero");
});

// 4. Misconfigured coupons are refused rather than honoured loosely.
test("a percentage over 100 is a configuration error, not a payout", () => {
  const result = rejection(
    evaluateCoupon(baseCoupon({ discountValue: 150 }), "SAVE10", 500, NOW)
  );

  assert.equal(result.reason, "invalid_discount");
});

test("zero, negative and unknown discount setups are refused", () => {
  assert.equal(
    rejection(evaluateCoupon(baseCoupon({ discountValue: 0 }), "X", 500, NOW)).reason,
    "invalid_discount"
  );
  assert.equal(
    rejection(evaluateCoupon(baseCoupon({ discountValue: -10 }), "X", 500, NOW)).reason,
    "invalid_discount"
  );
  assert.equal(
    rejection(
      evaluateCoupon(baseCoupon({ discountValue: Number.NaN }), "X", 500, NOW)
    ).reason,
    "invalid_discount"
  );
  assert.equal(
    rejection(
      evaluateCoupon(baseCoupon({ discountType: "bogus", discountValue: 10 }), "X", 500, NOW)
    ).reason,
    "invalid_discount"
  );
});

// 5. What gets written to the order.
test("the order keeps the stored code, not whatever casing the shopper typed", () => {
  const result = acceptance(
    evaluateCoupon(baseCoupon({ code: "save10" }), " SaVe10 ", 500, NOW)
  );

  assert.equal(result.code, "SAVE10");
  assert.equal(result.description, "10% off");
});

test("describeCoupon reads from the discount type", () => {
  assert.equal(describeCoupon(baseCoupon({ discountValue: 10 })), "10% off");
  assert.equal(
    describeCoupon(baseCoupon({ discountType: "fixed", discountValue: 99 })),
    "₹99 off"
  );
});

// 6. Folding a resolved discount into a priced cart.
test("a bare cart never carries a coupon discount", () => {
  const priced = priceCart(oneLineCart(), cartEnv);

  assert.equal(priced.couponDiscount, 0);
  assert.equal(priced.couponCode, null);
});

test("applyCoupon clamps and normalises the figure it is handed", () => {
  const priced = priceCart(oneLineCart(), cartEnv);

  assert.equal(
    applyCoupon(priced, 999999, "BIG").couponDiscount,
    Math.floor(priced.subtotal),
    "an oversized discount cannot exceed the subtotal"
  );
  assert.equal(applyCoupon(priced, -50, "NEG").couponDiscount, 0);
  assert.equal(applyCoupon(priced, Number.NaN, "NAN").couponDiscount, 0);
  assert.equal(applyCoupon(priced, 0, "ZERO").couponCode, null);

  const applied = applyCoupon(priced, 1, " lower ");
  assert.equal(applied.couponCode, "LOWER");
  assert.equal(applied.total, priced.subtotal - 1 + priced.deliveryFee);
});

test("a coupon cannot claw back a free delivery the cart already earned", () => {
  const baseline = priceCart(oneLineCart(), cartEnv);
  const atThreshold = {
    ...cartEnv,
    FREE_SHIPPING_THRESHOLD_INR: String(baseline.subtotal),
  };

  const priced = priceCart(oneLineCart(), atThreshold);
  assert.equal(priced.deliveryFee, 0, "the cart meets the threshold on its own");

  const couponed = applyCoupon(priced, Math.floor(priced.subtotal / 2), "HALF");

  assert.ok(couponed.total < priced.total, "the coupon really does apply");
  assert.equal(couponed.deliveryFee, 0, "the fee must not come back");
  assert.equal(couponed.shippingFree, true);
});

test("a coupon does not grant a free delivery the cart never earned", () => {
  const baseline = priceCart(oneLineCart(), cartEnv);
  const farAboveThreshold = {
    ...cartEnv,
    FREE_SHIPPING_THRESHOLD_INR: String(baseline.subtotal + 1_000_000),
  };

  const priced = priceCart(oneLineCart(), farAboveThreshold);
  assert.ok(priced.deliveryFee > 0, "this cart owes delivery");

  // Even wiping the goods entirely cannot make delivery free.
  const couponed = applyCoupon(priced, priced.subtotal, "WIPED");

  assert.equal(couponed.deliveryFee, priced.deliveryFee);
  assert.equal(couponed.shippingFree, false);
  assert.equal(couponed.total, priced.deliveryFee, "only the fee remains");
});
